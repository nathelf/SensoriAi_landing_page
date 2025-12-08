// quick-test.js
import dotenv from "dotenv";
dotenv.config();

const key = process.env.OPENROUTER_API_KEY?.trim();
(async () => {
  console.log("=== OpenRouter API Test ===");
  console.log("OPENROUTER_API_KEY present?", !!key);
  if (key) {
    const keyPreview = key.length > 15 ? `${key.substring(0, 15)}...` : key;
    console.log("Key preview:", keyPreview);
    console.log("Key length:", key.length);
  } else {
    console.error("❌ OPENROUTER_API_KEY não encontrada no .env");
    process.exit(1);
  }
  
  console.log("\nTestando conectividade com openrouter.ai...");
  try {
    const testUrl = "https://openrouter.ai/api/v1/chat/completions";
    console.log("URL:", testUrl);
    
    const res = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SensoriAI Test"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    
    console.log("\nStatus:", res.status, res.statusText);
    const txt = await res.text();
    
    if (res.ok) {
      console.log("✅ Sucesso! Resposta recebida.");
      try {
        const data = JSON.parse(txt);
        console.log("Resposta:", data.choices?.[0]?.message?.content || "Sem conteúdo");
      } catch {
        console.log("Resposta (primeiros 200 chars):", txt.slice(0, 200));
      }
    } else {
      console.error("❌ Erro:", res.status);
      console.log("Resposta:", txt.slice(0, 500));
    }
  } catch (err) {
    console.error("\n❌ Erro de conexão:");
    console.error("Tipo:", err.constructor.name);
    console.error("Mensagem:", err.message);
    console.error("Code:", err.code);
    if (err.stack) {
      console.error("\nStack trace:");
      console.error(err.stack);
    }
    
    if (err.code === 'ENOTFOUND') {
      console.error("\n💡 Dica: Não foi possível resolver o DNS. Verifique sua conexão com a internet.");
    } else if (err.code === 'ECONNREFUSED') {
      console.error("\n💡 Dica: Conexão recusada. Verifique se há firewall bloqueando.");
    } else if (err.code === 'ETIMEDOUT') {
      console.error("\n💡 Dica: Timeout. Verifique sua conexão com a internet.");
    }
  }
})();
