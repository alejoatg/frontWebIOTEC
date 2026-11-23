"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import {
  fetchPdfFirmaDetail,
  fetchPdfFirmas,
  signPdfFirma,
  type PdfFirmaItem,
  type PdfSignature,
} from "../../api/overtimeApi";
import styles from "./FirmasPdfContainer.module.scss";

const TAGS = [
  { id: "SIN_FIRMA", label: "Sin firma" },
  { id: "TECNICO", label: "Firmado por técnico" },
  { id: "SUPERVISOR", label: "Firmado por supervisor" },
  { id: "CORDINADOR", label: "Firmado por coordinador" },
  { id: "CONTABILIDAD", label: "Validado por contabilidad" },
] as const;

const SLOTS = [
  { id: "TECNICO", label: "Técnico" },
  { id: "SUPERVISOR", label: "Supervisor" },
  { id: "CORDINADOR", label: "Coordinador" },
  { id: "CONTABILIDAD", label: "Contabilidad" },
] as const;

type Slot = (typeof SLOTS)[number]["id"];

function signatureOf(item: PdfFirmaItem, slot: Slot) {
  return item.signatures.find((signature) => signature.slot === slot);
}

export default function FirmasPdfContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [items, setItems] = useState<PdfFirmaItem[]>([]);
  const [signingEnabled, setSigningEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PdfFirmaItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPdfFirmas({
        year,
        month,
        search,
        tags,
      });
      setItems(data.items);
      setSigningEnabled(data.signingEnabled);
      setSelected((current) =>
        current ? (data.items.find((item) => item.id === current.id) ?? null) : null,
      );
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "No se pudo cargar el buzón");
    } finally {
      setLoading(false);
    }
  }, [year, month, search, tags]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleTag(id: string) {
    setTags((current) =>
      current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id],
    );
  }

  return (
    <div>
      <PeriodSelector
        year={year}
        month={month}
        onChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
          setSelected(null);
        }}
      />
      <p className={styles.note}>
        Buzón de prueba, visible solo para administración. Puede firmar en cualquiera
        de los cuatro roles; la firma queda marcada como prueba.
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.filters}>
        <label className={styles.search}>
          Nombre o cédula
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <div className={styles.tags}>
          {TAGS.map((tag) => (
            <label key={tag.id} className={styles.check}>
              <input
                type="checkbox"
                checked={tags.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              {tag.label}
            </label>
          ))}
        </div>
      </div>
      {loading && <p className={styles.note}>Cargando planillas…</p>}
      {!loading && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Trabajador</th>
                <th>Cédula</th>
                <th>Registros</th>
                {SLOTS.map((slot) => (
                  <th key={slot.id}>{slot.label}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8}>Sin planillas para ese filtro</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.plantillaCode}</td>
                    <td>{item.employeeFullName}</td>
                    <td>{item.employeeDocumentNumber}</td>
                    <td>{item.entryCount}</td>
                    {SLOTS.map((slot) => {
                      const signature = signatureOf(item, slot.id);
                      return (
                        <td key={slot.id}>
                          <span className={signature ? styles.tagOn : styles.tagOff}>
                            {signature ? "Firmado" : "Pendiente"}
                          </span>
                        </td>
                      );
                    })}
                    <td>
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelected(item)}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <FirmaDetail
          plantillaId={selected.id}
          signingEnabled={signingEnabled}
          onClose={() => setSelected(null)}
          onSigned={() => void load()}
        />
      )}
    </div>
  );
}

function FirmaDetail({
  plantillaId,
  signingEnabled,
  onClose,
  onSigned,
}: {
  plantillaId: string;
  signingEnabled: boolean;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [detail, setDetail] = useState<PdfFirmaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot>("TECNICO");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    let active = true;
    fetchPdfFirmaDetail(plantillaId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "No se pudo abrir la planilla");
      });
    return () => {
      active = false;
    };
  }, [plantillaId]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const pos = point(event);
    if (!canvas || !pos || !signingEnabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const pos = point(event);
    const ctx = canvasRef.current?.getContext("2d");
    if (!pos || !ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setError(null);
    try {
      await signPdfFirma(plantillaId, { slot, imagePng: canvas.toDataURL("image/png") });
      onSigned();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la firma");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{detail?.plantillaCode ?? "Planilla"}</h3>
        <p className={styles.note}>
          {detail
            ? `${detail.employeeFullName} · ${detail.employeeDocumentNumber}`
            : "Cargando…"}
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <ul className={styles.signList}>
          {SLOTS.map((item) => {
            const signature = detail?.signatures.find((row) => row.slot === item.id);
            return (
              <li key={item.id}>
                <strong>{item.label}</strong>
                {signature ? <SignatureLine signature={signature} /> : <span> Sin firma</span>}
              </li>
            );
          })}
        </ul>
        <label className={styles.search}>
          Rol de la firma de prueba
          <select value={slot} disabled={!signingEnabled} onChange={(e) => setSlot(e.target.value as Slot)}>
            {SLOTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <canvas
          ref={canvasRef}
          width={520}
          height={140}
          className={signingEnabled ? styles.pad : styles.padDisabled}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => {
            drawing.current = false;
          }}
        />
        <p className={styles.note}>
          {signingEnabled
            ? "Flujo de prueba activo. Esta firma queda marcada como prueba."
            : "La firma está deshabilitada. El trazo no se guarda."}
        </p>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" disabled={!signingEnabled || saving} onClick={() => void save()}>
            {saving ? "Guardando…" : "Guardar firma de prueba"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SignatureLine({ signature }: { signature: PdfSignature }) {
  const when = new Date(signature.signedAt).toLocaleString("es-CO");
  return (
    <div>
      <span>
        {" "}
        {signature.signerName} · {signature.signerEmail} · {when}
        {signature.testMode ? " · prueba" : ""}
      </span>
      <span className={styles.googleId}>Google sub {signature.signerGoogleId}</span>
      {signature.imagePng && (
        <img src={signature.imagePng} alt={`Firma de ${signature.signerName}`} className={styles.preview} />
      )}
    </div>
  );
}
