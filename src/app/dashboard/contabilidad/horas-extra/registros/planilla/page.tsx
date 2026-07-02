"use client";

import { Card } from "@/components";
import { RegistrosPlanillaContainer } from "@/features/contabilidad/horas-extra";

export default function RegistrosPlanillaPage() {
  return (
    <Card title="Vista planilla — todos los campos">
      <RegistrosPlanillaContainer />
    </Card>
  );
}
