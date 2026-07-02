"use client";

import { use } from "react";
import { Card } from "@/components";
import { RegistroDetalleContainer } from "@/features/contabilidad/horas-extra";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RegistroDetallePage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Card title="Detalle del registro">
      <RegistroDetalleContainer entryId={id} />
    </Card>
  );
}
