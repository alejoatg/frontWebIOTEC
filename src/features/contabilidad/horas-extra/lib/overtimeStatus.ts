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
      return "Corregido";
    case "OPEN":
      return "Abierto";
    case "CLOSED":
      return "Cerrado";
    default:
      return status || "Todos";
  }
}

export function overtimeValidationLabel(result: string | null | undefined): string {
  switch (result) {
    case "OK":
      return "Correcto";
    case "WARNING":
      return "Advertencia";
    case "ERROR":
      return "Error";
    default:
      return result || "—";
  }
}

export function overtimeSeverityLabel(severity: string | null | undefined): string {
  switch (severity) {
    case "ERROR":
      return "Error";
    case "WARNING":
      return "Advertencia";
    case "INFO":
      return "Info";
    default:
      return severity || "Info";
  }
}
