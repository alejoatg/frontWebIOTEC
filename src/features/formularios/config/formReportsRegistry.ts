import { flattenChecklistDetail, flattenChecklistRow } from "../lib/flattenRecord";
import type { FormReportConfig } from "./formReportTypes";

const ATU_BRIGADAS = [
  { value: "SUR_387", label: "SUR 387" },
  { value: "SUR_388", label: "SUR 388" },
  { value: "CENTRO_285", label: "CENTRO 285" },
  { value: "CENTRO_288", label: "CENTRO 288" },
  { value: "NORTE_187", label: "NORTE 187" },
  { value: "NORTE_188", label: "NORTE 188" },
  { value: "NORTE_189", label: "NORTE 189" },
  { value: "SUB_2210", label: "SUB 2210" },
  { value: "SUB_2", label: "SUB 2" },
];

const ATU_TIPOS_INSPECCION = [
  { value: "Inspeccion", label: "Inspección" },
  { value: "Termografia", label: "Termografía" },
  { value: "Sistemas_de_puesta_a_tierra", label: "Sistemas de puesta a tierra" },
  { value: "Evento", label: "Evento" },
  { value: "Consigna", label: "Consigna" },
];

function appendOptional(params: URLSearchParams, filter: Record<string, unknown>, keys: string[]) {
  keys.forEach((key) => {
    const v = filter[key];
    if (typeof v === "string" && v.trim()) params.append(key, v.trim());
  });
  if (filter.page) params.append("page", String(filter.page));
  params.append("pageSize", String(filter.pageSize ?? 50));
}

