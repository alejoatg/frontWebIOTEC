"use client";

import { Card } from "@/components";
import { ConsolidadoContainer } from "@/features/contabilidad/horas-extra";

export default function ConsolidadoHorasExtraPage() {
  return (
    <Card title="Consolidado mensual">
      <ConsolidadoContainer />
    </Card>
  );
}
