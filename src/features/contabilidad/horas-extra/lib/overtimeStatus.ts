/**
 * Etiquetas y clases de estado para registros de tiempo suplementario.
 */

export const OVERTIME_STATUS_OPTIONS = [
  "",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "VOIDED",
  "SUPERSEDED",
] as const;

export function overtimeStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobado";
    case "REJECTED":
      return "Rechazado";
    case "VOIDED":
      return "Anulado";
    case "SUPERSEDED":
      return "Reemplazado";
    default:
      return status || "Todos";
  }
}
