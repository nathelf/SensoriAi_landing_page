import React, { useState } from "react";
import { Download, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  getDashboardElement?: () => HTMLElement | null;
  logoSrc?: string;
};

export const DashboardHeader: React.FC<Props> = ({ getDashboardElement, logoSrc: logoSrcProp }) => {
  const { setTheme } = useTheme();

  // Brand color - altere para sua cor (HEX)
  const brandColor = "#1E90FF"; // exemplo: azul. Troque se quiser (#1A7F3D etc.)

  // Configurações do PDF (UI)
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [includeToc, setIncludeToc] = useState(true);
  const [mode, setMode] = useState<"visual" | "data">("data");
  const [title, setTitle] = useState("SensoriAI Dashboard");

  // Helper: adiciona rodapé (número + marca)
  const addFooter = (pdf: jsPDF, pageWidthMm: number, pageHeightMm: number, marginMm: number) => {
    const current = pdf.internal.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    // direita: número da página
    pdf.text(`Página ${current}`, pageWidthMm - marginMm, pageHeightMm - 8, { align: "right" });
    // esquerda: pequena marca/rodapé
    pdf.text("sensoriAI — Relatório", marginMm, pageHeightMm - 8);
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Preparando PDF...");
      const element =
        (getDashboardElement && getDashboardElement()) || document.getElementById("dashboard-content");
      if (!element) {
        toast.error("Conteúdo do dashboard não encontrado (id='dashboard-content' ou ref).");
        console.error("Nenhum elemento #dashboard-content e nenhuma ref fornecida.");
        return;
      }

      const clone = element.cloneNode(true) as HTMLElement;
      if (mode === "visual") {
        const dataEls = clone.querySelectorAll<HTMLElement>(".data-only, [data-hide-on-visual]");
        dataEls.forEach((el) => el.remove());
      }

      // resolve logo (prop > DOM > fallback)
      const logoEl = document.getElementById("report-logo") as HTMLImageElement | null;
      const resolvedLogoSrc = logoSrcProp || (logoEl ? logoEl.src : null) || "/images/logo1.png";

      // PDF config
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();
      const marginMm = 12;
      const usableWidthMm = pageWidthMm - marginMm * 2;

      // metadados
      pdf.setProperties({
        title,
        subject,
        author,
        keywords: "sensoriAI, dashboard, relatório",
        creator: "sensoriAI",
      });

      // ----- CAPA CORPORATE -----
      toast.loading("Gerando capa...");
      pdf.setFillColor(brandColor);
      // faixa vertical colorida (tarja) à esquerda
      const stripeWidthMm = 28;
      pdf.rect(0, 0, stripeWidthMm, pageHeightMm, "F");

      // leve topo colorido (faixa horizontal fina)
      pdf.rect(0, 0, pageWidthMm, 8, "F");

      pdf.setFontSize(26);
      pdf.setTextColor(30);

      // logo
      let afterLogoY = 80; // fallback
      if (resolvedLogoSrc) {
        try {
          const img = await loadImageAsDataURL(resolvedLogoSrc);

          const logoWidthMm = 110; // ajuste se quiser
          const logoHeightMm = (img.height / img.width) * logoWidthMm;
          const logoX = (pageWidthMm - logoWidthMm) / 2;
          const logoY = 28; // top abaixo da tarja superior

          pdf.addImage(img.dataUrl, "PNG", logoX, logoY, logoWidthMm, logoHeightMm);

          // posição exata do conteúdo abaixo da logo
          afterLogoY = logoY + logoHeightMm + 16;
        } catch (err) {
          console.warn("Não foi possível carregar logo para capa:", err);
          toast("Não foi possível carregar a logo para a capa. Verifique caminho/CORS (veja console).");
        }
      }

      // título e subtítulo centralizados
      pdf.setFontSize(28);
      pdf.setTextColor(17);
      pdf.text(title, pageWidthMm / 2, afterLogoY, { align: "center" });

      pdf.setFontSize(12);
      pdf.setTextColor(80);
      pdf.text("Relatório Analítico — Análise completa da lavoura", pageWidthMm / 2, afterLogoY + 10, {
        align: "center",
      });

      const now = new Date();
      const formatted = now.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${formatted}`, pageWidthMm / 2, afterLogoY + 22, { align: "center" });
      if (author) pdf.text(`Autor: ${author}`, pageWidthMm / 2, afterLogoY + 28, { align: "center" });

      // rodapé da capa
      addFooter(pdf, pageWidthMm, pageHeightMm, marginMm);

      // ----- PREPARAR CAPTURA DO DASHBOARD -----
      const offscreen = document.createElement("div");
      offscreen.style.position = "fixed";
      offscreen.style.left = "-9999px";
      offscreen.style.top = "0";
      offscreen.style.width = `${element.scrollWidth}px`;
      offscreen.style.overflow = "visible";
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      toast.loading("Capturando dashboard...");
      const scale = Math.min(3, window.devicePixelRatio || 2);
      const canvas = await html2canvas(clone, {
        scale,
        logging: false,
        useCORS: true,
        imageTimeout: 20000,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      document.body.removeChild(offscreen);

      // paginação
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const mmPerPx = usableWidthMm / imgWidthPx;
      const pageHeightPx = Math.floor(pageHeightMm / mmPerPx);

      const contentSlices: string[] = [];
      for (let y = 0; y < imgHeightPx; y += pageHeightPx) {
        const sliceHeight = Math.min(pageHeightPx, imgHeightPx - y);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgWidthPx;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) continue;
        ctx.drawImage(canvas, 0, y, imgWidthPx, sliceHeight, 0, 0, imgWidthPx, sliceHeight);
        contentSlices.push(pageCanvas.toDataURL("image/png"));
      }

      // TOC (sumário)
      let tocEntries: { text: string; page: number }[] = [];
      if (includeToc) {
        const headings = element.querySelectorAll<HTMLElement>("h1, h2, h3");
        headings.forEach((h) => {
          const offsetTop = h.offsetTop || 0;
          const headingPxOnCanvas = offsetTop * scale;
          const pageIndexWithinContent = Math.floor(headingPxOnCanvas / pageHeightPx);
          const pdfPage = 3 + pageIndexWithinContent; // 1=capa, 2=toc
          tocEntries.push({
            text: (h.innerText || h.textContent || "Seção").trim(),
            page: pdfPage,
          });
        });
      }

      if (includeToc) {
        pdf.addPage(); // página de sumário
        // desenha faixa superior colorida também na página de TOC
        pdf.setFillColor(brandColor);
        pdf.rect(0, 0, pageWidthMm, 8, "F");

        pdf.setFontSize(16);
        pdf.setTextColor(20);
        pdf.text("Sumário", marginMm + 4, 28);

        pdf.setFontSize(11);
        pdf.setTextColor(80);
        const lineHeight = 7;
        let yPos = 40;
        if (tocEntries.length === 0) {
          pdf.setFontSize(10);
          pdf.text("Nenhuma seção encontrada para o sumário. Use h1/h2/h3 para títulos.", marginMm, yPos);
        } else {
          tocEntries.forEach((entry) => {
            if (yPos > pageHeightMm - marginMm - 20) {
              pdf.addPage();
              // faixa superior na nova página de TOC
              pdf.setFillColor(brandColor);
              pdf.rect(0, 0, pageWidthMm, 8, "F");
              yPos = marginMm + 18;
            }
            pdf.text(entry.text, marginMm + 4, yPos);
            pdf.text(String(entry.page), pageWidthMm - marginMm, yPos, { align: "right" });
            yPos += lineHeight;
          });
        }
        addFooter(pdf, pageWidthMm, pageHeightMm, marginMm);
      }

      // conteúdo paginado com faixa superior leve (opcional) e rodapé
      for (let i = 0; i < contentSlices.length; i++) {
        pdf.addPage();
        // faixa superior (marca pequena)
        pdf.setFillColor(brandColor);
        pdf.rect(0, 0, pageWidthMm, 6, "F");

        const imgData = contentSlices[i];
        const sliceHeightPx = Math.min(pageHeightPx, imgHeightPx - i * pageHeightPx);
        const imgHeightMm = sliceHeightPx * mmPerPx;
        // coloca a imagem um pouco abaixo da faixa superior
        const contentY = marginMm + 4;
        // ajustar altura utilizável? mantemos a largura usableWidthMm e altura proporcional (pode cortar se muito alta)
        pdf.addImage(imgData, "PNG", marginMm, contentY, usableWidthMm, imgHeightMm);
        addFooter(pdf, pageWidthMm, pageHeightMm, marginMm);
      }

      toast.dismiss();
      toast.success("PDF gerado com sucesso!");
      pdf.save(`${title.replace(/\s+/g, "_").toLowerCase() || "relatorio"}-sensoriAI.pdf`);
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao gerar PDF");
      console.error("Erro gerando PDF:", error);
    }
  };

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SensoriAI Dashboard</h1>
          <p className="text-sm text-muted-foreground">Análise completa da lavoura</p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="p-4 w-72">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Título do relatório</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <label className="text-xs text-muted-foreground">Autor (metadado)</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder="Nome do autor"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />

                <label className="text-xs text-muted-foreground">Assunto (subject)</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder="Assunto do relatório"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <label className="text-sm">Incluir sumário</label>
                  <input type="checkbox" checked={includeToc} onChange={() => setIncludeToc(!includeToc)} />
                </div>

                <div>
                  <label className="text-sm">Modo</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      className={`px-2 py-1 rounded text-sm border ${mode === "data" ? "bg-muted" : ""}`}
                      onClick={() => setMode("data")}
                    >
                      Com dados
                    </button>
                    <button
                      className={`px-2 py-1 rounded text-sm border ${mode === "visual" ? "bg-muted" : ""}`}
                      onClick={() => setMode("visual")}
                    >
                      Apenas visualizações
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use <code className="text-xs">.data-only</code> ou <code className="text-xs">data-hide-on-visual</code>{" "}
                    em elementos que devem ser ocultados no modo "Apenas visualizações".
                  </p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </header>
  );
};

/**
 * loadImageAsDataURL: tenta fetch -> blob -> dataURL; se falhar usa Image + canvas como fallback.
 */
async function loadImageAsDataURL(src: string): Promise<{ dataUrl: string; width: number; height: number }> {
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) throw new Error(`fetch status ${res.status}`);
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("FileReader result vazio"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });

    return { dataUrl, width: dims.w, height: dims.h };
  } catch (fetchErr) {
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context error");
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = src;
        if (img.complete && img.naturalWidth) {
          img.onload?.(null as any);
        }
      });
    } catch (imgErr) {
      throw new Error(
        `Falha ao carregar imagem. fetchErr: ${fetchErr?.message || fetchErr}, imgErr: ${imgErr?.message || imgErr}`
      );
    }
  }
}
