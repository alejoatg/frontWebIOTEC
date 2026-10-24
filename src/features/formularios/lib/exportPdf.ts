import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { downloadBlob } from "./downloadBlob";

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_X_MM = 10;
const MARGIN_TOP_MM = 10;
/** Margen inferior más alto para dejar espacio al pie de página. */
const MARGIN_BOTTOM_MM = 14;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_X_MM * 2;
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM;
/** Navegadores limitan el alto de un canvas (~32k px); se reduce la escala en informes largos. */
const MAX_CANVAS_HEIGHT_PX = 30000;

interface PdfBlock {
  top: number;
  bottom: number;
  keepWithNext: boolean;
}

interface ExportSheetOptions {
  /** Texto del pie de página (izquierda). */
  footerLabel?: string;
  /** Tiempo máximo esperando que carguen fotos y firmas. */
  mediaTimeoutMs?: number;
}

/** Espera a que `MediaImage` termine de descargar y que las `<img>` estén decodificadas. */
async function waitForMedia(root: HTMLElement, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const pending = root.querySelector('[data-media-loading="true"]');
    const images = Array.from(root.querySelectorAll("img"));
    const allDecoded = images.every((img) => img.complete);
    if (!pending && allDecoded) {
      await Promise.all(images.map((img) => img.decode().catch(() => undefined)));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

function collectBlocks(root: HTMLElement): PdfBlock[] {
  const rootTop = root.getBoundingClientRect().top;
  return Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]"))
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top - rootTop,
        bottom: rect.bottom - rootTop,
        keepWithNext: el.hasAttribute("data-pdf-keep-next"),
      };
    })
    .sort((a, b) => a.top - b.top);
}

/**
 * Elige dónde termina cada página: en el inicio del último bloque que cabe completo,
 * sin partir filas/fotos y sin dejar un título de sección huérfano al pie.
 */
function computePageSlices(
  blocks: PdfBlock[],
  totalHeight: number,
  pageHeight: number,
): Array<[number, number]> {
  const slices: Array<[number, number]> = [];
  const isInsideBlock = (y: number) =>
    blocks.some((b) => b.top < y - 0.5 && b.bottom > y + 0.5);

  let start = 0;
  while (totalHeight - start > 1) {
    const limit = start + pageHeight;
    if (limit >= totalHeight) {
      slices.push([start, totalHeight]);
      break;
    }

    let breakIndex = -1;
    for (let i = 0; i < blocks.length; i++) {
      const t = blocks[i].top;
      if (t > start + 1 && t <= limit && !isInsideBlock(t)) breakIndex = i;
    }

    while (
      breakIndex > 0 &&
      blocks[breakIndex - 1].keepWithNext &&
      blocks[breakIndex - 1].top > start + 1
    ) {
      breakIndex -= 1;
    }

    const end = breakIndex >= 0 ? blocks[breakIndex].top : limit;
    slices.push([start, end]);
    start = end;
  }
  return slices;
}

/**
 * Genera el PDF A4 de la hoja de informe (`FormSubmissionSheet` en variante `pdf`)
 * con los mismos márgenes que la vista de impresión y paginación por bloques.
 */
export async function renderSheetToPdfBlob(
  sheet: HTMLElement,
  { footerLabel, mediaTimeoutMs = 20000 }: ExportSheetOptions = {},
): Promise<Blob> {
  await waitForMedia(sheet, mediaTimeoutMs);

  const rect = sheet.getBoundingClientRect();
  const totalHeight = rect.height;
  const pxPerMm = rect.width / CONTENT_WIDTH_MM;
  const slices = computePageSlices(
    collectBlocks(sheet),
    totalHeight,
    CONTENT_HEIGHT_MM * pxPerMm,
  );

  const scale = Math.min(2, MAX_CANVAS_HEIGHT_PX / totalHeight);
  const canvas = await html2canvas(sheet, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
  const canvasPerCssPx = canvas.width / rect.width;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageCount = slices.length;

  slices.forEach(([start, end], index) => {
    if (index > 0) pdf.addPage();

    const sourceY = Math.round(start * canvasPerCssPx);
    const sourceHeight = Math.max(1, Math.round((end - start) * canvasPerCssPx));
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar la página del PDF");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sourceHeight,
      0,
      0,
      canvas.width,
      sourceHeight,
    );

    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      MARGIN_X_MM,
      MARGIN_TOP_MM,
      CONTENT_WIDTH_MM,
      (end - start) / pxPerMm,
    );

    const footerY = PAGE_HEIGHT_MM - 7;
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    if (footerLabel) {
      pdf.text(footerLabel, MARGIN_X_MM, footerY, {
        maxWidth: CONTENT_WIDTH_MM - 30,
      });
    }
    pdf.text(`Página ${index + 1} de ${pageCount}`, PAGE_WIDTH_MM - MARGIN_X_MM, footerY, {
      align: "right",
    });
  });

  return pdf.output("blob");
}

/** Genera el PDF de la hoja de informe y lo descarga. */
export async function exportSheetToPdf(
  sheet: HTMLElement,
  fileName: string,
  options: ExportSheetOptions = {},
): Promise<void> {
  const blob = await renderSheetToPdfBlob(sheet, options);
  downloadBlob(blob, fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
