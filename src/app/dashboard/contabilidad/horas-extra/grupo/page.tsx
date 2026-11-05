"use client";

import { Card } from "@/components";
import { GrupoRegistrosContainer } from "@/features/contabilidad/horas-extra";

export default function GrupoRegistrosHorasExtraPage() {
  return (
    <Card title="Registros del grupo">
      <GrupoRegistrosContainer />
    </Card>
  );
}
