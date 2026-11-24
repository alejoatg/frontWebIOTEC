import { getFormReportBySlug } from "../config/formReportsRegistry";

export function isExternoRole(role: string | undefined): boolean {
  return role === "EXTERNO";
}

export function isFormReportVisibleToRole(
  form: { visibleToRoles?: string[] } | undefined,
  role: string | undefined,
): boolean {
  if (role === "EXTERNO") {
    return form?.visibleToRoles?.includes("EXTERNO") === true;
  }
  return true;
}

const EXTERNO_BLOCKED_SLUGS = new Set([
  "alertas",
  "mapa",
  "preoperacionales-motos",
]);

/** Rutas del dashboard que un EXTERNO puede abrir. */
export function isExternoDashboardPathAllowed(pathname: string): boolean {
  if (pathname === "/dashboard/flujos" || pathname.startsWith("/dashboard/flujos/")) {
    return true;
  }
  if (pathname === "/dashboard/formularios") return false;
  const match = pathname.match(/^\/dashboard\/formularios\/([^/]+)/);
  if (!match) return false;
  const slug = match[1];
  if (EXTERNO_BLOCKED_SLUGS.has(slug)) return false;
  const form = getFormReportBySlug(slug);
  return isFormReportVisibleToRole(form, "EXTERNO");
}
