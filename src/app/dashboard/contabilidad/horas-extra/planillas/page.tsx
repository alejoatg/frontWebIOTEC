"use client";

import { Card } from "@/components";
import { PlanillasContainer } from "@/features/contabilidad/horas-extra";

export default function PlanillasHorasExtraPage() {
  return (
    <Card title="Planillas registradas">
      <PlanillasContainer />
    </Card>
  );
}
