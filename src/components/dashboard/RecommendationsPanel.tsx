import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { ConsultantChatbot } from "./ConsultantChatbot";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  action?: string;
}

const realData = {
  vigor: { red: 40.67, yellow: 12.29, green: 47.04 },
  weedsPct: 5.671,
  failuresPct: 2.19,
  totalAreaHa: 245.3,
};

const generatedRecommendations = (): Recommendation[] => {
  const recs: Recommendation[] = [];

  if (realData.vigor.red >= 30) {
    recs.push({
      id: "r-vigor",
      title: "Investigar e corrigir áreas de baixo vigor",
      description:
        `Cerca de ${realData.vigor.red.toFixed(2)}% da área apresenta baixo vigor. ` +
        "Recomenda-se investigação urgente (análise de solo, verificação de irrigação e amostragem foliar) nas zonas identificadas para definição de correção localizada.",
      priority: "high",
      category: "Vigor",
      action: "Programar amostragem",
    });
  } else {
    recs.push({
      id: "r-vigor",
      title: "Monitoramento de vigor",
      description:
        `Área com ${realData.vigor.red.toFixed(2)}% em baixo vigor — manter monitoramento e aplicar correções pontuais onde necessário.`,
      priority: "medium",
      category: "Vigor",
      action: "Monitorar focos",
    });
  }

  recs.push({
    id: "r-weeds",
    title: "Controle localizado de plantas daninhas",
    description:
      `Infestação medida em ${realData.weedsPct.toFixed(3)}% da área. A distribuição é esparsa; recomenda-se aplicação localizada em pontos detectados para otimizar custo e reduzir deriva.`,
    priority: realData.weedsPct > 10 ? "high" : "medium",
    category: "Plantas Daninhas",
    action: "Aplicação localizada",
  });

  recs.push({
    id: "r-failures",
    title: "Correção de falhas de estabelecimento",
    description:
      `Falhas detectadas em ${realData.failuresPct.toFixed(2)}% da área, concentradas em bordas e extremos. Recomenda-se re-semeadura / reforço apenas nas faixas afetadas.`,
    priority: "low",
    category: "Falhas de Plantio",
    action: "Replante localizado",
  });

  return recs;
};

type ModalState =
  | { type: "none" }
  | { type: "confirmComplete"; rec: Recommendation }
  | { type: "viewMap"; rec: Recommendation }
  | { type: "taskCreated"; rec: Recommendation; taskId: string };

