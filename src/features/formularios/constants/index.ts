import { FORM_REPORTS } from "../config/formReportsRegistry";
import type { FormularioCard } from "../types";

const ICON_BY_TYPE: Record<string, FormularioCard["icon"]> = {
  Bike: "Bike",
  FileText: "FileText",
  Zap: "Zap",
  ClipboardCheck: "FileText",
  Truck: "Bike",
};

export const FORMULARIOS_CARDS: FormularioCard[] = [
  {
    id: "preoperacionales-motos",
    title: "Preoperacionales Motos",
    description: "Inspección diaria de vehículos tipo motocicleta (ODK Central)",
    icon: "Bike",
    path: "/dashboard/formularios/preoperacionales-motos",
    color: "#3b82f6",
  },
  ...FORM_REPORTS.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.subtitle,
    icon: ICON_BY_TYPE[form.icon] ?? "FileText",
    path: `/dashboard/formularios/${form.slug}`,
    color: form.color,
  })),
];
