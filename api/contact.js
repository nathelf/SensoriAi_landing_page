// Vercel Serverless Function - Contact form endpoint
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

// Rate limiting simples
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requisições por minuto para formulário de contato

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
    
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY não configurada - email não será enviado');
      console.log('Contato recebido:', { name, email, company, phone, message });
      return res.json({ 
        success: true, 
        message: "Mensagem recebida (modo desenvolvimento - email não configurado)",
        dev: true
      });
    }
    
    // Enviar email para o administrador
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SensoriAI.Agro <onboarding@resend.dev>",
        to: [CONTACT_EMAIL],
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
      const errorData = await adminEmailResponse.text();
      console.error('Erro ao enviar email:', errorData);
      throw new Error(`Falha ao enviar email: ${adminEmailResponse.status}`);
    }
    
    const adminData = await adminEmailResponse.json();
    console.log(`Email enviado com sucesso para ${CONTACT_EMAIL}`);
    
    // Enviar email de confirmação para o usuário (opcional)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "SensoriAI.Agro <onboarding@resend.dev>",
          to: [email],
          subject: "Recebemos sua mensagem - SensoriAI.Agro",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Obrigado pelo seu contato!</h1>
              </div>
              
              <div style="padding: 30px; background-color: #f9fafb;">
                <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                  Olá <strong>${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>,
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
      console.warn('Falha ao enviar email de confirmação:', userEmailErr);
    }
    
    return res.json({ 
      success: true, 
      message: "Mensagem enviada com sucesso!",
      emailId: adminData.id
    });
    
  } catch (err) {
    console.error('Error in /api/contact:', err);
    const errorMsg = err?.message || String(err);
    return res.status(500).json({ 
      error: "internal_error", 
      userMessage: "Erro ao enviar mensagem. Por favor, tente novamente mais tarde.",
      detail: errorMsg
    });
  }
}

