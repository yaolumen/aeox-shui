"use client";
import { useState, useCallback } from "react";
import type { Locale } from "@/lib/config";

interface StyleConfig {
  theme: string;
  icon: string;
  columns: number;
}

interface PdfDownloadModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  reportId: string;
  style: StyleConfig;
}

const T = {
  en: {
    download: "Download PDF",
    generating: "Generating PDF...",
    preview: "Preview",
    close: "Close",
    error: "PDF generation failed. Please try again.",
  },
  "zh-CN": {
    download: "下载 PDF",
    generating: "正在生成 PDF...",
    preview: "预览",
    close: "关闭",
    error: "PDF 生成失败，请重试。",
  },
} as const;

export function PdfDownloadModal(props: PdfDownloadModalProps) {
  const { open, onClose, locale, reportId, style } = props;
  const t = T[locale];
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);

  const previewUrl = `/api/v1/report/${reportId}/preview?theme=${style.theme}&icon=${style.icon}&columns=${style.columns}`;

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    setError(false);
    let container: HTMLDivElement | null = null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const resp = await fetch(previewUrl);
      if (!resp.ok) throw new Error("fetch failed");
      let htmlText = await resp.text();

      htmlText = htmlText.replace(/@import\s+url\([^)]+\);\s*/g, "");

      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "210mm";
      document.body.appendChild(container);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const sourceBody = doc.querySelector("body");
      const sourceStyle = doc.querySelector("style");
      if (!sourceBody) {
        if (container) document.body.removeChild(container);
        throw new Error("no body in HTML");
      }

      if (sourceStyle) container.appendChild(sourceStyle.cloneNode(true));
      const bodyClone = sourceBody.cloneNode(true) as HTMLElement;
      bodyClone.style.background = bodyClone.style.background || "none";
      container.appendChild(bodyClone);

      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      const pages = Array.from(bodyClone.querySelectorAll(".page")) as HTMLElement[];
      if (pages.length === 0) throw new Error("no .page elements found");

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = 210;
      const pageHeight = 297;
      const pxPerMm = 3.7795275591;
      const a4PxHeight = Math.round(pageHeight * pxPerMm) * 2;
      let firstPage = true;

      const bodyStyle = sourceBody?.getAttribute("style") || "";
      const isGlass = bodyStyle.includes("667EEA") || bodyStyle.includes("764BA2");

      for (const pageEl of pages) {
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: Math.round(pageWidth * pxPerMm),
          width: Math.round(pageWidth * pxPerMm),
          backgroundColor: null,
        });

        const slices = Math.ceil(canvas.height / a4PxHeight);
        for (let s = 0; s < slices; s++) {
          if (!firstPage) pdf.addPage();
          firstPage = false;

          const srcY = s * a4PxHeight;
          const srcH = Math.min(a4PxHeight, canvas.height - srcY);

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext("2d");
          if (!ctx) throw new Error("canvas 2d context unavailable");

          if (isGlass) {
            const grad = ctx.createLinearGradient(0, 0, sliceCanvas.width, sliceCanvas.height);
            grad.addColorStop(0, "#667EEA");
            grad.addColorStop(1, "#764BA2");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, sliceCanvas.width, srcH);
          }

          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          const sliceW = pageWidth;
          const sliceH = (srcH / a4PxHeight) * pageHeight;
          const imgData = sliceCanvas.toDataURL("image/jpeg", 0.98);
          pdf.addImage(imgData, "JPEG", 0, 0, sliceW, sliceH, undefined, "FAST");
        }
      }

      pdf.save(`shui-report-${reportId.slice(0, 8)}.pdf`);
      if (container && container.parentNode) document.body.removeChild(container);
    } catch (err) {
      console.error("[PdfDownloadModal] PDF generation failed:", err);
      setError(true);
      if (container && container.parentNode) document.body.removeChild(container);
    } finally {
      setGenerating(false);
    }
  }, [previewUrl, reportId]);

  const handlePreview = useCallback(() => {
    window.open(previewUrl, "_blank");
  }, [previewUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {error && (
          <p className="mb-3 text-xs text-red-600 dark:text-red-400">{t.error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.generating}
              </span>
            ) : t.download}
          </button>
          <button
            onClick={handlePreview}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {t.preview}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
