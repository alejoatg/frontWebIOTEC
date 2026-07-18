"use client";

import { Card } from "@/components";
import { PdfPlantillasContainer } from "@/features/contabilidad/horas-extra";

export default function PdfHorasExtraPage() {
  return (
    <Card title="Planillas PDF (PGFI-001-04)">
      <PdfPlantillasContainer />
    </Card>
  );
}
