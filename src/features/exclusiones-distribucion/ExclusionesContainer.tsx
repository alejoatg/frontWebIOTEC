"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components";
import {
  downloadExclusionesZip,
  previewExclusiones,
  type ExclusionPreviewResult,
} from "./api";
import styles from "./ExclusionesContainer.module.scss";

const BATCH = 250;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CO");
}

export default function ExclusionesContainer() {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [strictAssociation, setStrictAssociation] = useState(false);
  const [cleanNotes, setCleanNotes] = useState(false);
  const [preview, setPreview] = useState<ExclusionPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!preview) return [];
    const q = query.trim().toLowerCase();
    if (!q) return preview.groups;
    return preview.groups.filter(
      (g) =>
        g.caseLabel.toLowerCase().includes(q) ||
        g.caseIds.some((id) => id.includes(q)) ||
        g.circuitos.some((c) => c.toLowerCase().includes(q)),
    );
  }, [preview, query]);

  const batches = preview ? Math.ceil(preview.reportableGroups / BATCH) : 0;

  async function handlePreview() {
    if (!file) {
      setError("Seleccione el CONSOLIDADO (.xlsx)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await previewExclusiones(file, { strictAssociation, cleanNotes });
      setPreview(data);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Error al previsualizar");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(batchIndex?: number) {
    if (!file) return;
    setGenerating(true);
    setError(null);
    try {
      await downloadExclusionesZip(file, {
        strictAssociation,
        cleanNotes,
        template,
        batchSize: BATCH,
        batchIndex: batchIndex ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar ZIP");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Suba la sábana <strong>CONSOLIDADO</strong> en formato <strong>.xlsx</strong> (si tiene
        .xlsb, guárdelo como .xlsx). Se genera un Excel editable por grupo con entregado = 1.
        El logo de la plantilla se copia en cada informe. El código de circuito, la
        subestación y la causa de exclusión salen del catálogo de la plantilla (hojas UIL y
        Causas). La ubicación y las fotos del evento se completan a mano. La descarga sale
        en lotes de 250 archivos.
      </p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>CONSOLIDADO (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
            }}
          />
        </div>
        <div className={styles.field}>
          <label>Plantilla Soporte (opcional)</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setTemplate(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className={styles.checks}>
        <label>
          <input
            type="checkbox"
            checked={strictAssociation}
            onChange={(e) => setStrictAssociation(e.target.checked)}
          />{" "}
          Asociación estricta (solo números junto a “caso / asociado / continuación”)
        </label>
        <label>
          <input
            type="checkbox"
            checked={cleanNotes}
            onChange={(e) => setCleanNotes(e.target.checked)}
          />{" "}
          Limpiar texto de notas (quitar ?? y Â)
        </label>
      </div>

      <div className={styles.row}>
        <Button type="button" disabled={loading || !file} onClick={() => void handlePreview()}>
          {loading ? "Analizando…" : "Previsualizar grupos"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={generating || !preview || preview.reportableGroups === 0 || batches !== 1}
          onClick={() => void handleGenerate(0)}
        >
          {generating ? "Generando…" : "Generar ZIP"}
        </Button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {preview ? (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{preview.totalRows}</strong>
              Filas
            </div>
            <div className={styles.stat}>
              <strong>{preview.totalGroups}</strong>
              Grupos totales
            </div>
            <div className={styles.stat}>
              <strong>{preview.reportableGroups}</strong>
              Informes (entregado=1)
            </div>
            <div className={styles.stat}>
              <strong>{preview.multiCaseGroups}</strong>
              Grupos con 2+ casos
            </div>
            <div className={styles.stat}>
              <strong>{preview.associationLinks}</strong>
              Vínculos
            </div>
          </div>

          {batches > 1 ? (
            <div className={styles.batch}>
              <span>
                {preview.reportableGroups} informes: descargue en lotes de {BATCH}.
              </span>
              {Array.from({ length: batches }, (_, i) => (
                <Button
                  key={i}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={generating}
                  onClick={() => void handleGenerate(i)}
                >
                  Lote {i + 1}
                </Button>
              ))}
            </div>
          ) : null}

          <input
            type="search"
            placeholder="Filtrar por caso o circuito…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° caso</th>
                  <th>Filas</th>
                  <th>Multi</th>
                  <th>Circuitos</th>
                  <th>Inicio</th>
                  <th>Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 400).map((g) => (
                  <tr key={g.caseIds.join("-")}>
                    <td>{g.caseLabel}</td>
                    <td>{g.rowCount}</td>
                    <td>{g.multiCase ? "Sí" : "No"}</td>
                    <td>{g.circuitos.join(" · ")}</td>
                    <td>{fmtDate(g.fechaInicio)}</td>
                    <td>{g.clasificacion || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 400 ? (
            <p className={styles.hint}>Mostrando 400 de {filtered.length} grupos.</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
