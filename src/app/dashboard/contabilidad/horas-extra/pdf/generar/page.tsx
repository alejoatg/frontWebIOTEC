"use client";

import { Card } from "@/components";
import { PdfPlantillasContainer } from "@/features/contabilidad/horas-extra";

export default function GenerarPdfPage() {
  return (
    <Card title="Generar PDFs">
      <PdfPlantillasContainer view="generar" />
    </Card>
  );
}
