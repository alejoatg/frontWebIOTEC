"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { Button } from "@/components";
import {
  downloadTmrExcel,
  previewTmr,
  TMR_EXCLUSIONS,
  type TmrOverride,
  type TmrPreview,
  type TmrRow,
} from "./api";
import TmrJornada from "./TmrJornada";
import TmrReincidencias from "./TmrReincidencias";
import TmrOrdenDetalle from "./TmrOrdenDetalle";
import styles from "./TmrContainer.module.scss";

const TmrMensual = dynamic(() => import("./TmrMensual"), {
  ssr: false,
  loading: () => <p className={styles.hint}>Preparando análisis mensual…</p>,
});

const TmrMapa = dynamic(() => import("./TmrMapa"), {
  ssr: false,
  loading: () => <p className={styles.hint}>Preparando mapa…</p>,
});

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PAGE = 40;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function hours(value: number | null): string {
  return value == null || !Number.isFinite(value) ? "—" : value.toFixed(2);
}

function pct(part: number, total: number): string {
  if (!total) return "0 %";
  return `${((part / total) * 100).toFixed(1)} %`;
}

export default function TmrContainer() {
  const [preview, setPreview] = useState<TmrPreview | null>(null);
  const [rows, setRows] = useState<TmrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [exclusion, setExclusion] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [crew, setCrew] = useState("");
  const [page, setPage] = useState(0);
  const [section, setSection] = useState<"listado" | "jornada" | "reincidencias" | "mensual" | "mapa">("listado");
  const [mensualOn, setMensualOn] = useState(false);
  const [mapaOn, setMapaOn] = useState(false);
  const [mensualBusy, setMensualBusy] = useState(false);
  const [mapaBusy, setMapaBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const openRow = openId ? rows.find((row) => row.id === openId) ?? null : null;

  const summary = preview?.summary;
  const municipios = useMemo(
    () => [...new Set(rows.map((row) => row.municipality).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [rows],
  );
  const crews = useMemo(
    () => [...new Set(rows.map((row) => row.crew).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (exclusion && row.exclusion !== exclusion) return false;
      if (municipio && row.municipality !== municipio) return false;
      if (crew && row.crew !== crew) return false;
      if (!q) return true;
      return [row.caseSerial, row.jobSerial, row.crew, row.municipality, row.nucleo]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, exclusion, municipio, crew]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageSafe = Math.min(page, pages - 1);
  const slice = filtered.slice(pageSafe * PAGE, pageSafe * PAGE + PAGE);

  const edited = useMemo(() => {
    if (!preview) return {};
    const map: Record<string, TmrOverride> = {};
    const original = new Map(preview.rows.map((row) => [row.id, row]));
    for (const row of rows) {
      const base = original.get(row.id);
      if (!base) continue;
      if (
        row.exclusion !== base.exclusion ||
        row.observacion !== base.observacion ||
        row.notaCeo !== base.notaCeo
      ) {
        map[row.id] = {
          exclusion: row.exclusion,
          observacion: row.observacion,
          notaCeo: row.notaCeo,
        };
      }
    }
    return map;
  }, [preview, rows]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    previewTmr()
      .then((result) => {
        if (cancel) return;
        setPreview(result);
        setRows(result.rows);
        setPage(0);
        setMensualOn(false);
        setMapaOn(false);
        setMensualBusy(false);
        setMapaBusy(false);
        setOpenId(null);
      })
      .catch((e) => {
        if (!cancel) setError(e instanceof Error ? e.message : "Error al analizar");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  function patch(id: string, next: Partial<TmrRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...next } : row)));
  }

  async function handleDownload() {
    if (!preview) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadTmrExcel(edited);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al descargar");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <p className={styles.hint}>
          {loading
            ? "Cargando consolidado de septiembre 2026…"
            : "Prueba con el consolidado de septiembre 2026."}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={handleDownload}
          disabled={!preview || downloading}
        >
          {downloading ? "Descargando…" : "Descargar Excel conciliado"}
        </Button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.tabs}>
        <button
          type="button"
          className={section === "listado" ? styles.tabOn : styles.tab}
          onClick={() => setSection("listado")}
        >
          Listado conciliado
        </button>
        <button
          type="button"
          className={section === "jornada" ? styles.tabOn : styles.tab}
          onClick={() => setSection("jornada")}
        >
          Análisis de jornada
        </button>
        <button
          type="button"
          className={section === "reincidencias" ? styles.tabOn : styles.tab}
          onClick={() => setSection("reincidencias")}
        >
            Análisis de reincidencias
          </button>
          <button
            type="button"
            className={section === "mensual" ? styles.tabOn : styles.tab}
            onClick={() => setSection("mensual")}
          >
            Análisis mensual
          </button>
          <button
            type="button"
            className={section === "mapa" ? styles.tabOn : styles.tab}
            onClick={() => setSection("mapa")}
          >
            Mapa de calor
          </button>
        </div>
      {!summary && !loading ? (
        <p className={styles.hint}>
          No se pudo cargar el consolidado de septiembre. Mensual y mapa se piden
          aparte, con su botón.
        </p>
      ) : null}

      {summary && section === "listado" ? (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{summary.uten}</strong>
              Jobs UTEN
            </div>
            <div className={styles.stat}>
              <strong>{pct(summary.r8Frio, summary.uten)}</strong>
              R{"<"}8 H frío
            </div>
            <div className={styles.stat}>
              <strong>{pct(summary.r8Validado, summary.uten)}</strong>
              R{"<"}8 H validado
            </div>
            <div className={styles.stat}>
              <strong>{summary.cumple}</strong>
              Cumple
            </div>
            <div className={styles.stat}>
              <strong>{summary.noCumple}</strong>
              No cumple
            </div>
            <div className={styles.stat}>
              <strong>{summary.cpl}</strong>
              Logística especial
            </div>
            <div className={styles.stat}>
              <strong>{summary.fhl}</strong>
              Fuera de horario
            </div>
            <div className={styles.stat}>
              <strong>{summary.sobreasignacion}</strong>
              Sobreasignación
            </div>
            <div className={styles.stat}>
              <strong>{Object.keys(edited).length}</strong>
              Editadas
            </div>
          </div>

          <div className={styles.charts}>
            <div className={styles.chart}>
              <h3>Exclusión automática</h3>
              <Pie
                data={{
                  labels: ["Cumple", "No cumple", "Logística especial", "Fuera de horario", "Sobreasignación"],
                  datasets: [
                    {
                      data: [
                        summary.cumple,
                        summary.noCumple,
                        summary.cpl,
                        summary.fhl,
                        summary.sobreasignacion,
                      ],
                      backgroundColor: ["#0f766e", "#b91c1c", "#d97706", "#2563eb", "#64748b"],
                    },
                  ],
                }}
                options={{ plugins: { legend: { position: "bottom" } } }}
              />
            </div>
            <div className={styles.chart}>
              <h3>R{"<"}8 / R{">"}8 por ubicación</h3>
              <Bar
                data={{
                  labels: summary.byUbicacion.map((item) => item.ubicacion),
                  datasets: [
                    {
                      label: "R<8 H",
                      data: summary.byUbicacion.map((item) => item.r8),
                      backgroundColor: "#0f766e",
                    },
                    {
                      label: "R>8 H",
                      data: summary.byUbicacion.map((item) => item.rOver),
                      backgroundColor: "#b91c1c",
                    },
                  ],
                }}
                options={{
                  plugins: { legend: { position: "bottom" } },
                  scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                }}
              />
            </div>
          </div>

          <div className={styles.filters}>
            <div className={styles.field}>
              <label>Buscar</label>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Caso, job, brigada…"
              />
            </div>
            <div className={styles.field}>
              <label>Exclusión</label>
              <select
                value={exclusion}
                onChange={(e) => {
                  setExclusion(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todas</option>
                {TMR_EXCLUSIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Municipio</label>
              <select
                value={municipio}
                onChange={(e) => {
                  setMunicipio(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todos</option>
                {municipios.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Brigada</label>
              <select
                value={crew}
                onChange={(e) => {
                  setCrew(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todas</option>
                {crews.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className={styles.hint}>
            {filtered.length} filas. Página {pageSafe + 1} de {pages}. Pulse una fila para ver el
            detalle, la línea de tiempo y guardar observación o nota.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Caso</th>
                  <th>Job</th>
                  <th>Brigada</th>
                  <th>Municipio</th>
                  <th>Start</th>
                  <th>Validado</th>
                  <th>TMR frío</th>
                  <th>TMR UTEN</th>
                  <th>Rango</th>
                  <th>Sobre</th>
                  <th>Exclusión</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((row) => (
                  <tr
                    key={row.id}
                    className={styles.clickRow}
                    onClick={() => setOpenId(row.id)}
                  >
                    <td>{row.caseSerial}</td>
                    <td>{row.jobSerial}</td>
                    <td>{row.crew}</td>
                    <td>{row.municipality}</td>
                    <td>{formatTs(row.startTime)}</td>
                    <td>{formatTs(row.startValidado)}</td>
                    <td>{hours(row.tmrDuracion)}</td>
                    <td>{hours(row.tmrDuracionUten)}</td>
                    <td>{row.rango2Uten || "—"}</td>
                    <td>{row.sobreAsignacion ? "Sí" : ""}</td>
                    <td>
                      {row.exclusion || "—"}
                      {row.exclusion !== row.exclusionAuto ? (
                        <div className={styles.muted}>auto: {row.exclusionAuto || "—"}</div>
                      ) : null}
                    </td>
                    <td>
                      {row.observacion || row.notaCeo ? "Sí" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pager}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageSafe <= 0}
              onClick={() => setPage(pageSafe - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageSafe >= pages - 1}
              onClick={() => setPage(pageSafe + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      ) : null}

      {summary && section === "jornada" ? (
        <TmrJornada rows={rows} onOpen={(row) => setOpenId(row.id)} />
      ) : null}
      {summary && section === "reincidencias" ? <TmrReincidencias rows={rows} /> : null}
      {summary && section === "mensual" ? (
        mensualOn ? (
          <TmrMensual rows={rows} />
        ) : (
          <LazyStart
            title="Análisis mensual"
            text="Este cálculo no corre con Analizar. Pulse el botón cuando quiera el panorama del mes y el detalle por brigada."
            busy={mensualBusy}
            onStart={() => {
              setMensualBusy(true);
              window.setTimeout(() => setMensualOn(true), 40);
            }}
          />
        )
      ) : null}
      {summary && section === "mapa" ? (
        mapaOn ? (
          <TmrMapa rows={rows} />
        ) : (
          <LazyStart
            title="Mapa de calor"
            text="Leaflet y el catálogo de municipios/núcleos se cargan solo aquí, no junto al listado ni al mensual."
            busy={mapaBusy}
            action="Cargar mapa"
            onStart={() => {
              setMapaBusy(true);
              window.setTimeout(() => setMapaOn(true), 40);
            }}
          />
        )
      ) : null}

      {openRow ? (
        <TmrOrdenDetalle
          row={openRow}
          onClose={() => setOpenId(null)}
          onSave={(next) => patch(openRow.id, next)}
        />
      ) : null}
    </div>
  );
}

function LazyStart({
  title,
  text,
  onStart,
  busy,
  action = "Generar análisis",
}: {
  title: string;
  text: string;
  onStart: () => void;
  busy: boolean;
  action?: string;
}) {
  return (
    <div className={styles.lazy}>
      <h3>{title}</h3>
      <p>{text}</p>
      <Button type="button" onClick={onStart} disabled={busy}>
        {busy ? "Generando…" : action}
      </Button>
    </div>
  );
}
