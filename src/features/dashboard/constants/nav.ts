export const DASHBOARD_NAV_ITEMS = [
  { path: "/dashboard", label: "Inicio", icon: "Home" },
  { path: "/dashboard/formularios", label: "Formularios", icon: "FileText" },
  { path: "/dashboard/motorcycles", label: "Motocicletas", icon: "Bike" },
  { path: "/dashboard/catalogos", label: "Catálogos", icon: "BookOpen" },
  {
    path: "/dashboard/contabilidad/horas-extra",
    label: "Horas extra",
    icon: "Clock",
    roles: ["CONTABILIDAD", "ADMIN", "SUPERVISOR", "CORDINADOR"],
  },
  { path: "/dashboard/users", label: "Usuarios", icon: "Users" },
] as const;

export type DashboardNavItem = (typeof DASHBOARD_NAV_ITEMS)[number];

export function getNavItemsForRole(role: string | undefined) {
  if (!role) return [...DASHBOARD_NAV_ITEMS];
  return DASHBOARD_NAV_ITEMS.filter(
    (item) => !("roles" in item) || !item.roles || item.roles.includes(role as never),
  );
}

export function canReviewOvertime(role: string | undefined) {
  return role === "CONTABILIDAD" || role === "ADMIN";
}

export function canManageOvertimeParams(role: string | undefined) {
  return role === "CONTABILIDAD" || role === "ADMIN";
}
