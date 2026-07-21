import type { OvertimeEntryRow } from "../api/overtimeApi";
import { formatClockTime } from "./timeFormat";

export interface SpreadsheetColumn {
  id: string;
  header: string;
  getValue: (entry: OvertimeEntryRow) => string | number | null | undefined;
  align?: "left" | "right";
}

function num(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("es-CO", { maximumFractionDigits: 4 });
}

function money(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  return Number(v).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function date(v: string | null | undefined): string {
  if (!v) return "";
  return new Date(v).toLocaleDateString("es-CO");
}

/** Columnas alineadas con la hoja `Carga TS` del Excel. */
export const SPREADSHEET_COLUMNS: SpreadsheetColumn[] = [
  { id: "entryCode", header: "CÓDIGO", getValue: (e) => e.entryCode },
  { id: "excelRowNumber", header: "FILA EXCEL", getValue: (e) => e.excelRowNumber ?? "" },
  { id: "workDate", header: "FECHA (DIA/MES/AÑO)", getValue: (e) => date(e.workDate) },
  { id: "employeeDocumentNumber", header: "CEDULA", getValue: (e) => e.employeeDocumentNumber },
  { id: "employeeFullName", header: "NOMBRES", getValue: (e) => e.employeeFullName },
  { id: "jobPositionName", header: "CARGO", getValue: (e) => e.jobPositionName ?? "" },
  { id: "processName", header: "PROCESO", getValue: (e) => e.processName ?? "" },
  { id: "zoneName", header: "ZONA", getValue: (e) => e.zoneName ?? "" },
  { id: "startTime", header: "HORA INICIO TS", getValue: (e) => formatClockTime(e.startTime) },
  { id: "endTime", header: "HORA FINAL TS", getValue: (e) => formatClockTime(e.endTime) },
  { id: "hoursStartEndTotal", header: "Total Horas Inicio-Final TS", getValue: (e) => num(e.hoursStartEndTotal), align: "right" },
  { id: "hoursRd", header: "RD", getValue: (e) => num(e.hoursRd), align: "right" },
  { id: "hoursRn", header: "RN", getValue: (e) => num(e.hoursRn), align: "right" },
  { id: "hoursTsd", header: "TSD", getValue: (e) => num(e.hoursTsd), align: "right" },
  { id: "hoursTsn", header: "TSN", getValue: (e) => num(e.hoursTsn), align: "right" },
  { id: "hoursHedd", header: "HEDD", getValue: (e) => num(e.hoursHedd), align: "right" },
  { id: "hoursHend", header: "HEND", getValue: (e) => num(e.hoursHend), align: "right" },
  { id: "hoursDisponibilidad", header: "DISPONIBILIDAD", getValue: (e) => num(e.hoursDisponibilidad), align: "right" },
  { id: "hoursCategoriesTotal", header: "TOTAL DE HORAS", getValue: (e) => num(e.hoursCategoriesTotal), align: "right" },
  { id: "hoursValidatorDelta", header: "VALIDADOR", getValue: (e) => num(e.hoursValidatorDelta), align: "right" },
  { id: "salarySnapshot", header: "COMPENSACION", getValue: (e) => money(e.salarySnapshot), align: "right" },
  { id: "amountRd", header: "RD $", getValue: (e) => money(e.amountRd), align: "right" },
  { id: "amountRn", header: "RN $", getValue: (e) => money(e.amountRn), align: "right" },
  { id: "amountTsd", header: "TSD $", getValue: (e) => money(e.amountTsd), align: "right" },
  { id: "amountTsn", header: "TSN $", getValue: (e) => money(e.amountTsn), align: "right" },
  { id: "amountHedd", header: "HEDD $", getValue: (e) => money(e.amountHedd), align: "right" },
  { id: "amountHend", header: "HEND $", getValue: (e) => money(e.amountHend), align: "right" },
  { id: "amountDisponibilidad", header: "DISPONIBILIDAD $", getValue: (e) => money(e.amountDisponibilidad), align: "right" },
  { id: "amountSubtotal", header: "SUBTOTAL", getValue: (e) => money(e.amountSubtotal), align: "right" },
  { id: "payrollFactorSnapshot", header: "FACTOR", getValue: (e) => num(e.payrollFactorSnapshot), align: "right" },
  { id: "amountTotal", header: "TOTAL", getValue: (e) => money(e.amountTotal), align: "right" },
  { id: "commissionMunicipality", header: "MUNICIPIO DONDE CAUSO EL TIEMPO SUPLEMENTARIO", getValue: (e) => e.commissionMunicipality ?? "" },
  { id: "brigadeCode", header: "CODIGO DE BRIGADA / PORTATIL", getValue: (e) => e.brigadeCode ?? "" },
  { id: "baseMunicipality", header: "MUNICIPIO SEDE DONDE LABORA", getValue: (e) => e.baseMunicipality ?? "" },
  { id: "submittedBy", header: "SUPERVISOR QUIEN DIGITA", getValue: (e) => e.submittedBy?.name ?? "" },
  { id: "systemName", header: "SISTEMA", getValue: (e) => e.systemName ?? "" },
  { id: "itinerary", header: "ITINERARIO", getValue: (e) => e.itinerary ?? "" },
  { id: "caseRef", header: "CASO", getValue: (e) => e.caseRef ?? "" },
  { id: "workRef", header: "TRABAJO", getValue: (e) => e.workRef ?? "" },
  { id: "ticketRef", header: "TICKET", getValue: (e) => e.ticketRef ?? "" },
  { id: "consigna", header: "CONSIGNA", getValue: (e) => e.consigna ?? "" },
  { id: "attachmentRef", header: "ARCHIVO", getValue: (e) => e.attachmentRef ?? "" },
  { id: "status", header: "ESTADO", getValue: (e) => e.status },
  { id: "operationalNote", header: "OBSERVACION OPERATIVA", getValue: (e) => e.operationalNote ?? "" },
  { id: "accountingNote", header: "OBSERVACION CONTABILIDAD", getValue: (e) => e.accountingNote ?? "" },
  { id: "genderSnapshot", header: "GENERO", getValue: (e) => e.genderSnapshot ?? "" },
  { id: "importBatch", header: "PLANILLA", getValue: (e) => e.importBatch?.batchCode ?? "" },
];

export interface DetailField {
  label: string;
  getValue: (entry: OvertimeEntryRow) => string | number | null | undefined;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
}

export const DETAIL_SECTIONS: DetailSection[] = [
  {
    title: "Identificación",
    fields: [
      { label: "Código registro", getValue: (e) => e.entryCode },
      { label: "Fila Excel", getValue: (e) => e.excelRowNumber ?? "—" },
      { label: "Planilla", getValue: (e) => e.importBatch?.batchCode ?? "—" },
      { label: "Archivo origen", getValue: (e) => e.importBatch?.originalFilename ?? "—" },
      { label: "Periodo", getValue: (e) => e.period?.periodCode ?? "—" },
    ],
  },
  {
    title: "Empleado",
    fields: [
      { label: "Cédula", getValue: (e) => e.employeeDocumentNumber },
      { label: "Nombre", getValue: (e) => e.employeeFullName },
      { label: "Género", getValue: (e) => e.genderSnapshot ?? "—" },
      { label: "Cargo", getValue: (e) => e.jobPositionName ?? "—" },
      { label: "Proceso", getValue: (e) => e.processName ?? "—" },
      { label: "Zona", getValue: (e) => e.zoneName ?? "—" },
    ],
  },
  {
    title: "Fecha y horario",
    fields: [
      { label: "Fecha trabajo", getValue: (e) => date(e.workDate) },
      { label: "Hora inicio", getValue: (e) => formatClockTime(e.startTime) || "—" },
      { label: "Hora fin", getValue: (e) => formatClockTime(e.endTime) || "—" },
      { label: "Total inicio–fin", getValue: (e) => num(e.hoursStartEndTotal) || "—" },
    ],
  },
  {
    title: "Horas por categoría",
    fields: [
      { label: "RD", getValue: (e) => num(e.hoursRd) },
      { label: "RN", getValue: (e) => num(e.hoursRn) },
      { label: "TSD", getValue: (e) => num(e.hoursTsd) },
      { label: "TSN", getValue: (e) => num(e.hoursTsn) },
      { label: "HEDD", getValue: (e) => num(e.hoursHedd) },
      { label: "HEND", getValue: (e) => num(e.hoursHend) },
      { label: "Disponibilidad", getValue: (e) => num(e.hoursDisponibilidad) },
      { label: "Total horas", getValue: (e) => num(e.hoursCategoriesTotal) || "—" },
      { label: "Validador", getValue: (e) => num(e.hoursValidatorDelta) || "—" },
    ],
  },
  {
    title: "Contabilidad",
    fields: [
      { label: "Compensación (salario)", getValue: (e) => money(e.salarySnapshot) },
      { label: "Divisor horario", getValue: (e) => e.hourlyDivisorSnapshot ?? 220 },
      { label: "Factor nómina", getValue: (e) => num(e.payrollFactorSnapshot) },
      { label: "RD $", getValue: (e) => money(e.amountRd) },
      { label: "RN $", getValue: (e) => money(e.amountRn) },
      { label: "TSD $", getValue: (e) => money(e.amountTsd) },
      { label: "TSN $", getValue: (e) => money(e.amountTsn) },
      { label: "HEDD $", getValue: (e) => money(e.amountHedd) },
      { label: "HEND $", getValue: (e) => money(e.amountHend) },
      { label: "Disponibilidad $", getValue: (e) => money(e.amountDisponibilidad) },
      { label: "Subtotal", getValue: (e) => money(e.amountSubtotal) },
      { label: "Total", getValue: (e) => money(e.amountTotal) },
    ],
  },
  {
    title: "Operativo",
    fields: [
      { label: "Municipio causación", getValue: (e) => e.commissionMunicipality ?? "—" },
      { label: "Municipio sede", getValue: (e) => e.baseMunicipality ?? "—" },
      { label: "Brigada / portátil", getValue: (e) => e.brigadeCode ?? "—" },
      { label: "Sistema", getValue: (e) => e.systemName ?? "—" },
      { label: "Itinerario", getValue: (e) => e.itinerary ?? "—" },
      { label: "Caso", getValue: (e) => e.caseRef ?? "—" },
      { label: "Trabajo", getValue: (e) => e.workRef ?? "—" },
      { label: "Ticket", getValue: (e) => e.ticketRef ?? "—" },
      { label: "Consigna", getValue: (e) => e.consigna ?? "—" },
      { label: "Archivo adjunto", getValue: (e) => e.attachmentRef ?? "—" },
      { label: "Observación operativa", getValue: (e) => e.operationalNote ?? "—" },
    ],
  },
  {
    title: "Revisión",
    fields: [
      { label: "Estado", getValue: (e) => e.status },
      { label: "Validación", getValue: (e) => e.validationResult },
      { label: "Supervisor", getValue: (e) => e.submittedBy?.name ?? "—" },
      { label: "Revisado por", getValue: (e) => e.reviewedBy?.name ?? "—" },
      { label: "Fecha revisión", getValue: (e) => (e.reviewedAt ? date(e.reviewedAt) : "—") },
      { label: "Observación contabilidad", getValue: (e) => e.accountingNote ?? "—" },
    ],
  },
];
