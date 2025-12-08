// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

// Helper para timestamp (definido antes de ser usado)
const now = () => new Date().toISOString();

// Configuração CORS mais segura
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      // Portas comuns do Vite/React em desenvolvimento
      'http://localhost:3000', 
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000', 
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080'
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Em desenvolvimento, permitir qualquer localhost
    if (process.env.NODE_ENV !== 'production') {
      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin) {
        return callback(null, true);
      }
      // Permitir qualquer localhost em desenvolvimento
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // Em produção, verificar lista de origens permitidas
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`${now()} ⚠ CORS bloqueado para origem: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: false, // Não enviar cookies
}));
app.use(express.json({ limit: "1mb" }));

// Rate limiting simples (em memória - para produção, use Redis)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requisições por minuto por IP

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip;
  const requests = rateLimitMap.get(key) || [];
  
  // Remove requisições antigas (fora da janela)
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(key, recentRequests);
  return true;
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY?.trim();
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "chat_sessions";

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Logs seguros - nunca expor a chave completa
console.log(`${now()} ▶ Server starting. OPENROUTER_KEY present? ${!!OPENROUTER_KEY}`);
if (OPENROUTER_KEY) {
  // Mostrar apenas os primeiros 8 caracteres para debug, nunca a chave completa
  const keyPreview = OPENROUTER_KEY.length > 8 ? `${OPENROUTER_KEY.substring(0, 8)}...` : '***';
  console.log(`${now()} ▶ OPENROUTER_KEY configurada (preview: ${keyPreview})`);
} else {
  console.warn(`${now()} ⚠ OPENROUTER_KEY não configurada - chatbot retornará respostas MOCK`);
}
if (supabase) {
  // Não logar URL completa do Supabase se contiver informações sensíveis
  const supabaseUrlPreview = SUPABASE_URL ? SUPABASE_URL.replace(/https?:\/\/([^.]+)\./, 'https://***.') : 'N/A';
  console.log(`${now()} ▶ Supabase client initialized`);
}

// ---------- Helpers ----------
async function fetchWithRetry(url, options = {}, retries = 3, timeoutMs = 30000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      console.log(`${now()} [fetchWithRetry] attempt ${attempt}/${retries} to ${url}`);
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      console.log(`${now()} [fetchWithRetry] attempt ${attempt} succeeded with status ${resp.status}`);
      return resp;
    } catch (err) {
      clearTimeout(id);
      const errorMsg = err && err.message ? err.message : String(err);
      const errorCode = err && err.code ? err.code : 'UNKNOWN';
      console.error(`${now()} [fetchWithRetry] attempt ${attempt}/${retries} failed:`, errorMsg, `(code: ${errorCode})`);
      
      // Se for erro de rede, fornecer mais detalhes
      if (err && (err.message?.includes('fetch failed') || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT')) {
        console.error(`${now()} [fetchWithRetry] Network error details:`, {
          url,
          code: err.code,
          message: err.message,
          cause: err.cause
        });
      }
      
      if (attempt === retries) {
        // Adicionar mais contexto ao erro final
        const finalError = new Error(`Failed to fetch after ${retries} attempts: ${errorMsg}`);
        finalError.cause = err;
        throw finalError;
      }
      // brief backoff - aumenta com cada tentativa
      const backoffMs = 1000 * attempt;
      console.log(`${now()} [fetchWithRetry] waiting ${backoffMs}ms before retry...`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
}

// Sanitização e validação de mensagens
function normalizeMessages(msgs) {
  if (!Array.isArray(msgs)) return [];
  
  return msgs
    .filter(m => m && typeof m === 'object')
    .map(m => {
      const role = m.role === 'user' || m.role === 'assistant' || m.role === 'system' 
        ? m.role 
        : 'user'; // Default seguro
      
      // Limitar tamanho do conteúdo (prevenir ataques de DoS)
      let content = String(m.content || '').slice(0, 10000); // Máximo 10k caracteres por mensagem
      
      return { role, content };
    })
    .filter(m => m.content && m.content.trim().length > 0); // Remover mensagens vazias
}

async function saveSession(session) {
  if (!supabase) return;
  try {
    await supabase.from(SUPABASE_TABLE).insert([session]);
  } catch (err) {
    console.warn(`${now()} [Supabase] failed to save session:`, err);
  }
}

// Middleware de rate limiting
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    console.warn(`${now()} ⚠ Rate limit excedido para IP: ${ip}`);
    return res.status(429).json({ 
      error: "rate_limit_exceeded", 
      userMessage: "Muitas requisições. Por favor, aguarde um momento antes de tentar novamente." 
    });
  }
  next();
}

// ---------- Non-streaming endpoint ----------
app.post("/api/openrouter/chat", rateLimitMiddleware, async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  console.log(`${now()} 📩 POST /api/openrouter/chat from ${clientIP}`);
  
  try {
    const { messages, sessionId, save = false, model = "gpt-4o-mini" } = req.body;

    // Validação de entrada
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages (array) required" });
    }
    
    if (messages.length === 0) {
      return res.status(400).json({ error: "messages array cannot be empty" });
    }
    
    // Limitar número de mensagens (prevenir ataques)
    if (messages.length > 50) {
      return res.status(400).json({ error: "too_many_messages", userMessage: "Número máximo de mensagens excedido (50)" });
    }
    
    // Validar modelo (whitelist de modelos permitidos)
    const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'claude-3-haiku', 'claude-3-sonnet'];
    const safeModel = allowedModels.includes(model) ? model : 'gpt-4o-mini';
    
    const normalizedMessages = normalizeMessages(messages);
    if (normalizedMessages.length === 0) {
      return res.status(400).json({ error: "no_valid_messages", userMessage: "Nenhuma mensagem válida encontrada" });
    }
    
    const payload = { model: safeModel, messages: normalizedMessages, temperature: 0.2, stream: false };

    if (!OPENROUTER_KEY || OPENROUTER_KEY.length === 0) {
      console.warn(`${now()} ❗ OPENROUTER_API_KEY not set or empty — returning MOCK response`);
      const mock = "Resposta MOCK: chave não configurada (dev).";
      if (save && sessionId) await saveSession({ session_id: sessionId, messages, response: mock, created_at: now() });
      return res.json({ assistant: mock });
    }

    let response;
    try {
      response = await fetchWithRetry(OPENROUTER_API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
          "X-Title": "SensoriAI Agro Insight"
        },
        body: JSON.stringify(payload),
      }, 3, 30000);
    } catch (err) {
      console.error(`${now()} ❌ fetch failed:`, err && err.stack ? err.stack : err);
      const errorMsg = err && err.message ? err.message : String(err);
      const errorCode = err && err.code ? err.code : 'UNKNOWN';
      
      // Mensagem mais específica baseada no tipo de erro
      let userMessage = "Erro de conexão com o serviço de IA. Verifique sua conexão com a internet.";
      if (errorCode === 'ECONNREFUSED' || errorMsg.includes('ECONNREFUSED')) {
        userMessage = "Não foi possível conectar ao servidor da API. Verifique sua conexão com a internet e se o serviço OpenRouter está acessível.";
      } else if (errorCode === 'ENOTFOUND' || errorMsg.includes('ENOTFOUND')) {
        userMessage = "Não foi possível resolver o endereço do servidor. Verifique sua conexão com a internet e configurações de DNS.";
      } else if (errorCode === 'ETIMEDOUT' || errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        userMessage = "Tempo de espera esgotado ao conectar com o serviço. Tente novamente ou verifique sua conexão.";
      } else if (errorMsg.includes('fetch failed')) {
        userMessage = "Falha na conexão com o serviço de IA. Verifique sua conexão com a internet.";
      }
      
      return res.status(502).json({ 
        error: "fetch_failed", 
        detail: errorMsg,
        code: errorCode,
        userMessage: userMessage,
        assistant: "Desculpe, não foi possível conectar ao serviço de IA no momento. Por favor, tente novamente mais tarde." 
      });
    }

    const text = await response.text();
    if (!response.ok) {
      console.error(`${now()} ⚠ OpenRouter returned non-ok:`, response.status, text.slice(0, 1000));
      let errorDetail = text;
      try {
        const errorObj = JSON.parse(text);
        if (errorObj.error?.message) {
          errorDetail = errorObj.error.message;
        } else if (errorObj.error) {
          errorDetail = typeof errorObj.error === 'string' ? errorObj.error : JSON.stringify(errorObj.error);
        }
      } catch (e) {
        // keep original text if not JSON
      }
      
      // Provide user-friendly error messages
      let userMessage = "Erro ao conectar com o serviço de IA.";
      if (response.status === 401) {
        if (errorDetail.includes("cookie") || errorDetail.includes("credentials")) {
          userMessage = "Chave de API do OpenRouter inválida, vazia ou mal formatada. Verifique se a variável OPENROUTER_API_KEY no arquivo .env contém uma chave válida (começa com 'sk-or-v1-').";
        } else {
          userMessage = "Chave de API do OpenRouter inválida ou não configurada. Verifique a variável OPENROUTER_API_KEY no arquivo .env";
        }
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
    if (save && sessionId) {
      await saveSession({ session_id: sessionId, messages, response: assistant, created_at: now() });
    }

    return res.json({ assistant, raw: data ?? text });
  } catch (err) {
    console.error(`${now()} ❌ /api/openrouter/chat error:`, err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "internal_error", detail: String(err) });
  }
});

// ---------- Streaming endpoint (normalizes upstream SSE-like chunks) ----------
app.post("/api/openrouter/stream", rateLimitMiddleware, async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  console.log(`${now()} 📡 POST /api/openrouter/stream from ${clientIP}`);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, sessionId, model = "gpt-4o-mini" } = req.body;
    
    // Validação de entrada
    if (!Array.isArray(messages)) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "messages array required", userMessage: "Formato de mensagens inválido" })}\n\n`);
      res.end();
      return;
    }
    
    if (messages.length === 0) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "messages array cannot be empty", userMessage: "Array de mensagens não pode estar vazio" })}\n\n`);
      res.end();
      return;
    }
    
    if (messages.length > 50) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "too_many_messages", userMessage: "Número máximo de mensagens excedido (50)" })}\n\n`);
      res.end();
      return;
    }
    
    // Validar modelo
    const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'claude-3-haiku', 'claude-3-sonnet'];
    const safeModel = allowedModels.includes(model) ? model : 'gpt-4o-mini';
    
    const normalizedMessages = normalizeMessages(messages);
    if (normalizedMessages.length === 0) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "no_valid_messages", userMessage: "Nenhuma mensagem válida encontrada" })}\n\n`);
      res.end();
      return;
    }

    if (!OPENROUTER_KEY || OPENROUTER_KEY.length === 0) {
      const mock = "Resposta MOCK (no key): não foi possível acessar serviço externo.";
      res.write(`data: ${JSON.stringify({ delta: mock })}\n\n`);
      if (sessionId) await saveSession({ session_id: sessionId, messages, response: mock, created_at: now() });
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
          "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
          "X-Title": "SensoriAI Agro Insight"
        },
        body: JSON.stringify(payload),
      }, 3, 30000);
    } catch (fetchErr) {
      console.error(`${now()} ❌ upstream fetch failed:`, fetchErr && fetchErr.stack ? fetchErr.stack : fetchErr);
      const errorMsg = fetchErr && fetchErr.message ? fetchErr.message : String(fetchErr);
      const errorCode = fetchErr && fetchErr.code ? fetchErr.code : 'UNKNOWN';
      
      // Mensagem mais específica baseada no tipo de erro
      let userMessage = "Erro de conexão com o serviço de IA. Verifique sua conexão com a internet.";
      if (errorCode === 'ECONNREFUSED' || errorMsg.includes('ECONNREFUSED')) {
        userMessage = "Não foi possível conectar ao servidor da API. Verifique sua conexão com a internet e se o serviço OpenRouter está acessível.";
      } else if (errorCode === 'ENOTFOUND' || errorMsg.includes('ENOTFOUND')) {
        userMessage = "Não foi possível resolver o endereço do servidor. Verifique sua conexão com a internet e configurações de DNS.";
      } else if (errorCode === 'ETIMEDOUT' || errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        userMessage = "Tempo de espera esgotado ao conectar com o serviço. Tente novamente ou verifique sua conexão.";
      } else if (errorMsg.includes('fetch failed')) {
        userMessage = "Falha na conexão com o serviço de IA. Verifique sua conexão com a internet.";
      }
      
      res.write(`event: error\ndata: ${JSON.stringify({ error: "fetch_failed", detail: errorMsg, code: errorCode, userMessage: userMessage })}\n\n`);
      res.end();
      return;
    }

    if (!upstream.ok) {
      const txt = await upstream.text();
      console.error(`${now()} ⚠ upstream non-ok`, upstream.status, txt.slice(0, 1000));
      let errorDetail = txt;
      try {
        const errorObj = JSON.parse(txt);
        if (errorObj.error?.message) {
          errorDetail = errorObj.error.message;
        } else if (errorObj.error) {
          errorDetail = typeof errorObj.error === 'string' ? errorObj.error : JSON.stringify(errorObj.error);
        }
      } catch (e) {
        // keep original text if not JSON
      }
      
      // Provide user-friendly error messages
      let userMessage = "Erro ao conectar com o serviço de IA.";
      if (upstream.status === 401) {
        if (errorDetail.includes("cookie") || errorDetail.includes("credentials")) {
          userMessage = "Chave de API do OpenRouter inválida, vazia ou mal formatada. Verifique se a variável OPENROUTER_API_KEY no arquivo .env contém uma chave válida (começa com 'sk-or-v1-').";
        } else {
          userMessage = "Chave de API do OpenRouter inválida ou não configurada. Verifique a variável OPENROUTER_API_KEY no arquivo .env";
        }
      } else if (upstream.status === 429) {
        userMessage = "Limite de requisições excedido. Tente novamente em alguns instantes.";
      } else if (upstream.status >= 500) {
        userMessage = "Serviço de IA temporariamente indisponível. Tente novamente mais tarde.";
      }
      
      res.write(`event: error\ndata: ${JSON.stringify({ error: "upstream_error", detail: errorDetail, userMessage: userMessage })}\n\n`);
      res.end();
      return;
    }

    // Read upstream body and forward only extracted text chunks as { delta: "..." }
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // split into SSE events (double newline) keeping possible trailing partial
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (/^OPENROUTER PROCESSING/i.test(line)) {
            // ignore noisy status
            continue;
          }

          if (line === "data: [DONE]" || line === "[DONE]") {
            res.write(`event: done\ndata: {}\n\n`);
            continue;
          }

          if (!line.startsWith("data:")) continue;
          const after = line.replace(/^data:\s*/, "");
          let parsed = null;
          try { parsed = JSON.parse(after); } catch (e) { /* not JSON */ }

          // prefer choices[].delta.content
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
          } else {
            // fallback - send raw under delta to keep UI safe
            res.write(`data: ${JSON.stringify({ delta: after })}\n\n`);
          }
        }
      }
    }

    // end of upstream stream
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
    return;
  } catch (err) {
    console.error(`${now()} ❌ /api/openrouter/stream unexpected:`, err && err.stack ? err.stack : err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

// ---------- Contact Form Email Endpoint ----------
app.post("/api/contact", rateLimitMiddleware, async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  console.log(`${now()} 📧 POST /api/contact from ${clientIP}`);
  
  try {
    const { name, email, company, phone, message } = req.body;
    
    // Validação
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: "validation_error", 
        userMessage: "Nome, email e mensagem são obrigatórios." 
      });
    }
    
    if (name.trim().length < 2) {
      return res.status(400).json({ 
        error: "validation_error", 
        userMessage: "Nome deve ter pelo menos 2 caracteres." 
      });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        error: "validation_error", 
        userMessage: "Email inválido." 
      });
    }
    
    if (message.trim().length < 10) {
      return res.status(400).json({ 
        error: "validation_error", 
        userMessage: "Mensagem deve ter pelo menos 10 caracteres." 
      });
    }
    
    const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
    const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "startup.sensoriai@gmail.com";
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    if (!RESEND_API_KEY) {
      console.warn(`${now()} ⚠ RESEND_API_KEY não configurada - email não será enviado`);
      // Em desenvolvimento, apenas logar os dados
      console.log(`${now()} 📧 [DEV] Contato recebido:`, { name, email, company, phone, message });
      return res.json({ 
        success: true, 
        message: "Mensagem recebida (modo desenvolvimento - email não configurado)",
        dev: true
      });
    }
    
    // IMPORTANTE: Resend em modo teste só permite enviar para o email da conta
    // Se CONTACT_EMAIL não for o email da conta, vamos usar o email do remetente como fallback
    // ou você precisa verificar um domínio no Resend
    let emailDestino = CONTACT_EMAIL;
    
    // Verificar se podemos enviar para o email configurado
    // Se der erro 403, significa que precisa verificar domínio ou usar email da conta
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `SensoriAI.Agro <${RESEND_FROM_EMAIL}>`,
        to: [emailDestino],
        reply_to: email,
        subject: `Novo Contato: ${name} - ${company || 'Empresa não informada'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Nova Solicitação de Contato</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">Informações do Contato</h2>
              
                  <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 10px 0;"><strong>Nome:</strong> ${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${email.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    ${company ? `<p style="margin: 10px 0;"><strong>Empresa:</strong> ${company.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
                    ${phone ? `<p style="margin: 10px 0;"><strong>Telefone:</strong> ${phone.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
                  </div>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #1f2937; margin-top: 0;">Mensagem:</h3>
                    <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                  </div>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
              <p>Este email foi enviado automaticamente pelo formulário de contato do SensoriAI.Agro</p>
            </div>
          </div>
        `,
      }),
    });
    
    if (!adminEmailResponse.ok) {
      let errorData;
      try {
        errorData = await adminEmailResponse.json();
      } catch {
        errorData = await adminEmailResponse.text();
      }
      console.error(`${now()} ❌ Erro ao enviar email:`, errorData);
      
      // Se for erro 403 (domínio não verificado), tentar enviar para o email do remetente
      if (adminEmailResponse.status === 403 && 
          (errorData.message?.includes('testing emails') || 
           errorData.message?.includes('verify a domain'))) {
        console.warn(`${now()} ⚠ Resend em modo teste - tentando enviar para o email do remetente: ${email}`);
        
        // Tentar novamente com o email do remetente
        const retryResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `SensoriAI.Agro <${RESEND_FROM_EMAIL}>`,
            to: [email],
            reply_to: email,
            subject: `[TESTE] Novo Contato: ${name} - ${company || 'Empresa não informada'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Nova Solicitação de Contato</h1>
                  <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">⚠️ MODO TESTE - Verifique domínio no Resend para enviar para startup.sensoriai@gmail.com</p>
                </div>
                
                <div style="padding: 30px; background-color: #f9fafb;">
                  <h2 style="color: #1f2937; margin-top: 0;">Informações do Contato</h2>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 10px 0;"><strong>Nome:</strong> ${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${email.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    ${company ? `<p style="margin: 10px 0;"><strong>Empresa:</strong> ${company.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
                    ${phone ? `<p style="margin: 10px 0;"><strong>Telefone:</strong> ${phone.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
                  </div>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #1f2937; margin-top: 0;">Mensagem:</h3>
                    <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                  </div>
                  
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>⚠️ Atenção:</strong> Este email foi enviado para você porque o Resend está em modo teste. 
                      Para enviar para startup.sensoriai@gmail.com, verifique um domínio no Resend (resend.com/domains).
                    </p>
                  </div>
                </div>
                
                <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                  <p>Este email foi enviado automaticamente pelo formulário de contato do SensoriAI.Agro</p>
                </div>
              </div>
            `,
          }),
        });
        
        if (!retryResponse.ok) {
          const retryError = await retryResponse.json().catch(() => ({ message: 'Erro desconhecido' }));
          console.error(`${now()} ❌ Erro ao enviar email de fallback:`, retryError);
          throw new Error(`Falha ao enviar email: ${retryResponse.status} - ${retryError.message || 'Erro desconhecido'}`);
        }
        
        const retryData = await retryResponse.json();
        console.log(`${now()} ✅ Email enviado para ${email} (modo teste - domínio não verificado)`);
        return res.json({ 
          success: true, 
          message: "Mensagem enviada! (Email enviado para você - verifique domínio no Resend para enviar para startup.sensoriai@gmail.com)",
          emailId: retryData.id,
          warning: "Resend em modo teste - verifique domínio para enviar para outros emails"
        });
      } else {
        throw new Error(`Falha ao enviar email: ${adminEmailResponse.status} - ${typeof errorData === 'object' ? errorData.message || 'Erro desconhecido' : errorData}`);
      }
    }
    
    const adminData = await adminEmailResponse.json();
    console.log(`${now()} ✅ Email enviado com sucesso para ${CONTACT_EMAIL}`);
    
    // Enviar email de confirmação para o usuário (opcional)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `SensoriAI.Agro <${RESEND_FROM_EMAIL}>`,
          to: [email],
          subject: "Recebemos sua mensagem - SensoriAI.Agro",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Obrigado pelo seu contato!</h1>
              </div>
              
              <div style="padding: 30px; background-color: #f9fafb;">
                <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                  Olá <strong>${name}</strong>,
                </p>
                
                <p style="color: #4b5563; line-height: 1.6;">
                  Recebemos sua mensagem e nossa equipe entrará em contato em breve.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1f2937; margin-top: 0;">Sua mensagem:</h3>
                  <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                </div>
              </div>
              
              <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>SensoriAI.Agro - Sistema Integrado de Agricultura Autônoma</p>
              </div>
            </div>
          `,
        }),
      });
    } catch (userEmailErr) {
      // Não falhar se o email de confirmação falhar
      console.warn(`${now()} ⚠ Falha ao enviar email de confirmação:`, userEmailErr);
    }
    
    return res.json({ 
      success: true, 
      message: "Mensagem enviada com sucesso!",
      emailId: adminData.id
    });
    
  } catch (err) {
    console.error(`${now()} ❌ /api/contact error:`, err && err.stack ? err.stack : err);
    const errorMsg = err?.message || String(err);
    return res.status(500).json({ 
      error: "internal_error", 
      userMessage: "Erro ao enviar mensagem. Por favor, tente novamente mais tarde.",
      detail: errorMsg
    });
  }
});

// ---------- Health / root ----------
app.get("/", (req, res) => res.send(`Server OK - ${now()}`));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`${now()} 🚀 Server listening on ${PORT}`));
