/** Fecha civil en America/Bogota (YYYY-MM-DD). */
export function getBogotaIsoDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(date);
}
