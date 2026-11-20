"use client";

import { Card } from "@/components";
import { PdfPlantillasContainer } from "@/features/contabilidad/horas-extra";

export default function ImprimirPdfPage() {
  return (
    <Card title="Imprimir PDFs">
      <PdfPlantillasContainer view="imprimir" />
    </Card>
  );
}
