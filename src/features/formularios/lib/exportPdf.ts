import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
  title?: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    // Los iframes de Google Maps son cross-origin: html2canvas no puede
    // capturarlos, así que se excluyen del PDF (quedaría un recuadro en blanco).
    ignoreElements: (el) => el.getAttribute("data-pdf-ignore") === "true",
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  if (title) {
    pdf.setFontSize(14);
    pdf.text(title, margin, margin + 4);
  }

  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = title ? margin + 12 : margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - position;

  while (heightLeft > 0) {
    pdf.addPage();
    position = margin - (imgHeight - heightLeft);
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
