import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";

type Role = "user" | "assistant";
interface Message { id: string; role: Role; content: string; }

/**
 * Modifique aqui as system prompts se quiser afinar a "voz" do assistente.
 * As mensagens abaixo estão configuradas para serem práticas, empáticas e seguras.
 */
const AGRO_MODES = {
  concise: {
    id: "concise",
    name: "Conciso (Recomendação rápida)",
    system:
      "Você é um assistente agronômico amigável e prático. Responda em português, de forma concisa e direta, indicando ações recomendadas e avisos de segurança. Se o usuário demonstrar frustração, reconheça brevemente e ofereça passos simples."
  },
  detailed: {
    id: "detailed",
    name: "Detalhado (Explicações e referências)",
    system:
      "Você é um especialista agronômico empático. Responda em português, explique causas, indique métricas e possíveis ações com referências práticas de manejo. Seja claro e ofereça passo-a-passo quando apropriado."
  },
  safety: {
    id: "safety",
    name: "Segurança (foco em segurança e LGPD)",
    system:
      "Você é um assistente agronômico com foco em segurança operacional e conformidade. Responda em português, sempre destaque riscos, procedimentos seguros e cuidados com dados (LGPD) quando pertinente."
  }
} as const;

/** Extrai texto humano a partir do objeto retornado pelo servidor (ou OpenRouter raw). */
function extractAssistantFromResponseObject(obj: any, rawTextFallback?: string): string {
  if (!obj) return rawTextFallback ?? "Desculpe — resposta inválida.";

  // 1) se o servidor já retornou `assistant` (nós preferimos isso)
  if (typeof obj.assistant === "string" && obj.assistant.trim().length > 0) {
    return obj.assistant;
  }

  // 2) tentar extrair do campo `raw` (formato OpenRouter/OpenAI)
  const raw = obj.raw ?? obj;
  try {
    const choice = raw?.choices?.[0];
    if (choice?.message?.content) return choice.message.content;
    if (choice?.text) return choice.text;

    // recolher delta/text de choices (streaming-assembled)
    if (Array.isArray(raw?.choices)) {
      let collected = "";
      for (const ch of raw.choices) {
        if (!ch) continue;
        if (ch.delta) {
          if (typeof ch.delta === "string") collected += ch.delta;
          else if (typeof ch.delta.content === "string") collected += ch.delta.content;
        } else if (typeof ch.text === "string") {
          collected += ch.text;
        } else if (ch.message?.content) {
          collected += ch.message.content;
        }
      }
      if (collected.trim().length > 0) return collected;
    }
  } catch {
    // ignore and fallback
  }

  // 3) se o servidor enviou apenas texto cru como body
  if (typeof rawTextFallback === "string" && rawTextFallback.trim().length > 0) {
    return rawTextFallback;
  }

  // 4) fallback final
  return "Desculpe — não consegui processar a resposta. Tente novamente.";
}

