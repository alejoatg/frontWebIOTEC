"use client";

import { use } from "react";
import { FlujoPrintView } from "@/features/flujos";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default function ImprimirFlujoPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { print } = use(searchParams);
  return <FlujoPrintView id={id} autoPrint={print === "1"} />;
}
