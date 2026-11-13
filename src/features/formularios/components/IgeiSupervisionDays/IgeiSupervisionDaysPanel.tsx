"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { API_URL } from "@/lib/api";
import DateRangeFilter, {
  useDefaultMonthRange,
} from "../shared/DateRangeFilter";
import { validateDateRange } from "../../lib/dateRange";
import { formatShortDate } from "../../lib/formatters";
import styles from "./IgeiSupervisionDaysPanel.module.scss";

type DayRow = {
  fechaEjecucion: string;
  supervisorId: string;
  supervisorNombre: string;
  inspecciones: number;
  conNc: number;
  proceso: string;
  zona: string;
  afiliados: string;
  porcentajeSupervision: number | null;
  cumple: string | null;
  revisadoAt: string | null;
  revisadoPor: { id: string; name: string } | null;
};

export default function IgeiSupervisionDaysPanel() {
  const { user } = useAuth();
  const defaultRange = useDefaultMonthRange();
  const [range, setRange] = useState(defaultRange);
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { porcentaje: string; cumple: string }>
  >({});

  const canReview = user?.role === "CORDINADOR" || user?.role === "ADMIN";

  const load = async () => {
    const rangeErrors = validateDateRange(range.fechaDesde, range.fechaHasta);
    if (Object.keys(rangeErrors).length > 0) {
      setError(Object.values(rangeErrors)[0] ?? "Rango de fechas inválido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("fechaDesde", range.fechaDesde);
      params.set("fechaHasta", range.fechaHasta);
      const response = await fetch(
        `${API_URL}/api/igei-supervision-terreno/dias?${params.toString()}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        throw new Error("No se pudo cargar el agrupado por día");
      }
      const data = (await response.json()) as DayRow[];
      setRows(data);
      const next: Record<string, { porcentaje: string; cumple: string }> = {};
      for (const row of data) {
        next[`${row.fechaEjecucion}|${row.supervisorId}`] = {
          porcentaje:
            row.porcentajeSupervision == null ? "" : String(row.porcentajeSupervision),
          cumple: row.cumple === "Si" || row.cumple === "No" ? row.cumple : "",
        };
      }
      setDrafts(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar");
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  const save = async (row: DayRow) => {
    const key = `${row.fechaEjecucion}|${row.supervisorId}`;
    const draft = drafts[key] ?? { porcentaje: "", cumple: "" };
    setSavingKey(key);
    setError(null);
    try {
      const porcentajeRaw = draft.porcentaje.trim().replace(",", ".");
      const porcentajeSupervision =
        porcentajeRaw === "" ? null : Number(porcentajeRaw);
      if (porcentajeRaw !== "" && !Number.isFinite(porcentajeSupervision)) {
        throw new Error("% de supervisión inválido");
      }
      const response = await fetch(`${API_URL}/api/igei-supervision-terreno/dias`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaEjecucion: row.fechaEjecucion,
          supervisorId: row.supervisorId,
          porcentajeSupervision,
          cumple: draft.cumple || null,
        }),
      });
      if (!response.ok) {
        throw new Error("No se pudo guardar la revisión del día");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.intro}>
        <h3 className={styles.heading}>Revisión por día</h3>
        <p className={styles.hint}>
          Agrupa las inspecciones por fecha de ejecución y supervisor. El coordinador
          registra el % de supervisión y si cumple, según la muestra del día.
        </p>
      </div>

      <div className={styles.filters}>
        <DateRangeFilter value={range} onChange={setRange} disabled={loading} />
        <Button onClick={() => void load()} disabled={loading}>
          {loading ? "Consultando..." : "Consultar días"}
        </Button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {rows && rows.length === 0 ? (
        <p className={styles.empty}>No hay inspecciones en ese rango.</p>
      ) : null}

      {rows && rows.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha ejecución</th>
                <th>Supervisor</th>
                <th>Inspecciones</th>
                <th>Con NC</th>
                <th>Proceso</th>
                <th>Zona</th>
                <th>% supervisión</th>
                <th>Cumple</th>
                {canReview ? <th></th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = `${row.fechaEjecucion}|${row.supervisorId}`;
                const draft = drafts[key] ?? { porcentaje: "", cumple: "" };
                return (
                  <tr key={key}>
                    <td>{formatShortDate(row.fechaEjecucion)}</td>
                    <td>{row.supervisorNombre || "—"}</td>
                    <td>{row.inspecciones}</td>
                    <td>{row.conNc}</td>
                    <td>{row.proceso || "—"}</td>
                    <td>{row.zona || "—"}</td>
                    <td>
                      {canReview ? (
                        <Input
                          type="number"
                          value={draft.porcentaje}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [key]: { ...draft, porcentaje: e.target.value },
                            }))
                          }
                          min={0}
                          max={100}
                          step="0.01"
                        />
                      ) : (
                        row.porcentajeSupervision ?? "—"
                      )}
                    </td>
                    <td>
                      {canReview ? (
                        <select
                          className={styles.select}
                          value={draft.cumple}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [key]: { ...draft, cumple: e.target.value },
                            }))
                          }
                        >
                          <option value="">—</option>
                          <option value="Si">Sí</option>
                          <option value="No">No</option>
                        </select>
                      ) : (
                        row.cumple === "Si" ? "Sí" : row.cumple === "No" ? "No" : "—"
                      )}
                    </td>
                    {canReview ? (
                      <td>
                        <Button
                          onClick={() => void save(row)}
                          disabled={savingKey === key}
                          variant="secondary"
                        >
                          {savingKey === key ? "Guardando..." : "Guardar"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