export const ConsultantChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Olá! Sou o assistente virtual da SensoriAI. Como posso ajudá-lo?" }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agroMode, setAgroMode] = useState<keyof typeof AGRO_MODES>("concise");
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());

  // Append assistant incremental or final
  const appendAssistantChunk = (chunk: string) => {
    if (!chunk) return;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") {
        return [...prev, { id: Date.now().toString(), role: "assistant", content: chunk }];
      } else {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, content: (last.content || "") + chunk };
        return updated;
      }
    });
  };

  // Extract JSON objects from an SSE-ish chunk string (robusto para vários formatos)
  function extractJsonObjectsFromChunk(chunkStr: string): any[] {
    const objs: any[] = [];
    const blocks = chunkStr.split(/\r?\n\r?\n/);
    for (const block of blocks) {
      if (!block) continue;
      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      let currentEvent: string | null = null;
      let currentData: string | null = null;
      
      for (const line of lines) {
        if (/^OPENROUTER PROCESSING/i.test(line)) continue;
        
        // Handle SSE event format: event: error\ndata: {...}
        if (line.startsWith("event:")) {
          currentEvent = line.replace(/^event:\s*/, "");
          continue;
        }
        
        if (line.startsWith("data:")) {
          currentData = line.replace(/^data:\s*/, "");
          
          // If we have an event type, mark it
          if (currentEvent === "error") {
            try {
              const errorObj = JSON.parse(currentData);
              objs.push({ error: true, ...errorObj });
            } catch {
              objs.push({ error: true, detail: currentData });
            }
            currentEvent = null;
            currentData = null;
            continue;
          }
          
          if (currentData === "[DONE]" || currentData === "[DONE]") {
            objs.push({ done: true });
            continue;
          }
          
          try {
            objs.push(JSON.parse(currentData));
            continue;
          } catch {
            const jsonMatch = currentData.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                objs.push(JSON.parse(jsonMatch[0]));
                continue;
              } catch {
                objs.push({ raw: currentData });
                continue;
              }
            } else {
              objs.push({ raw: currentData });
              continue;
            }
          }
        } else {
          try {
            objs.push(JSON.parse(line));
          } catch {
            objs.push({ raw: line });
          }
        }
      }
    }
    return objs;
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setError(null);
    setSending(true);

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const systemMsg = { role: "system", content: AGRO_MODES[agroMode].system };
    const history = [...messages, userMessage].slice(-10).map(m => ({ role: m.role, content: m.content }));

    // URL da API: localhost em desenvolvimento, relativa em produção (Vercel)
    const apiBaseUrl = import.meta.env.DEV 
      ? "http://localhost:3001" 
      : ""; // Em produção na Vercel, usa URL relativa
    
    try {
      const resp = await fetch(`${apiBaseUrl}/api/openrouter/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [systemMsg, ...history], sessionId: sessionIdRef.current })
      });

      if (!resp.ok) {
        const txt = await resp.text();
        let errorData;
        try {
          errorData = JSON.parse(txt);
        } catch {
          errorData = { detail: txt };
        }
        
        // Extract user-friendly message if available
        const userMessage = errorData.userMessage || errorData.detail || `Erro ${resp.status}: Não foi possível conectar ao serviço de IA.`;
        throw new Error(userMessage);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Streaming not available (no body).");

      const decoder = new TextDecoder();
      let done = false;
      let receivedDone = false; // evita processar done duplicado

      // placeholder assistant message
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) { done = true; break; }
        if (!value) continue;
        const chunk = decoder.decode(value, { stream: true });

        const parsedObjects = extractJsonObjectsFromChunk(chunk);

        for (const obj of parsedObjects) {
          // Check for error events
          if (obj && obj.error) {
            const errorMsg = obj.userMessage || obj.detail || (typeof obj.error === 'string' ? obj.error : "Erro ao processar resposta do servidor.");
            setError(errorMsg);
            // Remove placeholder assistant message
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant" && !last.content) {
                return prev.slice(0, -1);
              }
              return prev;
            });
            done = true;
            break;
          }
          
          if (obj && obj.done) {
            if (!receivedDone) {
              receivedDone = true;
              done = true;
            }
            break;
          }

          let deltaText = "";

          if (obj && obj.choices && Array.isArray(obj.choices)) {
            for (const ch of obj.choices) {
              if (ch.delta) {
                if (typeof ch.delta === "string") deltaText += ch.delta;
                else if (ch.delta.content) deltaText += ch.delta.content;
                else deltaText += Object.values(ch.delta).filter(Boolean).join("");
              } else if (ch.text) {
                deltaText += ch.text;
              } else if (ch.message?.content) {
                deltaText += ch.message.content;
              }
            }
          } else if (obj && obj.delta) {
            if (typeof obj.delta === "string") deltaText += obj.delta;
            else if (obj.delta.content) deltaText += obj.delta.content;
            else deltaText += JSON.stringify(obj.delta);
          } else if (obj && obj.raw && typeof obj.raw === "string") {
            deltaText += obj.raw;
          } else if (typeof obj === "string") {
            deltaText += obj;
          }

          if (deltaText && deltaText.trim().length > 0) {
            appendAssistantChunk(deltaText);
          }
        }
      }

      // ao terminar o streaming, solicitamos a versão final/limpa (melhora consistência)
      try {
        const finalResp = await fetch(`${apiBaseUrl}/api/openrouter/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [systemMsg, ...history], sessionId: sessionIdRef.current, save: true })
        });
        const finalText = await finalResp.text();
        let finalData;
        try { finalData = JSON.parse(finalText); } catch { finalData = { assistant: finalText, raw: finalText }; }
        const finalAssistant = extractAssistantFromResponseObject(finalData, finalText);

        // atualiza a última mensagem do assistente com o texto final limpo
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, content: finalAssistant };
            return updated;
          }
          return [...prev, { id: Date.now().toString(), role: "assistant", content: finalAssistant }];
        });
      } catch {
        // se falhar, não quebramos — a resposta incremental já está lá
      }

    } catch (err: any) {
      console.error("streaming failed, falling back:", err);
      // Remove the placeholder assistant message if it exists
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      // fallback non-stream
      try {
        const resp2 = await fetch(`${apiBaseUrl}/api/openrouter/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [systemMsg, ...history], sessionId: sessionIdRef.current, save: true })
        });
        const txt = await resp2.text();
        let data;
        try { data = JSON.parse(txt); } catch { data = { assistant: txt, raw: txt }; }
        
        // Check if response contains an error
        if (data.error) {
          const errorMsg = data.userMessage || data.detail || "Erro ao processar resposta do servidor.";
          setError(errorMsg);
          return;
        }
        
        const assistant = extractAssistantFromResponseObject(data, txt);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: assistant }]);
      } catch (err2) {
        console.error("fallback failed:", err2);
        let errorMsg = "Desculpe, não foi possível contactar o assistente.";
        if (err2 instanceof Error) {
          errorMsg = err2.message;
        } else if (typeof err2 === 'string') {
          errorMsg = err2;
        }
        
        // Se for erro de rede, fornecer mensagem mais específica
        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
          errorMsg = "Erro de conexão. Verifique se o servidor está rodando e sua conexão com a internet.";
        }
        
        setError(errorMsg);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Assistente Virtual
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm">Modo:</label>
          <select
            value={agroMode}
            onChange={(e) => setAgroMode(e.target.value as keyof typeof AGRO_MODES)}
            className="p-2 border rounded"
            disabled={sending}
          >
            {Object.values(AGRO_MODES).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-lg p-3 max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="text-sm whitespace-pre-wrap">{typeof m.content === 'string' ? m.content : String(m.content)}</p>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div className="flex gap-2">
          <Input
            placeholder={sending ? "Enviando..." : "Digite sua pergunta..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon" disabled={sending}><Send className="h-4 w-4"/></Button>
        </div>
      </CardContent>
    </Card>
  );
};
