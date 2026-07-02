import { API_URL } from "@/lib/api";

const BASE = `${API_URL}/api/overtime`;

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (body as { message?: string | string[] }).message ??
      `Error ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function getTemplateDownloadUrl() {
  return `${BASE}/imports/template`;
}

export async function previewImport(year: number, month: number, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("year", String(year));
  fd.append("month", String(month));
  return request<ImportPreview>(`/imports/preview`, { method: "POST", body: fd });
}

export async function registerImport(year: number, month: number, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("year", String(year));
  fd.append("month", String(month));
  return request<ImportRegisterResult>(`/imports/register`, { method: "POST", body: fd });
}

export async function fetchPeriods() {
  return request<OvertimePeriod[]>("/periods");
}

export async function fetchPeriod(year: number, month: number) {
  return request<OvertimePeriodDetail | null>(`/periods/${year}/${month}`);
}

export async function fetchBatches(year: number, month: number) {
  return request<OvertimeBatch[]>(`/batches?year=${year}&month=${month}`);
}

export async function fetchEntries(params: {
  year: number;
  month: number;
  status?: string;
  batchId?: string;
  documentNumber?: string;
  workDateFrom?: string;
  workDateTo?: string;
  zoneName?: string;
  fileName?: string;
  page?: number;
  pageSize?: number;
  includeSuperseded?: boolean;
}) {
  const q = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50),
  });
  if (params.status) q.set("status", params.status);
  if (params.batchId) q.set("batchId", params.batchId);
  if (params.documentNumber) q.set("documentNumber", params.documentNumber);
  if (params.workDateFrom) q.set("workDateFrom", params.workDateFrom);
  if (params.workDateTo) q.set("workDateTo", params.workDateTo);
  if (params.zoneName) q.set("zoneName", params.zoneName);
  if (params.fileName) q.set("fileName", params.fileName);
  if (params.includeSuperseded) q.set("includeSuperseded", "true");
  return request<EntriesPage>(`/entries?${q}`);
}

export async function fetchEntry(id: string) {
  return request<OvertimeEntryRow>(`/entries/${id}`);
}

export async function approveEntry(id: string) {
  return request(`/entries/${id}/approve`, { method: "POST" });
}

export async function rejectEntry(id: string, accountingNote: string) {
  return request(`/entries/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ accountingNote }),
  });
}

export async function importAccountingWorkbook(file: File, recalculateOpenPeriod = false) {
  const fd = new FormData();
  fd.append("file", file);
  if (recalculateOpenPeriod) fd.append("recalculateOpenPeriod", "true");
  return request<AccountingImportResult>(`/accounting/import`, {
    method: "POST",
    body: fd,
  });
}

/** @deprecated use importAccountingWorkbook */
export const importCompensationParams = importAccountingWorkbook;

export async function fetchAccountingCatalog(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<AccountingCatalogItem[]>(`/accounting/catalog${q}`);
}

export async function fetchAccountingAssignments(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<AccountingAssignment[]>(`/accounting/assignments${q}`);
}

export async function previewRecalculateForCatalog(catalogId: string) {
  return request<RecalculatePreview>(`/accounting/catalog/${catalogId}/recalculate-preview`);
}

