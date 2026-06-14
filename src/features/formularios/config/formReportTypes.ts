import type { PaginatedResponse } from "../types";

export type FormReportFilterField =
  | { type: "dateRange" }
  | { type: "text"; key: string; label: string; placeholder?: string }
  | {
      type: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
      emptyLabel?: string;
    };

export interface FormReportColumn {
  key: string;
  label: string;
  accessor?: (row: Record<string, unknown>) => unknown;
  format?: "datetime" | "shortDate" | "brigada" | "tipoInspeccion" | "text";
}

export interface FormReportDetailSection {
  title: string;
  keys: string[];
}

export interface FormReportEvidenceField {
  label: string;
  key: string;
  multiple?: boolean;
  /** Array de objetos { url, tipo, tipoOtro? } */
  tagged?: boolean;
}

export interface FormReportConfig {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon: "Bike" | "FileText" | "Zap" | "ClipboardCheck" | "Truck";
  color: string;
  apiBasePath: string;
  excelFileName: string;
  detailTitle: (record: Record<string, unknown>) => string;
  filterFields: FormReportFilterField[];
  listColumns: FormReportColumn[];
  detailSections: FormReportDetailSection[];
  evidenceFields: FormReportEvidenceField[];
  /** Transforma filas del API antes de mostrar/exportar */
  mapListRow?: (row: Record<string, unknown>) => Record<string, unknown>;
  /** Transforma detalle del API */
  mapDetailRecord?: (row: Record<string, unknown>) => Record<string, unknown>;
  buildQueryParams: (filter: Record<string, unknown>) => URLSearchParams;
}

export type FormReportListResponse = PaginatedResponse<Record<string, unknown>>;
