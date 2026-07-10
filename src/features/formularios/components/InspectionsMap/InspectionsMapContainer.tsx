"use client";

import { useCallback, useMemo, useState } from "react";
import { Map as MapIcon, Search } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import DateRangeFilter, {
  useDefaultMonthRange,
} from "../shared/DateRangeFilter";
import { validateDateRange } from "../../lib/dateRange";
import { fetchFormLocations } from "../../api/formLocationsApi";
import { fetchFormReportById } from "../../api/formReportsApi";
import { getFormReportBySlug } from "../../config/formReportsRegistry";
import type { FormReportConfig } from "../../config/formReportTypes";
import type { FormLocationPoint } from "../../types/formLocations";
import { MAP_FORM_OPTIONS } from "../../types/formLocations";
import InspectionsMapCanvas from "./InspectionsMapCanvas";
import InspectionDetailModal from "./InspectionDetailModal";
import styles from "./InspectionsMapContainer.module.scss";

const MAP_MAX_RANGE_DAYS = 90;

export default function InspectionsMapContainer() {
  const defaultRange = useDefaultMonthRange();
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fechaHasta);
  const [selectedForms, setSelectedForms] = useState<string[]>(
    MAP_FORM_OPTIONS.map((f) => f.id),
  );
  const [q, setQ] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<FormLocationPoint[]>([]);
  const [total, setTotal] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [selected, setSelected] = useState<FormLocationPoint | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<Record<string, unknown> | null>(null);
  const [detailConfig, setDetailConfig] = useState<FormReportConfig | null>(null);

  const toggleForm = (id: string) => {
    setSelectedForms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSearch = useCallback(async () => {
    const rangeErrors = validateDateRange(fechaDesde, fechaHasta, MAP_MAX_RANGE_DAYS);
    if (Object.keys(rangeErrors).length > 0) {
      setErrors(rangeErrors);
      return;
    }
    if (selectedForms.length === 0) {
      setErrors({ forms: "Selecciona al menos un tipo de formulario" });
      return;
    }
    setErrors({});
    setLoading(true);
    setFetchError(null);
    setHasSearched(true);
    try {
      const result = await fetchFormLocations({
        fechaDesde,
        fechaHasta,
        forms: selectedForms,
        q: q.trim() || undefined,
      });
      setPoints(result.data);
      setTotal(result.total);
    } catch (e) {
      setPoints([]);
      setTotal(0);
      setFetchError(e instanceof Error ? e.message : "Error al consultar");
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, selectedForms, q]);

  const handleSelectPoint = useCallback(async (point: FormLocationPoint) => {
    setSelected(point);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailRecord(null);

    const config = getFormReportBySlug(point.formSlug) ?? null;
    setDetailConfig(config);

    if (!config) {
      setDetailLoading(false);
      setDetailError("Formulario no configurado en reportes web");
      return;
    }

    try {
      const record = await fetchFormReportById(config, point.id);
      setDetailRecord(record);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Error al cargar detalle");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const legend = useMemo(
    () => MAP_FORM_OPTIONS.filter((f) => selectedForms.includes(f.id)),
    [selectedForms],
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <MapIcon size={28} color="#2563eb" />
          <div>
            <h1 className={styles.title}>Mapa de inspecciones</h1>
            <p className={styles.subtitle}>
              Visualiza en el mapa las ubicaciones GPS de formularios IOTEC.
              Haz clic en un pin para ver el detalle.
            </p>
          </div>
        </div>
      </header>

      <div className={styles.filters}>
        <DateRangeFilter
          value={{ fechaDesde, fechaHasta }}
          onChange={(v) => {
            setFechaDesde(v.fechaDesde);
            setFechaHasta(v.fechaHasta);
          }}
          errors={errors}
          disabled={loading}
          maxDays={MAP_MAX_RANGE_DAYS}
        />

        <Input
          label="Buscar (orden / placa / texto)"
          placeholder="Ej: OT 12345 o ABC123"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSearch();
          }}
          disabled={loading}
        />

        <div className={styles.formToggles}>
          <span className={styles.formTogglesLabel}>Formularios</span>
          <div className={styles.chips}>
            {MAP_FORM_OPTIONS.map((f) => {
              const active = selectedForms.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={active ? styles.chipActive : styles.chip}
                  style={
                    active
                      ? ({ "--chip-color": f.color } as React.CSSProperties)
                      : undefined
                  }
                  onClick={() => toggleForm(f.id)}
                  disabled={loading}
                >
                  <span
                    className={styles.chipDot}
                    style={{ background: f.color }}
                  />
                  {f.label}
                </button>
              );
            })}
          </div>
          {errors.forms ? (
            <p className={styles.fieldError}>{errors.forms}</p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button onClick={() => void handleSearch()} disabled={loading}>
            <Search size={16} style={{ marginRight: 6 }} />
            {loading ? "Buscando..." : "Buscar en mapa"}
          </Button>
          {hasSearched ? (
            <span className={styles.resultCount}>
              {total} ubicación{total === 1 ? "" : "es"}
            </span>
          ) : null}
        </div>
      </div>

      {fetchError ? <p className={styles.fetchError}>{fetchError}</p> : null}

      {legend.length > 0 && hasSearched ? (
        <div className={styles.legend}>
          {legend.map((f) => (
            <span key={f.id} className={styles.legendItem}>
              <span className={styles.chipDot} style={{ background: f.color }} />
              {f.label}
            </span>
          ))}
        </div>
      ) : null}

      <InspectionsMapCanvas
        points={points}
        onSelect={(p) => void handleSelectPoint(p)}
        selectedId={selected?.id}
      />

      {!hasSearched ? (
        <p className={styles.hint}>
          Selecciona un rango de fechas (máx. {MAP_MAX_RANGE_DAYS} días) y pulsa
          Buscar para cargar los pines.
        </p>
      ) : null}

      <InspectionDetailModal
        open={detailOpen}
        config={detailConfig}
        record={detailRecord}
        loading={detailLoading}
        error={detailError}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
