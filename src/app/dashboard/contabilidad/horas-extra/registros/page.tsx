"use client";

import { Card } from "@/components";
import { RegistrosContainer } from "@/features/contabilidad/horas-extra";

export default function RegistrosHorasExtraPage() {
  return (
    <Card title="Registros de tiempo suplementario">
      <RegistrosContainer />
    </Card>
  );
}
