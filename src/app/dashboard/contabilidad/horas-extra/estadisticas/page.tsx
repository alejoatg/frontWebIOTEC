"use client";

import { Card } from "@/components";
import { EstadisticasContainer } from "@/features/contabilidad/horas-extra";

export default function EstadisticasHorasExtraPage() {
  return (
    <Card title="Estadísticas — Tiempo suplementario">
      <EstadisticasContainer />
    </Card>
  );
}
