"use client";

import { useParams } from "next/navigation";
import { FlujoDetalle } from "@/features/flujos";

export default function FlujoAtencionDetallePage() {
  const params = useParams();
  const id = params.id as string;
  return <FlujoDetalle id={id} />;
}
