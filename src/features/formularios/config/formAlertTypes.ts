export const FORM_ALERT_KINDS = [
  "no_informo_supervisor",
  "somnolencia",
  "novedad",
  "no_conforme",
  "observacion",
] as const;

export type FormAlertKind = (typeof FORM_ALERT_KINDS)[number];

export const FORM_ALERT_KIND_META: Record<
  FormAlertKind,
  { label: string; tone: "danger" | "warning" | "info" }
> = {
  no_informo_supervisor: { label: "No informó al supervisor", tone: "danger" },
  somnolencia: { label: "Somnolencia / fatiga", tone: "warning" },
  novedad: { label: "Novedad", tone: "warning" },
  no_conforme: { label: "Ítem no conforme", tone: "warning" },
  observacion: { label: "Observación", tone: "info" },
};

export interface FormAlertRule {
  slug: string;
  /** Campos de inspección (Conforme/No conforme o Bueno/Malo). */
  inspectionFields: string[];
  nonConformingValues: string[];
  observationFields: string[];
  novedadField?: string;
  somnolenciaRiskFields: { key: string; label: string }[];
  somnolenciaSupervisorField?: string;
}

export interface FormAlertMatch {
  kind: FormAlertKind;
  details: string[];
}

export interface FormAlertRow {
  id: string;
  slug: string;
  formTitle: string;
  fecha: string;
  title: string;
  tecnico: string;
  matches: FormAlertMatch[];
  record: Record<string, unknown>;
}
