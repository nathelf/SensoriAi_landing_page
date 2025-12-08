// Vercel Serverless Function - Chat endpoint
import cors from 'cors';

const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*'];
    
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
});

// Rate limiting simples (em memória)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

function normalizeMessages(msgs) {
  if (!Array.isArray(msgs)) return [];
  
  return msgs
    .filter(m => m && typeof m === 'object')
    .map(m => {
      const role = m.role === 'user' || m.role === 'assistant' || m.role === 'system' 
        ? m.role 
        : 'user';
      let content = String(m.content || '').slice(0, 10000);
      return { role, content };
    })
    .filter(m => m.content && m.content.trim().length > 0);
}

async function fetchWithRetry(url, options = {}, retries = 3, timeoutMs = 30000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return resp;
    } catch (err) {
      clearTimeout(id);
      if (attempt === retries) {
        const finalError = new Error(`Failed to fetch after ${retries} attempts: ${err.message}`);
        finalError.cause = err;
        throw finalError;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

export default async function handler(req, res) {
  // CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: "rate_limit_exceeded", 
      userMessage: "Muitas requisições. Por favor, aguarde um momento antes de tentar novamente." 
    });
  }

  try {
    const { messages, sessionId, save = false, model = "gpt-4o-mini" } = req.body;

    // Validação
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages (array) required" });
    }
    
    if (messages.length > 50) {
      return res.status(400).json({ error: "too_many_messages", userMessage: "Número máximo de mensagens excedido (50)" });
    }
    
    const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'claude-3-haiku', 'claude-3-sonnet'];
    const safeModel = allowedModels.includes(model) ? model : 'gpt-4o-mini';
    
    const normalizedMessages = normalizeMessages(messages);
    if (normalizedMessages.length === 0) {
      return res.status(400).json({ error: "no_valid_messages", userMessage: "Nenhuma mensagem válida encontrada" });
    }

    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY?.trim();
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    if (!OPENROUTER_KEY || OPENROUTER_KEY.length === 0) {
      return res.status(500).json({ error: "api_key_not_configured", userMessage: "Chave de API não configurada no servidor." });
    }

    const payload = { model: safeModel, messages: normalizedMessages, temperature: 0.2, stream: false };

    let response;
    try {
      response = await fetchWithRetry(OPENROUTER_API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": process.env.OPENROUTER_REFERER || process.env.VERCEL_URL || "https://sensoriai.vercel.app",
          "X-Title": "SensoriAI Agro Insight"
        },
        body: JSON.stringify(payload),
      }, 3, 30000);
    } catch (err) {
      const errorMsg = err?.message || String(err);
      const errorCode = err?.code || 'UNKNOWN';
      
      let userMessage = "Erro de conexão com o serviço de IA. Verifique sua conexão com a internet.";
      if (errorCode === 'ECONNREFUSED' || errorMsg.includes('ECONNREFUSED')) {
        userMessage = "Não foi possível conectar ao servidor da API.";
      } else if (errorCode === 'ENOTFOUND' || errorMsg.includes('ENOTFOUND')) {
        userMessage = "Não foi possível resolver o endereço do servidor.";
      } else if (errorCode === 'ETIMEDOUT' || errorMsg.includes('timeout')) {
        userMessage = "Tempo de espera esgotado. Tente novamente.";
      }
      
      return res.status(502).json({ 
        error: "fetch_failed", 
        detail: errorMsg,
        code: errorCode,
        userMessage: userMessage
      });
    }

    const text = await response.text();
    if (!response.ok) {
      let errorDetail = text;
      try {
        const errorObj = JSON.parse(text);
        if (errorObj.error?.message) {
          errorDetail = errorObj.error.message;
        } else if (errorObj.error) {
          errorDetail = typeof errorObj.error === 'string' ? errorObj.error : JSON.stringify(errorObj.error);
        }
      } catch (e) {
        // keep original text
      }
      
      let userMessage = "Erro ao conectar com o serviço de IA.";
      if (response.status === 401) {
        userMessage = "Chave de API do OpenRouter inválida ou não configurada.";
      } else if (response.status === 429) {
        userMessage = "Limite de requisições excedido. Tente novamente em alguns instantes.";
      } else if (response.status >= 500) {
        userMessage = "Serviço de IA temporariamente indisponível. Tente novamente mais tarde.";
      }
      
      return res.status(response.status).json({ 
        error: "openrouter_error", 
        detail: errorDetail,
        userMessage: userMessage
      });
    }

    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* keep text fallback */ }

    const assistant = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? text;

    return res.json({ assistant, raw: data ?? text });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: "internal_error", detail: String(err) });
  }
}

