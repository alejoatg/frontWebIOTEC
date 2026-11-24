export type FlujoAtencionStatus =
  | "PROGRAMADO"
  | "EN_CAMPO"
  | "REPROGRAMADO"
  | "ATENDIDO"
  | "ANULADO";

export type FlujoAtencionVisitaEstado = "PENDIENTE" | "COMPLETADA";

export interface FlujoUserRef {
  id: string;
  name: string;
  email: string;
}

export interface FlujoProgramacion {
  id: string;
  nombre: string;
  cedula: string;
  direccion: string;
  barrio: string;
  telefono: string;
  referencia?: string | null;
  color?: string | null;
  ubicacion?: string | null;
  altura?: string | null;
  tiempo?: string | null;
  heridos: string;
  fecha: string;
  recepciona: string;
  executedBy?: FlujoUserRef | null;
  executedAt?: string;
}

export interface FlujoVisita {
  id: string;
  localId: string;
  orden: number;
  fechaProgramada: string;
  estado: FlujoAtencionVisitaEstado;
  inspeccionDireccion?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  diagnostico?: string | null;
  seRealizaAtencion?: string | null;
  seProgramaFecha?: string | null;
  horaInicioDesplazamiento?: string | null;
  horaArribo?: string | null;
  horaFinServicio?: string | null;
  personalOperativo?: string | null;
  equipos?: string | null;
  cuentaConAutorizacion?: string | null;
  autorizacionFotoUrl?: string | null;
  reporteAph?: string | null;
  fotoAntesUrls?: string[] | null;
  fotoDuranteUrls?: string[] | null;
  fotoDespuesUrls?: string[] | null;
  fotoDestinoUrls?: string[] | null;
  fotoActaAtencionUrls?: string[] | null;
  fotoActaApiarioUrls?: string[] | null;
  firmaSolicitanteUrl?: string | null;
  submittedBy?: FlujoUserRef | null;
  executedBy?: FlujoUserRef | null;
  executedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  syncedAt?: string | null;
}

export interface FlujoAtencion {
  id: string;
  radicado: string;
  fecha: string;
  status: FlujoAtencionStatus;
  createdBy?: FlujoUserRef | null;
  createdAt: string;
  updatedAt: string;
  programacion: FlujoProgramacion | null;
  visitas: FlujoVisita[];
}

export interface FlujoListResponse {
  data: FlujoAtencion[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateFlujoProgramacionPayload {
  nombre: string;
  cedula: string;
  direccion: string;
  barrio: string;
  telefono: string;
  referencia?: string;
  color?: string;
  ubicacion?: string;
  altura?: string;
  tiempo?: string;
  heridos: string;
  fecha: string;
  recepciona?: string;
}

export interface FlujoListFilter {
  status?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