export const FORM_REPORTS: FormReportConfig[] = [
  {
    id: "atu-formato-unico",
    slug: "atu-formato-unico",
    title: "Formato Único ATU",
    subtitle: "FR-338 — Actividades proceso de Alta Tensión (IOTEC Forms)",
    icon: "Zap",
    color: "#d97706",
    apiBasePath: "/api/atu-formato-unico",
    excelFileName: "atu-formato-unico",
    detailTitle: (r) => `Orden ${String(r.ordenTrabajo ?? "—")}`,
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "municipio", label: "Municipio", placeholder: "Ej: Popayán" },
      { type: "select", key: "brigada", label: "Brigada", options: ATU_BRIGADAS },
      { type: "select", key: "tipoInspeccion", label: "Tipo inspección", options: ATU_TIPOS_INSPECCION },
      { type: "text", key: "ordenTrabajo", label: "Orden de trabajo", placeholder: "Número de orden" },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha actividad", format: "shortDate" },
      { key: "ordenTrabajo", label: "Orden trabajo" },
      { key: "brigada", label: "Brigada", format: "brigada" },
      { key: "municipio", label: "Municipio" },
      { key: "linea", label: "Línea" },
      { key: "tipoInspeccion", label: "Tipo inspección", format: "tipoInspeccion" },
      { key: "submittedBy", label: "Técnico", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      { title: "Encabezado", keys: ["fecha", "tipoOrden", "ordenTrabajo", "numTrabajo", "brigada"] },
      {
        title: "Identificación",
        keys: [
          "municipio", "vereda", "linea", "lineaOtra", "nivelTension", "numeroEstructura",
          "numeroApoyo", "ubicacionLat", "ubicacionLng", "tipoEstructura", "seccionamiento",
          "estadoSeccionamiento",
        ],
      },
      { title: "Tipo de inspección", keys: ["tipoInspeccion"] },
      {
        title: "Inspección de línea",
        keys: [
          "inspeccionCruceLinea", "inspeccionDescripcionCruce", "inspeccionTipoSeccionamiento",
          "inspeccionHiloGuarda", "inspeccionDps", "inspeccionTipoPostes",
          "inspeccionIntervencionPrioritaria", "inspeccionTipoEstructuraUc",
          "inspeccionCantidadEspaciadores", "inspeccionTiposAisladores", "inspeccionCantidadAisladores",
        ],
      },
      {
        title: "Estado general",
        keys: ["estadoAisladores", "estadoEstructura", "estadoCruceteria", "requierePodas", "spt"],
      },
      {
        title: "Termografía",
        keys: [
          "termografiaSubestacion", "termografiaSubestacionOtra", "termografiaEquipos",
          "termografiaTipoEquipo", "termografiaTemperaturaAmbiente", "termografiaTipoConductor",
          "termografiaTempFaseA", "termografiaTempFaseB", "termografiaTempFaseC",
        ],
      },
      {
        title: "SPT / Evento / Consigna",
        keys: [
          "sptCorrectivo", "sptMedidaTierraInicial", "sptMedidaTierraFinal",
          "eventoCausal", "eventoCausalOtro", "consignaCausal",
          "consignaGeorreferenciaX", "consignaGeorreferenciaY",
        ],
      },
      { title: "Cierre", keys: ["observacionGeneral"] },
    ],
    evidenceFields: [
      { label: "Firma técnico", key: "firmaTecnicoUrl" },
      { label: "Foto GPS consigna", key: "consignaFotoGpsUrl" },
      { label: "Fotos actividad", key: "fotosActividadTagged", tagged: true },
      { label: "Fotos actualización consigna", key: "consignaFotosActualizacionUrls", multiple: true },
    ],
    locationField: { latKey: "ubicacionLat", lngKey: "ubicacionLng", label: "Ubicación de la estructura" },
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, ["municipio", "brigada", "tipoInspeccion", "ordenTrabajo"]);
      return params;
    },
  },
  {
    id: "pghs-005-03-inspeccion-terreno",
    slug: "pghs-inspeccion-terreno",
    title: "PGHS-005-03 Inspección en Terreno",
    subtitle: "Seguridad, salud en el trabajo y medio ambiente (IOTEC Forms)",
    icon: "ClipboardCheck",
    color: "#059669",
    apiBasePath: "/api/pghs-inspeccion-terreno",
    excelFileName: "pghs-inspeccion-terreno",
    detailTitle: (r) => String(r.descripcionTrabajo ?? "Inspección en terreno"),
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "zona", label: "Zona", placeholder: "Zona operativa" },
      { type: "text", key: "proceso", label: "Proceso", placeholder: "Proceso" },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "zona", label: "Zona" },
      { key: "proceso", label: "Proceso" },
      { key: "descripcionTrabajo", label: "Descripción trabajo" },
      { key: "nombreRealizaLabor", label: "Responsable labor" },
      { key: "submittedBy", label: "Técnico", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Datos generales",
        keys: [
          "zona", "fecha", "proceso", "descripcionTrabajo", "nombreRealizaLabor",
          "ubicacionInspeccionLat", "ubicacionInspeccionLng",
        ],
      },
      {
        title: "Seguridad y salud en el trabajo",
        keys: [
          "reglaOroSenalizarDelimitar", "reglaOroCorteFuentesTension", "reglaOroEnclavamientoBloqueo",
          "reglaOroVerificacionAusenciaTension", "reglaOroPuestaTierraCortocircuito",
          "areasCirculacionLibres", "herramientasPortaherramientasNoInterfiere",
          "grupoSinElementosMetalicos", "riesgosIdentificadosControles", "procedimientosSeguros",
          "permisoTrabajoAlturas", "atsDiligenciado", "registrosFotograficos",
        ],
      },
      {
        title: "Herramientas y equipos",
        keys: [
          "equiposHerramientasBuenasCondiciones", "usoAdecuadoHerramientasEquipos",
          "aseguramientoEscaleraPoste", "autoinspeccionMantenimientoHerramientas", "otrosEquiposHerramientas",
        ],
      },
      {
        title: "EPP",
        keys: [
          "cascoDielectricoBarbuquejo", "proteccionAuditivaPodas", "gafasCaretaUvAntidestellos",
          "guantesTipoIngeniero", "guantesDielectricos", "mascarillaTapabocas", "usoAdecuadoEpps",
          "arnesSeguridadAjustado", "lineaVida", "eslingasAnclajePretal", "otrosEpp",
        ],
      },
      {
        title: "Dotación y actitud",
        keys: [
          "botasRopaDotacion", "carneIdentificacionUten", "carneArl", "presentacionPersonal",
          "liderazgoPrevencionRiesgos", "divulgacionControlPracticasSeguras",
          "actitudSugerenciasRecomendaciones", "otrosActitud",
        ],
      },
      {
        title: "Medio ambiente",
        keys: [
          "recipientesQuimicosRotulados", "productosQuimicosFichaSeguridad", "controlDerrame",
          "zonaLibreDerrameVertimientos", "recoleccionResiduosOrdenLimpieza",
          "zonasIntervenidasRestablecidas", "vehiculoKitControlDerrame",
        ],
      },
      { title: "Cierre", keys: ["hallazgosEvidenciados"] },
    ],
    evidenceFields: [
      { label: "Registro fotográfico (antes)", key: "registroFotograficoAntesUrls", multiple: true },
      { label: "Registro fotográfico (durante)", key: "registroFotograficoDuranteUrls", multiple: true },
      { label: "Trabajadores y firmas", key: "trabajadoresFirmas" },
      { label: "Firma técnico", key: "firmaTecnicoUrl" },
      { label: "Firma responsable inspección", key: "firmaResponsableInspeccionUrl" },
    ],
    locationField: {
      latKey: "ubicacionInspeccionLat",
      lngKey: "ubicacionInspeccionLng",
      label: "Ubicación de la inspección",
    },
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, ["zona", "proceso"]);
      return params;
    },
  },
  {
    id: "inspeccion-preoperacional-vehiculos",
    slug: "inspeccion-preoperacional-vehiculos",
    title: "Inspección Preoperacional Vehículos",
    subtitle: "Revisión preoperacional de vehículos (IOTEC Forms)",
    icon: "Truck",
    color: "#2563eb",
    apiBasePath: "/api/inspeccion-preoperacional-vehiculos",
    excelFileName: "inspeccion-preoperacional-vehiculos",
    detailTitle: (r) => `Placa ${String(r.placaVehiculo ?? "—")}`,
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "placa", label: "Placa", placeholder: "ABC123" },
      { type: "text", key: "organizacionVehiculo", label: "Organización", placeholder: "UTEN / Contratista" },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "placaVehiculo", label: "Placa" },
      { key: "organizacionVehiculo", label: "Organización" },
      { key: "kilometrajeActual", label: "Kilometraje" },
      { key: "cedulaDiligencia", label: "Cédula" },
      { key: "submittedBy", label: "Técnico", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Encabezado",
        keys: [
          "organizacionVehiculo", "fecha", "placaVehiculo", "cedulaDiligencia", "kilometrajeActual",
          "ubicacionInspeccionLat", "ubicacionInspeccionLng",
        ],
      },
      {
        title: "1. Documentos",
        keys: [
          "revisionTarjetaOperacion", "revisionSoat", "revisionTecnicoMecanica",
          "revisionPolizaContractual", "revisionPolizaExtracontractual", "revisionExtractoContrato",
          "revisionLicenciaConduccion", "revisionTarjetaPropiedad", "revisionCedulaCiudadania",
          "observacionesRevisionDocumentos",
        ],
      },
      {
        title: "2. Niveles de líquidos",
        keys: [
          "revisionNivelAceiteMotor", "revisionNivelLiquidoFrenos", "revisionNivelRefrigeranteRadiador",
          "revisionNivelAguaLimpiaBrisas", "revisionNivelAceiteHidraulico", "observacionesNivelesLiquidos",
        ],
      },
      {
        title: "3. Batería",
        keys: ["revisionEstadoBornesCablesBateria", "observacionesBateria"],
      },
      {
        title: "4. Estado general carrocería",
        keys: [
          "revisionEstadoLatoneriaPintura", "revisionPuertaBuenEstado", "revisionManijaPuertasVidrios",
          "revisionPlacaVehiculoInspeccion", "revisionEstadoVidrioParabrisas",
          "revisionEspejosLateralesRetrovisor", "revisionCinturonSeguridad", "revisionIndicadoresTableros",
          "revisionDistintivosEmblemas", "revisionEstadoTapiceria", "observacionesEstadoCarroceria",
        ],
      },
      {
        title: "5. Componentes internos",
        keys: [
          "revisionAsientosApoyacabeza", "revisionPitoBocina", "observacionesComponentesInternos",
        ],
      },
      {
        title: "6. Luces",
        keys: [
          "revisionLucesAlta", "revisionLucesMedias", "revisionLucesBaja", "revisionLucesEstacionarias",
          "revisionLuzFrenoSenalTrasera", "revisionLucesInternas", "revisionAlarmaLuzRetroceso",
          "observacionesLuces",
        ],
      },
      {
        title: "7. Llantas",
        keys: [
          "revisionLlantasDelanterasTraserasRepuesto", "revisionRinesPernos",
          "revisionGatoElevador", "revisionCruceta", "observacionesLlantas",
        ],
      },
      {
        title: "8. Equipo de carreteras",
        keys: [
          "revisionExtintor10Lb", "revisionBotiquinPrimerosAuxilios", "revisionChalecoReflectivo",
          "revisionSenalesCarretera", "revisionTacosBloqueo", "revisionLinterna",
          "revisionHerramientasBasicas", "revisionLlantaRepuesto", "revisionAseoInternoExterno",
          "revisionKitAntiderrames", "revisionCajonHerramientas", "revisionPortaPertigaMetalico",
          "observacionesEquipoCarretera", "otrosEquipoCarretera",
        ],
      },
      {
        title: "Cierre",
        keys: [
          "presentaNovedadImpideOperacion", "esPrimerDiaMes", "observacionesGenerales",
          "startedAt", "completedAt", "syncedAt",
        ],
      },
    ],
    evidenceFields: [
      { label: "Fotos de novedad", key: "fotoNovedadUrls", multiple: true },
      { label: "Lateral derecha delantera", key: "fotoLateralDerechaDelanteraUrl" },
      { label: "Lateral izquierda trasera", key: "fotoLateralIzquierdaTraseraUrl" },
      { label: "Firma del conductor", key: "firmaConductorUrl" },
    ],
    locationField: {
      latKey: "ubicacionInspeccionLat",
      lngKey: "ubicacionInspeccionLng",
      label: "Ubicación de la inspección",
    },
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      if (filter.placa) params.append("placa", String(filter.placa).trim());
      if (filter.organizacionVehiculo) {
        params.append("organizacionVehiculo", String(filter.organizacionVehiculo).trim());
      }
      if (filter.page) params.append("page", String(filter.page));
      params.append("pageSize", String(filter.pageSize ?? 50));
      return params;
    },
  },
  {
    id: "inspeccion-preoperacional-motocicletas",
    slug: "inspeccion-preoperacional-motocicletas",
    title: "Inspección Preoperacional Motocicletas",
    subtitle: "UTEN_PREOPERACIONAL_MOTOCICLETAS_V3 — Revisión preoperacional de motocicletas (IOTEC Forms)",
    icon: "Bike",
    color: "#dc2626",
    apiBasePath: "/api/inspeccion-preoperacional-motocicletas",
    excelFileName: "inspeccion-preoperacional-motocicletas",
    detailTitle: (r) => `Placa ${String(r.placa ?? "—")}`,
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "placa", label: "Placa", placeholder: "ABC123" },
      { type: "text", key: "cedulaConductor", label: "Cédula conductor", placeholder: "Número de cédula" },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "placa", label: "Placa" },
      { key: "cedulaConductor", label: "Cédula" },
      { key: "kilometrajeActual", label: "Kilometraje" },
      { key: "presentaNovedad", label: "Novedad" },
      { key: "submittedBy", label: "Técnico", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Encabezado",
        keys: [
          "fecha", "placa", "cedulaConductor", "kilometrajeActual",
          "ubicacionInspeccionLat", "ubicacionInspeccionLng",
        ],
      },
      {
        title: "Sistema de alumbrado",
        keys: [
          "lucesFrenos", "lucesAltas", "lucesMedias", "lucesBajas",
          "direccionalesDelanteros", "direccionalesTraseros", "observacionSistemaAlumbrado",
        ],
      },
      {
        title: "Frenos",
        keys: [
          "funcionamientoFrenoDelantero", "funcionamientoFrenoTrasero",
          "estadoTensionCadena", "tensionGuayaEmbrague", "observacionFrenos",
        ],
      },
      {
        title: "Sistema de prevención y seguridad",
        keys: [
          "labradoRuedas", "estadoPresionRuedas", "kitHerramientas", "casco",
          "chalecoReflectivo", "bocinaPito", "rodillerasCoderas", "gafasSeguridad",
          "guantesSeguridad", "observacionSistemaSeguridad",
        ],
      },
      {
        title: "Estado técnico mecánico",
        keys: [
          "espejosRetrovisores", "kitArrastre", "indicadoresMedidores", "nivelAceite",
          "controlFugasAceiteGasolina", "estadoAmortiguadores", "estadoGeneral",
          "observacionEstadoTecnicoMecanico",
        ],
      },
      {
        title: "Documentos",
        keys: [
          "revisionTecnicoMecanica", "licenciaConduccion", "licenciaTransito", "soat",
          "estadoPlaca", "portaCedula", "observacionDocumentos",
        ],
      },
      {
        title: "Cierre",
        keys: [
          "esPrimerDiaO15Mes", "presentaNovedad",
          "startedAt", "completedAt", "syncedAt",
        ],
      },
    ],
    evidenceFields: [
      { label: "Foto delantera derecha", key: "fotoDelanteraDerechaUrl" },
      { label: "Foto trasera izquierda", key: "fotoTraseraIzquierdaUrl" },
      { label: "Firma del conductor", key: "firmaConductorUrl" },
    ],
    locationField: {
      latKey: "ubicacionInspeccionLat",
      lngKey: "ubicacionInspeccionLng",
      label: "Ubicación de la inspección",
    },
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      if (filter.placa) params.append("placa", String(filter.placa).trim());
      if (filter.cedulaConductor) {
        params.append("cedulaConductor", String(filter.cedulaConductor).trim());
      }
      if (filter.page) params.append("page", String(filter.page));
      params.append("pageSize", String(filter.pageSize ?? 50));
      return params;
    },
  },
  {
    id: "inspeccion-extintores",
    slug: "inspeccion-extintores",
    title: "Inspección de Extintores",
    subtitle: "IGII-001-02 v02 — Inspección puntual de extintores sede/vehículo (IOTEC Forms)",
    icon: "ClipboardCheck",
    color: "#b91c1c",
    apiBasePath: "/api/inspeccion-extintores",
    excelFileName: "inspeccion-extintores",
    detailTitle: (r) =>
      String(r.referencia ?? r.placa ?? r.ubicacionSede ?? r.numeroIdentificacion ?? "Extintor"),
    filterFields: [
      { type: "dateRange" },
      {
        type: "select",
        key: "zona",
        label: "Zona",
        options: [
          { value: "Centro", label: "Centro" },
          { value: "Sur", label: "Sur" },
          { value: "Norte", label: "Norte" },
        ],
      },
      {
        type: "select",
        key: "tipoUbicacion",
        label: "Sede / Vehículo",
        options: [
          { value: "Extintor_de_sede", label: "Extintor de sede" },
          { value: "Extintor_de_vehiculo", label: "Extintor de vehículo" },
        ],
      },
      {
        type: "select",
        key: "tipoExtintor",
        label: "Tipo extintor",
        options: [
          { value: "AGUA", label: "AGUA" },
          { value: "ABC", label: "ABC" },
          { value: "BC", label: "BC" },
          { value: "CO2", label: "CO₂" },
        ],
      },
      { type: "text", key: "sede", label: "Sede", placeholder: "Nombre de sede" },
      { type: "text", key: "placa", label: "Placa", placeholder: "ABC123" },
      {
        type: "select",
        key: "tieneNc",
        label: "Con hallazgos NC",
        options: [
          { value: "true", label: "Sí (tiene NC)" },
          { value: "false", label: "No (sin NC)" },
        ],
      },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "zona", label: "Zona" },
      { key: "tipoUbicacion", label: "Tipo" },
      { key: "sede", label: "Sede" },
      { key: "placa", label: "Placa" },
      { key: "tipoExtintor", label: "Extintor" },
      { key: "fechaVencimiento", label: "Vencimiento", format: "shortDate" },
      {
        key: "tieneNc",
        label: "NC",
        accessor: (r) => (r.tieneNc === true ? "Sí" : "No"),
      },
      { key: "inspeccionadoPor", label: "Inspector" },
      { key: "submittedBy", label: "Usuario", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Encabezado",
        keys: [
          "fecha", "proceso", "zona", "tipoUbicacion", "sede", "numeroIdentificacion",
          "ubicacionSede", "placa", "tipoExtintor", "fechaVencimiento", "capacidad", "referencia",
        ],
      },
      {
        title: "Inspecciones puntuales",
        keys: [
          "extintorEnSuLugar", "completamenteCargado", "accesoLibre", "selloPinSeguridad",
          "pasadorSeguridad", "cilindroEstado", "mangueraEstado", "empalmesManguera", "cornetaCo2",
          "valvulaEstado", "lecturaPresion", "calcomaniasPlacas", "senalizado", "areaDemarcada",
          "gabineteAltura", "tieneNc",
        ],
      },
      {
        title: "Cierre",
        keys: ["observaciones", "inspeccionadoPor", "startedAt", "completedAt", "syncedAt"],
      },
    ],
    evidenceFields: [
      { label: "Foto del extintor", key: "fotoExtintorUrl" },
      { label: "Firma del inspector", key: "firmaInspectorUrl" },
    ],
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, [
        "zona",
        "tipoUbicacion",
        "tipoExtintor",
        "sede",
        "placa",
        "tieneNc",
      ]);
      return params;
    },
  },
  {
    id: "pghs-002-02-inspeccion-escaleras",
    slug: "inspeccion-escaleras",
    title: "Inspección de Escaleras",
    subtitle: "PGHS-002-02 v2 — Inspección de escaleras (IOTEC Forms)",
    icon: "ClipboardCheck",
    color: "#c2410c",
    apiBasePath: "/api/inspeccion-escaleras",
    excelFileName: "inspeccion-escaleras",
    detailTitle: (r) => `Serie ${String(r.serie ?? "—")}`,
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "serie", label: "Serie", placeholder: "Número de serie" },
      { type: "text", key: "marca", label: "Marca", placeholder: "Marca de la escalera" },
      {
        type: "select",
        key: "tieneNc",
        label: "Con hallazgos NC",
        options: [
          { value: "true", label: "Sí (tiene NC)" },
          { value: "false", label: "No (sin NC)" },
        ],
      },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "serie", label: "Serie" },
      { key: "marca", label: "Marca" },
      { key: "tipo", label: "Tipo" },
      { key: "nombreTecnicoResponsable", label: "Técnico" },
      {
        key: "tieneNc",
        label: "NC",
        accessor: (r) => (r.tieneNc === true ? "Sí" : "No"),
      },
      { key: "submittedBy", label: "Usuario", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Encabezado",
        keys: [
          "fecha",
          "nombreTecnicoResponsable",
          "fechaPruebaRigidezDielectrica",
          "fechaSeguimiento",
          "marca",
          "tipo",
          "serie",
        ],
      },
      {
        title: "Revisión",
        keys: [
          "estadoLargueros",
          "punterasLargueros",
          "punterasPortaZapatos",
          "zapatasDeslizantes",
          "ganchosTrabaZapatos",
          "conjuntoApoyaPoste",
          "conjuntoRemachesAjuste",
          "guiasSuperiores",
          "peldanos",
          "sogaIzajeRoldanas",
          "limpiezaGeneral",
          "pruebaFuncional",
          "reparacionDefectuosa",
          "nivelador",
          "tieneNc",
        ],
      },
      {
        title: "Cierre",
        keys: [
          "observacionesGenerales",
          "inspeccionadoPor",
          "ccResponsableEquipo",
          "startedAt",
          "completedAt",
          "syncedAt",
        ],
      },
    ],
    evidenceFields: [
      { label: "Foto de la escalera", key: "fotoEscaleraUrl" },
      { label: "Firma quien inspecciona", key: "firmaInspeccionaUrl" },
      { label: "Firma responsable del equipo", key: "firmaResponsableEquipoUrl" },
    ],
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, ["serie", "marca", "tieneNc"]);
      return params;
    },
  },
  {
    id: "pghs-003-03-inspeccion-camioneta-moto",
    slug: "inspeccion-camioneta-moto",
    title: "Inspección Camioneta y Motocicleta",
    subtitle: "PGHS-003-03 v01 — Formato único de inspección (IOTEC Forms)",
    icon: "Truck",
    color: "#9a3412",
    apiBasePath: "/api/inspeccion-camioneta-moto",
    excelFileName: "inspeccion-camioneta-moto",
    detailTitle: (r) => `Placa ${String(r.placa ?? "—")}`,
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "placa", label: "Placa", placeholder: "ABC123" },
      {
        type: "select",
        key: "tipoVehiculo",
        label: "Tipo vehículo",
        options: [
          { value: "Camioneta", label: "Camioneta" },
          { value: "Motocicleta", label: "Motocicleta" },
        ],
      },
      {
        type: "select",
        key: "tieneNc",
        label: "Con hallazgos NC",
        options: [
          { value: "true", label: "Sí (M / NP / No)" },
          { value: "false", label: "No" },
        ],
      },
      {
        type: "select",
        key: "tieneCritico",
        label: "Ítems críticos",
        options: [
          { value: "true", label: "Sí (ítems *)" },
          { value: "false", label: "No" },
        ],
      },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "placa", label: "Placa" },
      { key: "tipoVehiculo", label: "Tipo" },
      { key: "modelo", label: "Modelo" },
      { key: "nombreConductor", label: "Conductor" },
      {
        key: "tieneNc",
        label: "NC",
        accessor: (r) => (r.tieneNc === true ? "Sí" : "No"),
      },
      {
        key: "tieneCritico",
        label: "Crítico",
        accessor: (r) => (r.tieneCritico === true ? "Sí" : "No"),
      },
      { key: "inspeccionadoPor", label: "Inspector" },
      { key: "submittedBy", label: "Usuario", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Encabezado",
        keys: [
          "fecha", "tipoVehiculo", "placa", "modelo", "tipoServicio", "proceso",
          "fechaSeguimiento", "nombreConductor", "cedulaConductor", "kilometraje",
        ],
      },
      {
        title: "Sistema de alumbrado",
        keys: [
          "lucesFrenos", "direccionalesTraseras", "lucesAlarmaReversa", "farolasAltas",
          "farolasMedias", "lucesEstacionamiento", "direccionalesDelanteras", "observacionesAlumbrado",
        ],
      },
      {
        title: "Sistema de frenos",
        keys: [
          "funcionamientoFrenoEmergencia", "frenoDelantero", "pedalFreno",
          "funcionamientoFreno", "observacionesFrenos",
        ],
      },
      {
        title: "Prevención y seguridad",
        keys: [
          "paletaPareSiga", "gato", "guantesSeguridad", "kitArrastre", "kitHerramientas",
          "llantasEstado", "defensas", "botiquin", "embrague", "extintor10lb", "conos", "cruceta",
          "cinturonesSeguridad", "bocina", "cunasTacos", "rodillerasCoderas", "cascoNtc4533",
          "observacionesPrevencion",
        ],
      },
      {
        title: "Documentos",
        keys: [
          "extractoContrato", "formatoBotiquin", "certificadoTecnicomecanica",
          "tecnicomecanicaVencimiento", "diligenciamientoPreoperacional", "licenciaConduccion",
          "licenciaCual", "licenciaVencimiento", "polizaSeguroContractual", "polizaVencimiento",
          "planillaSeguridadSocial", "soat", "soatVencimiento", "senalizacion767",
          "tarjetaPropiedad", "tarjetaOperacion", "tarjetaOperacionVencimiento",
          "restriccionesLicencia", "observacionesDocumentos",
        ],
      },
      {
        title: "Indicadores y medidores",
        keys: [
          "indicadoresMotor", "velocimetro", "gpsEquipo", "espejosRetrovisores",
          "observacionesIndicadores",
        ],
      },
      {
        title: "Kit control de derrames",
        keys: [
          "panosOleofilicos", "maletinKitDerrames", "protocoloAtencion", "guantesNitrilo",
          "amarrasPlasticas", "etiquetaResiduos", "escobaRecogedor", "cintaSenalizacion",
          "materialAbsorbente", "bolsaRoja", "tapabocasIndustrial", "desengrasante",
          "gafasSeguridad", "fichasSeguridad", "observacionesKitDerrames",
        ],
      },
      {
        title: "Revisión general y mantenimiento",
        keys: [
          "portaEscaleras", "portaPertiga", "sistemaDesempanante", "vidrios", "estadoPuertas",
          "fugas", "estadoGeneral", "chalecoReflectivo", "carpa", "cajonPortaHerramientas",
          "limpiaParabrisas", "observacionesRevisionGeneral", "cambioAceite", "cambioAceiteFechaKm",
          "observacionesMantenimiento", "tieneNc", "tieneCritico",
        ],
      },
      {
        title: "Cierre",
        keys: [
          "observacionesGenerales", "inspeccionadoPor", "startedAt", "completedAt", "syncedAt",
        ],
      },
    ],
    evidenceFields: [
      { label: "Foto inspección", key: "fotoInspeccionUrl" },
      { label: "Foto adicional", key: "fotoAdicionalUrl" },
      { label: "Firma inspector", key: "firmaInspectorUrl" },
      { label: "Firma conductor", key: "firmaConductorUrl" },
    ],
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, ["placa", "tipoVehiculo", "tieneNc", "tieneCritico"]);
      return params;
    },
  },
  {
    id: "podas-diario",
    slug: "podas-diario",
    title: "Actividades Diarias — Podas",
    subtitle: "UTEN_PODAS_DIARIO_v5 — Registro diario del proyecto de Podas (IOTEC Forms)",
    icon: "FileText",
    color: "#16a34a",
    apiBasePath: "/api/podas-diario",
    excelFileName: "podas-diario",
    detailTitle: (r) => `Orden ${String(r.ordenTrabajo ?? "—")}`,
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "zona", label: "Zona", placeholder: "Centro / Norte / Sur" },
      { type: "text", key: "municipio", label: "Municipio", placeholder: "Ej: Popayán" },
      { type: "text", key: "brigada", label: "Brigada", placeholder: "Ej: POZC1" },
      { type: "text", key: "ordenTrabajo", label: "Orden de trabajo", placeholder: "Número de orden" },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "ordenTrabajo", label: "Orden trabajo" },
      { key: "brigada", label: "Brigada" },
      { key: "municipio", label: "Municipio" },
      { key: "linea", label: "Línea" },
      { key: "intervencion", label: "Intervención" },
      { key: "codigoArbol", label: "Código árbol" },
      { key: "submittedBy", label: "Técnico", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Ubicación y orden",
        keys: [
          "zona", "fecha", "municipio", "municipioOtro", "vereda", "subestacion", "subestacionOtro",
          "linea", "lineaOtro", "nivelTension", "brigada", "numeroActaActividad", "numeroTransformador",
          "tipoOrden", "ordenTrabajo", "numTrabajo", "direccionPuntual", "ubicacion", "area",
        ],
      },
      {
        title: "Árbol e intervención",
        keys: [
          "estructuraInicial", "estructuraFinal", "distanciaMetros", "codigoArbol", "especieArborea",
          "especieArboreaOtro", "intervencion", "distanciaSeguridad", "diametroTalloM",
          "alturaComercialM", "alturaTotal",
        ],
      },
      {
        title: "Predio y residuos",
        keys: [
          "tipoPredio", "permisoUsuario", "nombreUsuario", "manejoResiduos", "volumenResiduosM3",
        ],
      },
      {
        title: "Georreferencia y cierre",
        keys: [
          "georreferenciacionX", "georreferenciacionY", "proximaIntervencionDias", "observaciones",
          "novedades",
        ],
      },
    ],
    evidenceFields: [
      { label: "Foto antes 1", key: "fotoInicial1Url" },
      { label: "Foto antes 2", key: "fotoInicial2Url" },
      { label: "Foto durante", key: "fotoDuranteUrl" },
      { label: "Foto permiso", key: "fotoPermisoUrl" },
      { label: "Foto permiso 2", key: "fotoPermiso2Url" },
      { label: "Foto residuos", key: "fotoResiduosUrl" },
      { label: "Foto cicatrización", key: "fotoCicatrizacionUrl" },
      { label: "Foto cicatrización 2", key: "fotoCicatrizacion2Url" },
      { label: "Foto final", key: "fotoFinalUrl" },
      { label: "Foto final 2", key: "fotoFinal2Url" },
      { label: "Marcación especie", key: "marcacionEspecieUrl" },
      { label: "Foto ubicación GARMIN", key: "fotoUbicacionGpsUrl" },
      { label: "Firma técnico", key: "firmaTecnicoUrl" },
      { label: "Fotos soporte novedades", key: "fotosSoporteNovedadesUrls", multiple: true },
    ],
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, ["zona", "municipio", "brigada", "ordenTrabajo"]);
      return params;
    },
  },
  {
    id: "checklist-conectores-cargas",
    slug: "checklist-conectores-cargas",
    title: "Checklist Conectores en Cargas",
    subtitle: "UTEN — Subdirectiva Popayán (IOTEC Forms)",
    icon: "FileText",
    color: "#f77f00",
    apiBasePath: "/api/checklist-conectores-cargas",
    excelFileName: "checklist-conectores-cargas",
    detailTitle: (r) => `OT ${String(r.ordenDeTrabajo ?? "—")}`,
    mapListRow: flattenChecklistRow,
    mapDetailRecord: flattenChecklistDetail,
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "ordenDeTrabajo", label: "Orden de trabajo", placeholder: "Número OT" },
    ],
    listColumns: [
      { key: "ordenDeTrabajo", label: "Orden trabajo" },
      { key: "presentaEmpalmes", label: "Presenta empalmes" },
      { key: "tieneConectoresN6", label: "Conectores N°6" },
      { key: "instaloConectoresN6", label: "Instaló N°6" },
      { key: "submittedBy", label: "Técnico", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      { title: "Orden de trabajo", keys: ["ordenDeTrabajo"] },
      {
        title: "Inspección",
        keys: ["presentaEmpalmes", "tieneConectoresN6", "instaloConectoresN6", "observaciones"],
      },
    ],
    evidenceFields: [],
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      if (filter.ordenDeTrabajo) params.append("ordenDeTrabajo", String(filter.ordenDeTrabajo).trim());
      if (filter.page) params.append("page", String(filter.page));
      params.append("pageSize", String(filter.pageSize ?? 50));
      return params;
    },
  },
  {
    id: "igai-001-17-actividades-diarias-distribucion",
    slug: "igai-actividades-diarias-distribucion",
    title: "Actividades Diarias — Distribución",
    subtitle: "IGAI-001-17 — Reporte de actividades diarias (Distribución)",
    icon: "Zap",
    color: "#ca8a04",
    apiBasePath: "/api/igai-actividades-diarias-distribucion",
    excelFileName: "igai-actividades-diarias-distribucion",
    detailTitle: (r) => `Acta ${String(r.numeroActaActividad ?? "—")}`,
    mapListRow: (row) => ({
      ...row,
      laboresResumen: formatIgaiLabores(row.labores),
    }),
    mapDetailRecord: (row) => ({
      ...row,
      laboresResumen: formatIgaiLabores(row.labores),
    }),
    filterFields: [
      { type: "dateRange" },
      {
        type: "select",
        key: "zona",
        label: "Zona",
        options: [
          { value: "Centro", label: "Centro" },
          { value: "Sur", label: "Sur" },
          { value: "Norte", label: "Norte" },
        ],
      },
      { type: "text", key: "municipio", label: "Municipio", placeholder: "Municipio" },
      { type: "text", key: "numeroActaActividad", label: "N° acta", placeholder: "Acta de actividad" },
      { type: "text", key: "circuito", label: "Circuito", placeholder: "Circuito" },
      { type: "text", key: "placaVehiculo", label: "Placa", placeholder: "ABC123" },
      {
        type: "select",
        key: "tipoActividad",
        label: "Tipo actividad",
        options: [
          { value: "Distribucion", label: "Distribución" },
          { value: "Comercial", label: "Comercial" },
        ],
      },
    ],
    listColumns: [
      { key: "fechaReporteIncidencia", label: "Fecha", format: "shortDate" },
      { key: "numeroActaActividad", label: "Acta" },
      { key: "zona", label: "Zona" },
      { key: "municipio", label: "Municipio" },
      { key: "circuito", label: "Circuito" },
      { key: "tipoActividad", label: "Tipo" },
      { key: "laboresResumen", label: "Labores" },
      { key: "tecnico1Nombre", label: "Técnico 1" },
      { key: "submittedBy", label: "Usuario", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Ubicación y acta",
        keys: [
          "direccion", "numeroActaActividad", "zona", "municipio", "barrio", "vereda",
          "cuentaProducto", "ruta", "nodosApoyos", "placaVehiculo",
          "ubicacionLat", "ubicacionLng",
        ],
      },
      {
        title: "Cuadrilla",
        keys: ["tecnico1Nombre", "tecnico2Nombre"],
      },
      {
        title: "Actividad y usuario",
        keys: [
          "tipoActividad", "horaReciboIncidencia", "usuarioNombre", "usuarioCedulaNit",
          "usuarioTelefono", "trafo", "circuito", "area",
        ],
      },
      {
        title: "Tiempos y mantenimiento",
        keys: [
          "fechaReporteIncidencia", "fechaFin", "horaInicioJornada", "horaFinJornada",
          "horaInicioDesplazamiento", "horaFinDesplazamiento", "horaInicioLabor", "horaFinLabor",
          "tipoMantenimiento",
        ],
      },
      {
        title: "Labores",
        keys: ["laboresResumen", "observaciones"],
      },
    ],
    evidenceFields: [
      { label: "Foto antes", key: "fotoAntesUrl" },
      { label: "Foto durante", key: "fotoDuranteUrl" },
      { label: "Foto después", key: "fotoDespuesUrl" },
      { label: "Firma técnico", key: "firmaTecnicoUrl" },
    ],
    locationField: {
      latKey: "ubicacionLat",
      lngKey: "ubicacionLng",
      label: "Ubicación GPS de la actividad",
    },
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, [
        "zona",
        "municipio",
        "numeroActaActividad",
        "circuito",
        "placaVehiculo",
        "tipoActividad",
      ]);
      return params;
    },
  },
  {
    id: "igai-002-12-acta-materiales-distribucion",
    slug: "igai-acta-materiales-distribucion",
    title: "Acta de Materiales — Distribución 13.2 kV",
    subtitle: "IGAI-002-12 — Materiales instalados y/o retirados",
    icon: "ClipboardCheck",
    color: "#a16207",
    apiBasePath: "/api/igai-acta-materiales-distribucion",
    excelFileName: "igai-acta-materiales-distribucion",
    detailTitle: (r) => `Acta ${String(r.numeroActaInstalacion ?? "—")}`,
    mapListRow: (row) => ({
      ...row,
      materialesResumen: formatIgaiMateriales(row.materiales),
    }),
    mapDetailRecord: (row) => ({
      ...row,
      materialesResumen: formatIgaiMateriales(row.materiales),
    }),
    filterFields: [
      { type: "dateRange" },
      { type: "text", key: "municipio", label: "Municipio", placeholder: "Municipio" },
      {
        type: "text",
        key: "numeroActaInstalacion",
        label: "N° acta instalación",
        placeholder: "Acta instalación",
      },
      {
        type: "text",
        key: "numeroActaActividad",
        label: "N° acta actividad",
        placeholder: "Acta actividad",
      },
      { type: "text", key: "numeroTicket", label: "Ticket", placeholder: "N° ticket" },
    ],
    listColumns: [
      { key: "fecha", label: "Fecha", format: "shortDate" },
      { key: "numeroActaInstalacion", label: "Acta instalación" },
      { key: "municipio", label: "Municipio" },
      { key: "numeroTicket", label: "Ticket" },
      { key: "materialesResumen", label: "Materiales" },
      { key: "tecnicoNombre", label: "Técnico" },
      { key: "submittedBy", label: "Usuario", accessor: (r) => (r.submittedBy as { name?: string })?.name },
      { key: "syncedAt", label: "Sincronizado", format: "datetime" },
    ],
    detailSections: [
      {
        title: "Datos del acta",
        keys: [
          "numeroActaInstalacion", "fecha", "funcionarioJefeBrigada", "cod", "numeroActaActividad",
          "numeroCaso", "numeroTicket", "numeroTrabajo", "numeroConsigna", "municipio",
          "stUten", "saCeo", "nodosApoyos",
        ],
      },
      {
        title: "Materiales",
        keys: ["materialesResumen"],
      },
      {
        title: "Técnico",
        keys: ["tecnicoNombre"],
      },
    ],
    evidenceFields: [
      { label: "Firma técnico", key: "firmaTecnicoUrl" },
    ],
    buildQueryParams: (filter) => {
      const params = new URLSearchParams();
      if (filter.fechaDesde) params.append("fechaDesde", String(filter.fechaDesde));
      if (filter.fechaHasta) params.append("fechaHasta", String(filter.fechaHasta));
      appendOptional(params, filter, [
        "municipio",
        "numeroActaInstalacion",
        "numeroActaActividad",
        "numeroTicket",
      ]);
      return params;
    },
  },
];

function formatIgaiLabores(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "—";
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { codigo?: string; cantidad?: number; label?: string };
      if (!row.codigo) return null;
      const name = row.label ? `${row.codigo} — ${row.label}` : row.codigo;
      return `${name} × ${row.cantidad ?? "?"}`;
    })
    .filter(Boolean)
    .join("; ");
}

function formatIgaiMateriales(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "—";
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as {
        modo?: string;
        codigoSap?: string;
        descripcion?: string;
        cantidadInstalada?: number;
        cantidadRetirada?: number;
      };
      const name =
        row.modo === "otro"
          ? row.descripcion
          : row.descripcion
            ? `${row.codigoSap ?? ""} — ${row.descripcion}`
            : row.codigoSap;
      if (!name) return null;
      return `${name} (Inst. ${row.cantidadInstalada ?? 0} / Ret. ${row.cantidadRetirada ?? 0})`;
    })
    .filter(Boolean)
    .join("; ");
}
export function getFormReportBySlug(slug: string): FormReportConfig | undefined {
  return FORM_REPORTS.find((f) => f.slug === slug);
}

export const IOTEC_FORM_REPORT_SLUGS = FORM_REPORTS.map((f) => f.slug);
