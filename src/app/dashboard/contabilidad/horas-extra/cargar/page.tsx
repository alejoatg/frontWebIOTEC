"use client";

import { Card } from "@/components";
import { CargaContainer } from "@/features/contabilidad/horas-extra";

export default function CargarHorasExtraPage() {
  return (
    <Card title="Cargar planilla Excel">
      <CargaContainer />
    </Card>
  );
}
