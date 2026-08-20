"use client";

import { Card } from "@/components";
import { MisRegistrosContainer } from "@/features/contabilidad/horas-extra";

export default function MisRegistrosHorasExtraPage() {
  return (
    <Card title="Mis registros de tiempo suplementario">
      <MisRegistrosContainer />
    </Card>
  );
}
