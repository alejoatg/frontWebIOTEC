"use client";

import { Card } from "@/components";
import { ResumenContainer } from "@/features/contabilidad/horas-extra";

export default function HorasExtraPage() {
  return (
    <Card title="Tiempo suplementario">
      <ResumenContainer />
    </Card>
  );
}
