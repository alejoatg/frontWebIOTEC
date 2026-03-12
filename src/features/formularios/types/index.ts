export interface PreoperacionalMotoFilter {
  fechaInicio: string;
  fechaFin: string;
  placa?: string;
  cedulaConductor?: string;
  page?: number;
  pageSize?: number;
}

export interface PreoperacionalMoto {
  _URI: string;
  _CREATION_DATE: string;
  _SUBMISSION_DATE: string | null;
  FECHA_REGISTRO: string | null;
  PLACA: string | null;
  CEDULA_CONDUCTOR: string | null;
  KILOMETRAJE_ACTUAL: number | null;
  DEVICE_ID: string | null;

  DOCUMENTOS_LICENCIA_DE_TRANSITO: string | null;
  DOCUMENTOS_LICENCIA_DE_CONDUCCION: string | null;
  DOCUMENTOS_SEGURO_OBLIGATORIO_SOAT: string | null;
  DOCUMENTOS_CEDULA_DOCUMENTO: string | null;
  DOCUMENTOS_ESTADO_PLACA: string | null;
  DOCUMENTOS_CERTIFICADO_DE_REVISION_TECNICO_MECANICA: string | null;
  DOCUMENTOS_OBSERVACION_DOCUMENTOS: string | null;

  SISTEMA_DE_ALUMBRADO_LUCES_ALTAS: string | null;
  SISTEMA_DE_ALUMBRADO_LUCES_BAJAS: string | null;
  SISTEMA_DE_ALUMBRADO_LUCES_MEDIAS: string | null;
  SISTEMA_DE_ALUMBRADO_LUCES_DE_FRENOS: string | null;
  SISTEMA_DE_ALUMBRADO_DIRECCIONALES_DELANTEROS: string | null;
  SISTEMA_DE_ALUMBRADO_DIRECCIONALES_TRASEROS: string | null;
  SISTEMA_DE_ALUMBRADO_OBSERVACION_SISTEMA_DE_ALUMBRADO: string | null;

  ESTADO_TECNICO_MECANICO_ESTADO_DE_AMORTIGUADORES: string | null;
  ESTADO_TECNICO_MECANICO_NIVEL_DE_ACEITE: string | null;
  ESTADO_TECNICO_MECANICO_CONTROL_DE_FUGAS_ACEITE_Y_GASOLINA: string | null;
  ESTADO_TECNICO_MECANICO_KIT_DE_ARRASTRE: string | null;
  ESTADO_TECNICO_MECANICO_ESPEJOS_COMPLETOS: string | null;
  ESTADO_TECNICO_MECANICO_INDICADORES_Y_MEDIDORES: string | null;
  ESTADO_TECNICO_MECANICO_ESTADO_GENERAL: string | null;
  ESTADO_TECNICO_MECANICO_OBSERVACION_ESTADO_TECNICO_MECANICO: string | null;

  FRENOS_FUNCIONAMIENTO_FRENO_DELANTERO: string | null;
  FRENOS_FUNCIONAMIENTO_FRENO_TRASERO: string | null;
  FRENOS_ESTADO_Y_TENSION_DE_LA_CADENA: string | null;
  FRENOS_TENSION_GUAYA_EMBRAGUE: string | null;
  FRENOS_OBSERVACION_FRENOS: string | null;

  SISTEMA_SEGURIDAD_CASCO: string | null;
  SISTEMA_SEGURIDAD_GUANTES_DE_SEGURIDAD: string | null;
  SISTEMA_SEGURIDAD_CHALECO_REFLECTIVO: string | null;
  SISTEMA_SEGURIDAD_RODILLERAS_Y_CODERAS: string | null;
  SISTEMA_SEGURIDAD_GAFAS_DE_SEGURIDAD: string | null;
  SISTEMA_SEGURIDAD_KIT_HERRAMIENTAS: string | null;
  SISTEMA_SEGURIDAD_BOCINA_O_PITO: string | null;
  SISTEMA_SEGURIDAD_LABRADO_DE_RUEDAS_3MM_: string | null;
  SISTEMA_SEGURIDAD_ESTADO_Y_PRESION_DE_RUEDAS_: string | null;
  SISTEMA_SEGURIDAD_OBSERVACION_SISTEMA_SEGURIDAD: string | null;

  UBICACION_INSPECCION_LAT: number | null;
  UBICACION_INSPECCION_LNG: number | null;
  UBICACION_INSPECCION_ALT: number | null;
  UBICACION_INSPECCION_ACC: number | null;

  RESUMEN: string | null;
  INICIO_F: string | null;
  FIN_F: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface FormularioCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}