export const RecommendationsPanel: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(generatedRecommendations());
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const formatPercent = (n: number) => `${n.toFixed(2).replace(".", ",")}%`;

  const priorityIcon = (p: Recommendation["priority"]) => {
    if (p === "high") return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (p === "medium") return <Info className="h-5 w-5 text-amber-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  };

  const priorityLabel = (p: Recommendation["priority"]) =>
    p === "high" ? "Alto" : p === "medium" ? "Médio" : "Baixo";

  // Handlers
  const openConfirmComplete = (rec: Recommendation) => setModal({ type: "confirmComplete", rec });
  const openViewMap = (rec: Recommendation) => setModal({ type: "viewMap", rec });

  const confirmComplete = (recId: string) => {
    setCompletedIds((prev) => (prev.includes(recId) ? prev : [...prev, recId]));
    setModal({ type: "none" });
    toast.success("Recomendação marcada como concluída.");
  };

  const createTaskFromRec = (rec: Recommendation) => {
    // Simula criação de tarefa retornando um id aleatório
    const taskId = `task-${Math.random().toString(36).slice(2, 9)}`;
    setModal({ type: "taskCreated", rec, taskId });
    // opcionalmente, você pode manter uma lista de tarefas em estado
  };

  const closeModal = () => setModal({ type: "none" });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Observations + Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Distribuição de Vigor</p>
                    <h3 className="text-lg font-semibold text-foreground">Mosaico Vegetativo</h3>
                  </div>
                  <Badge variant="outline">Mapeamento</Badge>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Alto", value: realData.vigor.green, color: "bg-emerald-500" },
                    { label: "Médio", value: realData.vigor.yellow, color: "bg-amber-400" },
                    { label: "Baixo", value: realData.vigor.red, color: "bg-red-500" },
                  ].map((it) => (
                    <div key={it.label} className="flex items-center gap-3">
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground">{it.label}</span>
                          <span className="text-muted-foreground">{formatPercent(it.value)}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded overflow-hidden">
                          <div style={{ width: `${it.value}%` }} className={`h-2 ${it.color}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Plantas Daninhas</p>
                    <h3 className="text-lg font-semibold text-foreground">{formatPercent(realData.weedsPct)}</h3>
                  </div>
                  <Badge variant="default">Infestação</Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  Distribuição esparsa; intervenções localizadas recomendadas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Falhas de Plantio</p>
                    <h3 className="text-lg font-semibold text-foreground">{formatPercent(realData.failuresPct)}</h3>
                  </div>
                  <Badge variant="secondary">Estabelecimento</Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  Índice baixo e concentrado nas bordas; ação pontual sugerida.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle>Observações da Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>
                  A análise espacial indica distribuição heterogênea do vigor:{" "}
                  <strong>{realData.vigor.red.toFixed(2)}%</strong> em baixo vigor,{" "}
                  <strong>{realData.vigor.yellow.toFixed(2)}%</strong> em vigor médio e{" "}
                  <strong>{realData.vigor.green.toFixed(2)}%</strong> em alto vigor.
                  Esse padrão em mosaico sugere variações locais (nutrição, água, compactação).
                </p>

                <p>
                  Infestação por plantas daninhas detectada em <strong>{realData.weedsPct.toFixed(3)}%</strong> da área.
                  Recomendamos controle localizado nos pontos identificados.
                </p>

                <p>
                  Falhas de plantio em <strong>{realData.failuresPct.toFixed(2)}%</strong>, concentradas nas bordas.
                  Replante localizado é suficiente em muitos casos.
                </p>

                <p>
                  <strong>Georreferenciamento completo</strong> para {realData.totalAreaHa} ha — permite prescrição localizada.
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações Agronômicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((r) => {
                  const done = completedIds.includes(r.id);
                  return (
                    <article
                      key={r.id}
                      className={`flex gap-4 p-4 border rounded-lg transition ${done ? "bg-green-50 border-green-200" : "hover:shadow-sm"}`}
                    >
                      <div className="flex-shrink-0 flex items-start">
                        <div className={`rounded-full p-2 ${done ? "bg-green-100" : "bg-muted"}`}>
                          {priorityIcon(r.priority)}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className={`text-sm font-semibold ${done ? "text-green-800" : "text-foreground"}`}>{r.title}</h4>
                            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                              <Badge variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "outline" : "default"}>
                                {priorityLabel(r.priority)}
                              </Badge>
                              <span className="px-2 py-0.5 rounded text-xs bg-muted/50">{r.category}</span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openViewMap(r)}
                                className="text-xs rounded border px-3 py-1 hover:bg-muted"
                              >
                                Ver mapa
                              </button>
                              <button
                                onClick={() => openConfirmComplete(r)}
                                className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:brightness-95"
                                disabled={done}
                              >
                                Marcar como concluído
                              </button>
                            </div>
                            {done && <span className="text-xs text-green-700">Concluído</span>}
                          </div>
                        </div>

                        <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => openViewMap(r)}
                            className="px-3 py-1 text-xs rounded border"
                          >
                            Localizar no mapa
                          </button>
                          <button
                            onClick={() => { createTaskFromRec(r); }}
                            className="px-3 py-1 text-xs rounded bg-primary text-white"
                          >
                            Criar tarefa
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Chatbot */}
        <aside className="lg:col-span-1">
          <ConsultantChatbot />
        </aside>
      </div>

      {/* Modal / card overlay */}
      {modal.type !== "none" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModal({ type: "none" })}
          />
          <div className="relative w-full max-w-3xl">
            {modal.type === "confirmComplete" && (
              <Card>
                <CardHeader>
                  <CardTitle>Confirmar conclusão</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Deseja marcar como concluída a recomendação:
                    <strong className="block mt-2">{modal.rec.title}</strong>
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-3 py-1 rounded border"
                      onClick={() => setModal({ type: "none" })}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-emerald-600 text-white"
                      onClick={() => confirmComplete(modal.rec.id)}
                    >
                      Confirmar conclusão
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {modal.type === "viewMap" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mapa — {modal.rec.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Placeholder de mapa — substitua por seu componente de mapa se tiver */}
                  <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-50 rounded border flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <div className="text-sm">[Mapa interativo aqui]</div>
                      <div className="mt-2 text-xs text-muted-foreground">Foco georreferenciado para a recomendação</div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button className="px-3 py-1 rounded border" onClick={() => setModal({ type: "none" })}>
                      Fechar
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-primary text-white"
                      onClick={() => createTaskFromRec(modal.rec)}
                    >
                      Criar tarefa a partir desta recomendação
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {modal.type === "taskCreated" && (
              <Card>
                <CardHeader>
                  <CardTitle>Tarefa criada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Tarefa <strong>{modal.taskId}</strong> criada a partir de:
                    <strong className="block mt-2">{modal.rec.title}</strong>
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => { toast.success("Tarefa criada"); setModal({ type: "none" }); }}>
                      OK
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
};
