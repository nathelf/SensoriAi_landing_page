// Vercel Serverless Function - Streaming endpoint
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

// Rate limiting
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
      if (attempt === retries) throw err;
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
    res.write(`event: error\ndata: ${JSON.stringify({ error: "rate_limit_exceeded", userMessage: "Muitas requisições. Aguarde um momento." })}\n\n`);
    res.end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, sessionId, model = "gpt-4o-mini" } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "messages array required", userMessage: "Formato de mensagens inválido" })}\n\n`);
      res.end();
      return;
    }
    
    if (messages.length > 50) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "too_many_messages", userMessage: "Número máximo de mensagens excedido (50)" })}\n\n`);
      res.end();
      return;
    }
    
    const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'claude-3-haiku', 'claude-3-sonnet'];
    const safeModel = allowedModels.includes(model) ? model : 'gpt-4o-mini';
    
    const normalizedMessages = normalizeMessages(messages);
    if (normalizedMessages.length === 0) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "no_valid_messages", userMessage: "Nenhuma mensagem válida encontrada" })}\n\n`);
      res.end();
      return;
    }

    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY?.trim();
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    if (!OPENROUTER_KEY || OPENROUTER_KEY.length === 0) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "api_key_not_configured", userMessage: "Chave de API não configurada" })}\n\n`);
      res.end();
      return;
    }

    const payload = { model: safeModel, messages: normalizedMessages, temperature: 0.2, stream: true };

    let upstream;
    try {
      upstream = await fetchWithRetry(OPENROUTER_API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": process.env.OPENROUTER_REFERER || process.env.VERCEL_URL || "https://sensoriai.vercel.app",
          "X-Title": "SensoriAI Agro Insight"
        },
        body: JSON.stringify(payload),
      }, 3, 30000);
    } catch (fetchErr) {
      const errorMsg = fetchErr?.message || String(fetchErr);
      const errorCode = fetchErr?.code || 'UNKNOWN';
      
      let userMessage = "Erro de conexão com o serviço de IA.";
      if (errorCode === 'ENOTFOUND') {
        userMessage = "Não foi possível resolver o endereço do servidor.";
      } else if (errorCode === 'ETIMEDOUT') {
        userMessage = "Tempo de espera esgotado.";
      }
      
      res.write(`event: error\ndata: ${JSON.stringify({ error: "fetch_failed", detail: errorMsg, code: errorCode, userMessage: userMessage })}\n\n`);
      res.end();
      return;
    }

    if (!upstream.ok) {
      const txt = await upstream.text();
      let errorDetail = txt;
      try {
        const errorObj = JSON.parse(txt);
        if (errorObj.error?.message) {
          errorDetail = errorObj.error.message;
        }
      } catch (e) {}
      
      let userMessage = "Erro ao conectar com o serviço de IA.";
      if (upstream.status === 401) {
        userMessage = "Chave de API do OpenRouter inválida ou não configurada.";
      } else if (upstream.status === 429) {
        userMessage = "Limite de requisições excedido.";
      }
      
      res.write(`event: error\ndata: ${JSON.stringify({ error: "upstream_error", detail: errorDetail, userMessage: userMessage })}\n\n`);
      res.end();
      return;
    }

    // Stream response
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (/^OPENROUTER PROCESSING/i.test(line)) continue;
          if (line === "data: [DONE]" || line === "[DONE]") {
            res.write(`event: done\ndata: {}\n\n`);
            continue;
          }
          if (!line.startsWith("data:")) continue;
          
          const after = line.replace(/^data:\s*/, "");
          let parsed = null;
          try { parsed = JSON.parse(after); } catch (e) {}

          if (parsed && parsed.choices && Array.isArray(parsed.choices)) {
            let textChunk = "";
            for (const ch of parsed.choices) {
              if (ch.delta) {
                if (typeof ch.delta === "string") textChunk += ch.delta;
                else if (ch.delta.content) textChunk += ch.delta.content;
              } else if (ch.text) textChunk += ch.text;
            }
            if (textChunk) {
              res.write(`data: ${JSON.stringify({ delta: textChunk })}\n\n`);
            }
          } else if (parsed && parsed.delta) {
            const dt = typeof parsed.delta === "string" ? parsed.delta : (parsed.delta.content ?? "");
            if (dt) res.write(`data: ${JSON.stringify({ delta: dt })}\n\n`);
          }
        }
      }
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
}

