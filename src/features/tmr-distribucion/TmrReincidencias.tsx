"use client";

import { useMemo, useState } from "react";
import type { TmrRow } from "./api";
import { formatTs } from "./jornada";
import {
  buildReincidencias,
  RECIDIVA_LABEL,
  recidivaResumen,
  type RecidivaTipo,
} from "./reincidencias";
import styles from "./TmrReincidencias.module.scss";

const TIPOS: Array<RecidivaTipo | ""> = ["", "reiterativa", "reincidencia", "relacionados", "unico"];

function top(list: { name: string; count: number }[], n = 2): string {
  return list
    .slice(0, n)
    .map((item) => `${item.name} (${item.count})`)
    .join(" · ") || "—";
}

interface Props {
  rows: TmrRow[];
}

export default function TmrReincidencias({ rows }: Props) {
  const groups = useMemo(() => buildReincidencias(rows), [rows]);
  const [tipo, setTipo] = useState<RecidivaTipo | "">("reincidencia");
  const [minEventos, setMinEventos] = useState(2);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((item) => {
      if (tipo === "reincidencia") {
        if (item.tipo !== "reincidencia" && item.tipo !== "reiterativa") return false;
      } else if (tipo && item.tipo !== tipo) return false;
      if (item.eventos < minEventos) return false;
      if (!q) return true;
      return `${item.circuitCode} ${item.location} ${item.causes.map((c) => c.name).join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [groups, tipo, minEventos, query]);

  const resumen = recidivaResumen(groups);

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Un elemento de red es Circuito + Location. Si hay varios jobs del mismo caso o ticket,
        son <strong>relacionados</strong> (una sola salida). Si el mismo elemento falla en
        casos distintos, es <strong>reincidencia</strong>; si ocurre 3 o más veces en días
        diferentes, <strong>reiterativa</strong>.
      </p>

      <div className={styles.stats}>
        <div>
          <strong>{resumen.reincidencias}</strong>
          Elementos con reincidencia
        </div>
        <div>
          <strong>{resumen.reiterativas}</strong>
          Reiterativos (3+ veces)
        </div>
        <div>
          <strong>{resumen.relacionados}</strong>
          Solo relacionados
        </div>
        <div>
          <strong>{resumen.elementos}</strong>
          Elementos en el mes
        </div>
      </div>

      <div className={styles.filters}>
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value as RecidivaTipo | "")}>
            <option value="">Todos</option>
            {TIPOS.filter(Boolean).map((item) => (
              <option key={item} value={item}>
                {RECIDIVA_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mínimo de veces
          <select value={minEventos} onChange={(e) => setMinEventos(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <label>
          Buscar
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Circuito, location, causa…"
          />
        </label>
      </div>

      <p className={styles.hint}>{filtered.length} elementos.</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Circuito</th>
              <th>Location</th>
              <th>Veces</th>
              <th>Días</th>
              <th>Jobs</th>
              <th>Tipo</th>
              <th>Work Type</th>
              <th>Cause</th>
              <th>Device Cause</th>
              <th>Weather Cause</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <FragmentRow
                key={item.key}
                item={item}
                open={open === item.key}
                onToggle={() => setOpen(open === item.key ? null : item.key)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  item,
  open,
  onToggle,
}: {
  item: ReturnType<typeof buildReincidencias>[number];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className={open ? styles.rowOn : undefined} onClick={onToggle}>
        <td>{item.circuitCode}</td>
        <td>{item.location}</td>
        <td>{item.eventos}</td>
        <td>{item.dias}</td>
        <td>{item.jobs}</td>
        <td>
          <span className={styles[item.tipo]}>{RECIDIVA_LABEL[item.tipo]}</span>
        </td>
        <td>{top(item.workTypes)}</td>
        <td>{top(item.causes)}</td>
        <td>{top(item.deviceCauses)}</td>
        <td>{top(item.weatherCauses)}</td>
      </tr>
      {open ? (
        <tr className={styles.detail}>
          <td colSpan={10}>
            <p>
              {item.jobs} jobs · {item.casos} casos · {item.tickets || "—"} tickets · se fue{" "}
              {item.eventos} vez{item.eventos === 1 ? "" : "es"} en {item.dias} día
              {item.dias === 1 ? "" : "s"}.
            </p>
            <ul>
              {item.rows.map((row) => (
                <li key={row.id}>
                  <strong>{formatTs(row.startTime)}</strong>
                  <span>caso {row.caseSerial || "—"}</span>
                  <span>ticket {row.ticketSerial || "—"}</span>
                  <span>{row.workType || "sin work type"}</span>
                  <span>{row.cause || "sin cause"}</span>
                  {row.deviceCause ? <span>dispositivo: {row.deviceCause}</span> : null}
                  {row.weatherCause ? <span>clima: {row.weatherCause}</span> : null}
                  {row.caseDescription ? <em>{row.caseDescription}</em> : null}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}