export async function updateAccountingCatalog(
  id: string,
  data: { monthlySalary?: number; payrollFactor?: number; recalculateOpenPeriod?: boolean },
) {
  return request<UpdateCatalogResult>(`/accounting/catalog/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateAccountingAssignment(employeeId: string, catalogId: string) {
  return request(`/accounting/assignments/${employeeId}`, {
    method: "PATCH",
    body: JSON.stringify({ catalogId }),
  });
}

export async function fetchConsolidations(year: number, month: number) {
  return request<Consolidation[]>(`/consolidations?year=${year}&month=${month}`);
}

export async function closePeriod(year: number, month: number) {
  return request<ClosePeriodResult>(`/periods/${year}/${month}/close`, {
    method: "POST",
  });
}

export async function correctEntry(id: string, body: CorrectEntryPayload) {
  return request<OvertimeEntryRow>(`/entries/${id}/correct`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function pdfDayUrl(employeeId: string, date: string) {
  return `${BASE}/pdf/employee/${employeeId}/day/${date}`;
}

export function dayPrintPageUrl(employeeId: string, date: string) {
  const d = date.slice(0, 10);
  return `/imprimir/horas-extra/dia/${employeeId}/${d}`;
}

export async function fetchDayPrintData(employeeId: string, date: string) {
  const d = date.slice(0, 10);
  return request<TsDayPrintData>(`/pdf/employee/${employeeId}/day/${d}/print-data`);
}

export function pdfMonthUrl(employeeId: string, year: number, month: number) {
  return `${BASE}/pdf/employee/${employeeId}/period/${year}/${month}`;
}

export function batchFileUrl(batchId: string) {
  return `${BASE}/batches/${batchId}/file`;
}

export async function downloadAuthenticatedFile(url: string, filename: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("No se pudo descargar el archivo");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Types ───

export interface OvertimePeriod {
  id: string;
  year: number;
  month: number;
  periodCode: string;
  status: "OPEN" | "CLOSED";
}

export interface OvertimePeriodDetail extends OvertimePeriod {
  entryCounts?: Record<string, number>;
}

export interface ImportPreview {
  periodCode: string;
  totalRows: number;
  okRows: number;
  warningRows: number;
  errorRows: number;
  hasErrors: boolean;
  rows: Array<{
    excelRowNumber: number;
    documentNumber: string;
    employeeFullName: string | null;
    result: string;
    total: number;
    messages: Array<{ code: string; severity: string; message: string }>;
  }>;
}

export interface ImportRegisterResult {
  batchId: string;
  batchCode: string;
  periodCode: string;
  entryCount: number;
}

export interface OvertimeBatch {
  id: string;
  batchCode: string;
  originalFilename: string;
  registeredAt: string;
  rowCount: number;
  uploadedBy: { name: string; email: string };
}

export interface OvertimeEntry {
  id: string;
  entryCode: string;
  employeeFullName: string;
  employeeDocumentNumber: string;
  employeeId: string;
  workDate: string;
  status: string;
  amountTotal: number;
  validationResult: string;
  importBatch?: { batchCode: string };
}

/** Registro con todos los campos para vista planilla / detalle. */
export interface OvertimeEntryRow extends OvertimeEntry {
  entryNumber?: number;
  excelRowNumber?: number | null;
  batchRowNumber?: number | null;
  genderSnapshot?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  hoursRd?: number;
  hoursRn?: number;
  hoursTsd?: number;
  hoursTsn?: number;
  hoursHedd?: number;
  hoursHend?: number;
  hoursDisponibilidad?: number;
  hoursStartEndTotal?: number | null;
  hoursCategoriesTotal?: number | null;
  hoursValidatorDelta?: number | null;
  salarySnapshot?: number;
  hourlyDivisorSnapshot?: number;
  payrollFactorSnapshot?: number;
  amountRd?: number;
  amountRn?: number;
  amountTsd?: number;
  amountTsn?: number;
  amountHedd?: number;
  amountHend?: number;
  amountDisponibilidad?: number;
  amountSubtotal?: number;
  jobPositionName?: string | null;
  processName?: string | null;
  zoneName?: string | null;
  baseMunicipality?: string | null;
  commissionMunicipality?: string | null;
  brigadeCode?: string | null;
  systemName?: string | null;
  itinerary?: string | null;
  caseRef?: string | null;
  workRef?: string | null;
  ticketRef?: string | null;
  consigna?: string | null;
  attachmentRef?: string | null;
  operationalNote?: string | null;
  accountingNote?: string | null;
  validationMessages?: unknown;
  reviewedAt?: string | null;
  importBatch?: { batchCode: string; originalFilename?: string; registeredAt?: string };
  submittedBy?: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string; email: string } | null;
  period?: { periodCode: string; year: number; month: number; status: string };
  correctedFromEntry?: { id: string; entryCode: string; status: string } | null;
  supersededByEntry?: { id: string; entryCode: string; status: string } | null;
}

export interface EntriesPage {
  items: OvertimeEntryRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AccountingCatalogItem {
  id: string;
  pivotKey: string;
  jobTitle: string;
  managementUnit: string | null;
  area: string | null;
  processName: string | null;
  monthlySalary: number | string;
  payrollFactor: number | string;
  _count?: { assignments: number };
}

export interface AccountingAssignment {
  id: string;
  employeeId: string;
  catalogId: string;
  zoneName: string | null;
  municipality: string | null;
  employee: {
    id: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
  };
  catalog: AccountingCatalogItem;
}

export interface AccountingImportResult {
  catalogCreated: number;
  catalogUpdated: number;
  catalogUnchanged: number;
  assignmentsCreated: number;
  assignmentsUpdated: number;
  assignmentsUnchanged: number;
  workersNotFound: { documentNumber: string; excelRowNumber: number }[];
  workersUnmatchedCatalog: { documentNumber: string; excelRowNumber: number; pivotKey: string }[];
  recalculatedEntries?: number;
}

export interface UpdateCatalogResult {
  catalog: AccountingCatalogItem;
  financialChanged: boolean;
  recalculatedEntries: number;
}

export interface RecalculatePreview {
  totalAffectedEntries: number;
  byEmployee: Array<{
    employeeId: string;
    documentNumber: string | null;
    fullName: string | null;
    entryCount: number;
    periodCodes: string[];
  }>;
}

export interface RecalculateResult {
  updatedEntries: number;
}

export interface Consolidation {
  id: string;
  employeeId: string;
  employeeFullName: string;
  employeeDocumentNumber: string;
  totalAmountTotal: number | string;
  approvedEntryCount: number;
  period: { periodCode: string };
}

export interface ClosePeriodResult {
  periodCode: string;
  status: string;
  consolidationsCreated: number;
  approvedEntries: number;
  pendingEntriesExcluded: number;
}

export interface CorrectEntryPayload {
  workDate?: string;
  startTime?: string;
  endTime?: string;
  hoursRd?: number;
  hoursRn?: number;
  hoursTsd?: number;
  hoursTsn?: number;
  hoursHedd?: number;
  hoursHend?: number;
  hoursDisponibilidad?: number;
  commissionMunicipality?: string;
  consigna?: string;
  operationalNote?: string;
  accountingNote?: string;
}

export interface TsDayPrintRow {
  workDate: string;
  consigna: string;
  commissionMunicipality: string;
  startTime: string;
  endTime: string;
  hoursDisponibilidad: number;
  hoursTsd: number;
  hoursTsn: number;
  hoursHedd: number;
  hoursHend: number;
  hoursRd: number;
  hoursRn: number;
}

export interface TsDayPrintData {
  formCode: string;
  formVersion: number;
  formTitle: string;
  printedAt: string;
  zoneName: string;
  municipality: string;
  monthLabel: string;
  workDateLabel: string;
  employeeFullName: string;
  employeeDocumentNumber: string;
  processName: string;
  jobPositionName: string;
  rows: TsDayPrintRow[];
}
