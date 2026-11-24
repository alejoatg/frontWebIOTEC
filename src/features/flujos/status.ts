import type { FlujoAtencionStatus, FlujoAtencionVisitaEstado } from "./types";

export const FLUJO_STATUS_LABEL: Record<FlujoAtencionStatus, string> = {
  PROGRAMADO: "Programado",
  EN_CAMPO: "En campo",
  REPROGRAMADO: "Reprogramado",
  ATENDIDO: "Atendido",
  ANULADO: "Anulado",
};

export const VISITA_ESTADO_LABEL: Record<FlujoAtencionVisitaEstado, string> = {
  PENDIENTE: "Pendiente",
  COMPLETADA: "Completada",
};

export const FLUJO_STATUS_OPTIONS = (
  Object.entries(FLUJO_STATUS_LABEL) as [FlujoAtencionStatus, string][]
).map(([value, label]) => ({ value, label }));

export function siNoLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "si") return "Sí";
  if (v === "no") return "No";
  return value?.trim() || "—";
}

export function colombiaToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

export function currentMonthRange(): { fechaDesde: string; fechaHasta: string } {
  const today = colombiaToday();
  return { fechaDesde: `${today.slice(0, 8)}01`, fechaHasta: today };
}
