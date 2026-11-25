"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Flag,
  MapPin,
  Navigation,
  UserPlus,
} from "lucide-react";
import type { TmrRow } from "./api";
import {
  crewDayStats,
  crewMonths,
  crewsGroupedByNucleo,
  formatClock,
  formatSpan,
  formatSpanShort,
  formatTs,
  jornadaRows,
  jornadaTotals,
  nucleoDayCrews,
  nucleoDayRows,
  nucleoDayStats,
  nucleoMonths,
  nucleosWithDays,
  possibleExclusionReason,
  TMR_ALERT_H,
  TMR_WATCH_H,
  type JornadaDayStat,
} from "./jornada";
import { calendarCells, monthLabel } from "./mensual";
import TmrJornadaTimeline from "./TmrJornadaTimeline";
import styles from "./TmrJornada.module.scss";

const WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TIMES = [
  { key: "startTime", label: "Start", icon: Flag },
  { key: "assignedAt", label: "Asignación", icon: UserPlus },
  { key: "enRouteAt", label: "En ruta", icon: Navigation },
  { key: "arrivedSiteAt", label: "En sitio", icon: MapPin },
  { key: "completedAt", label: "Completado", icon: CheckCircle2 },
] as const;

interface Props {
  rows: TmrRow[];
  onOpen?: (row: TmrRow) => void;
}

function municipiosLabel(names: string[]): string {
  if (!names.length) return "";
  if (names.length <= 2) return names.join(" · ");
  return `${names[0]} · ${names[1]} +${names.length - 2}`;
}

export default function TmrJornada({ rows, onOpen }: Props) {
  const groups = useMemo(() => crewsGroupedByNucleo(rows), [rows]);
  const nucleos = useMemo(() => nucleosWithDays(rows), [rows]);
  const allCrews = useMemo(() => groups.flatMap((group) => group.crews), [groups]);
  const [crew, setCrew] = useState(allCrews[0]?.crew ?? "");
  const selectedCrew = allCrews.find((item) => item.crew === crew) ?? allCrews[0];
  const months = useMemo(
    () => (selectedCrew ? crewMonths(rows, selectedCrew.crew) : []),
    [rows, selectedCrew],
  );
  const [month, setMonth] = useState(months[0] ?? "");
  const monthSafe = months.includes(month) ? month : (months[0] ?? "");
  const stats = useMemo(
    () => (selectedCrew && monthSafe ? crewDayStats(rows, selectedCrew.crew, monthSafe) : {}),
    [rows, selectedCrew, monthSafe],
  );
  const cells = useMemo(() => (monthSafe ? calendarCells(monthSafe) : []), [monthSafe]);
  const [day, setDay] = useState(selectedCrew?.days[0]?.key ?? "");
  const workDays = Object.keys(stats).sort();
  const daySafe =
    day && monthSafe && day.startsWith(`${monthSafe}-`)
      ? day
      : (workDays[0] ?? "");
  const items = useMemo(
    () => (selectedCrew && daySafe ? jornadaRows(rows, selectedCrew.crew, daySafe) : []),
    [rows, selectedCrew, daySafe],
  );
  const totals = jornadaTotals(items);
  const dayStat = stats[daySafe];

  const [nucleo, setNucleo] = useState(selectedCrew?.nucleo || nucleos[0]?.nucleo || "");
  const selectedNucleo = nucleos.find((item) => item.nucleo === nucleo) ?? nucleos[0];
  const nucleoMonthOptions = useMemo(
    () => (selectedNucleo ? nucleoMonths(rows, selectedNucleo.nucleo) : []),
    [rows, selectedNucleo],
  );
  const [nucleoMonth, setNucleoMonth] = useState(nucleoMonthOptions[0] ?? "");
  const nucleoMonthSafe = nucleoMonthOptions.includes(nucleoMonth)
    ? nucleoMonth
    : (nucleoMonthOptions[0] ?? "");
  const nucleoStats = useMemo(
    () =>
      selectedNucleo && nucleoMonthSafe
        ? nucleoDayStats(rows, selectedNucleo.nucleo, nucleoMonthSafe)
        : {},
    [rows, selectedNucleo, nucleoMonthSafe],
  );
  const nucleoCells = useMemo(
    () => (nucleoMonthSafe ? calendarCells(nucleoMonthSafe) : []),
    [nucleoMonthSafe],
  );
  const [nucleoDay, setNucleoDay] = useState(selectedNucleo?.days[0]?.key ?? "");
  const nucleoWorkDays = Object.keys(nucleoStats).sort();
  const nucleoDaySafe =
    nucleoDay && nucleoMonthSafe && nucleoDay.startsWith(`${nucleoMonthSafe}-`)
      ? nucleoDay
      : (nucleoWorkDays[0] ?? "");
  const nucleoItems = useMemo(
    () =>
      selectedNucleo && nucleoDaySafe
        ? nucleoDayRows(rows, selectedNucleo.nucleo, nucleoDaySafe)
        : [],
    [rows, selectedNucleo, nucleoDaySafe],
  );
  const nucleoTotals = jornadaTotals(nucleoItems);
  const nucleoDayStat = nucleoStats[nucleoDaySafe];
  const nucleoCrews = nucleoDayCrews(nucleoItems);

  function selectCrew(next: (typeof allCrews)[number]) {
    setCrew(next.crew);
    const nextMonths = crewMonths(rows, next.crew);
    setMonth(nextMonths[0] ?? "");
    setDay(next.days[0]?.key ?? "");
    setNucleo(next.nucleo);
    const nextNucleoMonths = nucleoMonths(rows, next.nucleo);
    setNucleoMonth(nextNucleoMonths[0] ?? "");
    setNucleoDay(next.days[0]?.key ?? "");
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        El calendario de la brigada muestra actividades, desplazamiento, ejecución y TMR
        UTEN medio (verde ≤ {TMR_WATCH_H} h, ámbar si hay TMR altos, rojo si el promedio supera{" "}
        {TMR_ALERT_H} h o hay 2 o más R{">"}8). Las brigadas van agrupadas por núcleo y
        municipio. Abajo está el mismo mes agrupado por núcleo.
      </p>
      <div className={styles.pickers}>
        <div className={styles.list}>
          <h3>Núcleos · brigadas</h3>
          <div className={styles.tree}>
            {groups.map((group) => (
              <div key={group.nucleo} className={styles.group}>
                <p>{group.nucleo}</p>
                <ul>
                  {group.crews.map((item) => (
                    <li key={item.crew}>
                      <button
                        type="button"
                        className={item.crew === selectedCrew?.crew ? styles.on : undefined}
                        onClick={() => selectCrew(item)}
                      >
                        <span className={styles.crewLine}>
                          <strong>{item.crew}</strong>
                          <em>{municipiosLabel(item.municipios)}</em>
                        </span>
                        <span>
                          {item.days.length} día{item.days.length === 1 ? "" : "s"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <JornadaCalendario
          title="Calendario de la brigada"
          months={months}
          month={monthSafe}
          cells={cells}
          stats={stats}
          selectedDay={daySafe}
          onMonth={(value) => {
            setMonth(value);
            setDay("");
          }}
          onDay={setDay}
        />
      </div>

      {selectedCrew && daySafe ? (
        <>
          <div className={styles.summary}>
            <div>
              <strong>{totals.count}</strong>
              Actividades
            </div>
            <div>
              <strong>{formatClock(totals.inicio)}</strong>
              Inicio jornada (primer desplazamiento)
              <small>{formatTs(totals.inicio)}</small>
            </div>
            <div>
              <strong>{formatClock(totals.fin)}</strong>
              Fin jornada (último cierre)
              <small>{formatTs(totals.fin)}</small>
            </div>
            <div>
              <strong>{formatSpan(totals.desp)}</strong>
              Tiempo en desplazamiento
            </div>
            <div>
              <strong>{formatSpan(totals.ser)}</strong>
              Tiempo en servicio
            </div>
            <div>
              <strong>{formatSpan(totals.trabajo)}</strong>
              Jornada (primer desplazamiento → último cierre)
            </div>
            <div>
              <strong>{formatClock(totals.ultimaAccion)}</strong>
              Última acción
              <small>{formatTs(totals.ultimaAccion)}</small>
            </div>
            <div>
              <strong>{formatSpan(totals.tmrUten)}</strong>
              Suma TMR UTEN
            </div>
            <div>
              <strong>{totals.sobre}</strong>
              Con sobreasignación
            </div>
            <div>
              <strong>{dayStat ? `${dayStat.count}` : "0"}</strong>
              Actividades en el día
            </div>
            <div>
              <strong>{dayStat?.tmrMedio != null ? `${dayStat.tmrMedio.toFixed(1)} h` : "—"}</strong>
              TMR UTEN medio del día
            </div>
          </div>

          <ol className={styles.bitacora}>
            {items.map((row, index) => (
              <JornadaCard key={row.id} row={row} index={index} onOpen={onOpen} />
            ))}
          </ol>

          <TmrJornadaTimeline
            ordenes={items}
            onOpenOrder={onOpen ? (id) => {
              const row = items.find((item) => item.id === id);
              if (row) onOpen(row);
            } : undefined}
          />
          <TmrJornadaTimeline
            mode="campo"
            ordenes={items}
            onOpenOrder={onOpen ? (id) => {
              const row = items.find((item) => item.id === id);
              if (row) onOpen(row);
            } : undefined}
          />
        </>
      ) : (
        <p className={styles.hint}>No hay actividades para esa brigada y día.</p>
      )}

      <section className={styles.nucleoBlock}>
        <h3>Calendario por núcleo</h3>
        <p className={styles.hint}>
          Agrupa el trabajo de todas las brigadas del núcleo. Cada día muestra actividades,
          tiempo de desplazamiento y tiempo de ejecución.
        </p>
        <div className={styles.pickers}>
          <div className={styles.list}>
            <h3>Núcleos</h3>
            <ul>
              {nucleos.map((item) => (
                <li key={item.nucleo}>
                  <button
                    type="button"
                    className={item.nucleo === selectedNucleo?.nucleo ? styles.on : undefined}
                    onClick={() => {
                      setNucleo(item.nucleo);
                      const nextMonths = nucleoMonths(rows, item.nucleo);
                      setNucleoMonth(nextMonths[0] ?? "");
                      setNucleoDay(item.days[0]?.key ?? "");
                    }}
                  >
                    <strong>{item.nucleo}</strong>
                    <span>
                      {item.crews} brig. · {item.days.length} día{item.days.length === 1 ? "" : "s"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <JornadaCalendario
            title="Trabajo del núcleo"
            months={nucleoMonthOptions}
            month={nucleoMonthSafe}
            cells={nucleoCells}
            stats={nucleoStats}
            selectedDay={nucleoDaySafe}
            onMonth={(value) => {
              setNucleoMonth(value);
              setNucleoDay("");
            }}
            onDay={setNucleoDay}
          />
        </div>
        {selectedNucleo && nucleoDaySafe && nucleoItems.length ? (
          <>
            <div className={styles.summary}>
              <div>
                <strong>{nucleoTotals.count}</strong>
                Actividades del núcleo
              </div>
              <div>
                <strong>{formatSpan(nucleoDayStat?.desp ?? nucleoTotals.desp)}</strong>
                Tiempo desplazamiento
              </div>
              <div>
                <strong>{formatSpan(nucleoDayStat?.ejec ?? nucleoTotals.ser)}</strong>
                Tiempo ejecución total
              </div>
              <div>
                <strong>
                  {nucleoDayStat?.despMedio != null ? formatSpanShort(nucleoDayStat.despMedio) : "—"}
                </strong>
                Desplazamiento medio
              </div>
              <div>
                <strong>
                  {nucleoDayStat?.ejecMedio != null ? formatSpanShort(nucleoDayStat.ejecMedio) : "—"}
                </strong>
                Ejecución media
              </div>
              <div>
                <strong>
                  {nucleoDayStat?.tmrMedio != null ? `${nucleoDayStat.tmrMedio.toFixed(1)} h` : "—"}
                </strong>
                TMR UTEN medio
              </div>
            </div>
            <ul className={styles.nucleoCrews}>
              {nucleoCrews.map((item) => (
                <li key={item.crew}>
                  <button
                    type="button"
                    onClick={() => {
                      const found = allCrews.find((crewItem) => crewItem.crew === item.crew);
                      if (found) {
                        selectCrew(found);
                        setDay(nucleoDaySafe);
                      }
                    }}
                  >
                    <strong>{item.crew}</strong>
                    <span>
                      {item.count} act. · desp {formatSpanShort(item.desp)} · ejec{" "}
                      {formatSpanShort(item.ejec)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.hint}>No hay actividades para ese núcleo y día.</p>
        )}
      </section>
    </div>
  );
}

function JornadaCalendario({
  title,
  months,
  month,
  cells,
  stats,
  selectedDay,
  onMonth,
  onDay,
}: {
  title: string;
  months: string[];
  month: string;
  cells: Array<{ day: number; key: string } | null>;
  stats: Record<string, JornadaDayStat>;
  selectedDay: string;
  onMonth: (month: string) => void;
  onDay: (day: string) => void;
}) {
  return (
    <div className={styles.calWrap}>
      <div className={styles.calBar}>
        <h3>{title}</h3>
        {months.length > 1 ? (
          <select value={month} onChange={(e) => onMonth(e.target.value)}>
            {months.map((item) => (
              <option key={item} value={item}>
                {monthLabel(item)}
              </option>
            ))}
          </select>
        ) : (
          <span>{month ? monthLabel(month) : ""}</span>
        )}
      </div>
      <div className={styles.calHead}>
        {WEEK.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className={styles.cal}>
        {cells.map((cell, index) => {
          if (!cell) return <div key={`e-${index}`} className={styles.empty} />;
          const stat = stats[cell.key];
          const tone =
            stat?.tone === "alert"
              ? styles.alert
              : stat?.tone === "watch"
                ? styles.watch
                : stat?.tone === "ok"
                  ? styles.ok
                  : styles.idle;
          return (
            <button
              key={cell.key}
              type="button"
              className={`${tone} ${selectedDay === cell.key ? styles.dayOn : ""}`}
              onClick={() => onDay(cell.key)}
            >
              <span>{cell.day}</span>
              {stat ? (
                <>
                  <strong>{stat.count} act.</strong>
                  <small>desp {formatSpanShort(stat.desp)}</small>
                  <small>ejec {formatSpanShort(stat.ejec)}</small>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span className={styles.ok}>TMR medio ≤ {TMR_WATCH_H} h</span>
        <span className={styles.watch}>TMR alto o promedio &gt; {TMR_WATCH_H} h</span>
        <span className={styles.alert}>Promedio &gt; {TMR_ALERT_H} h o 2+ R{">"}8</span>
      </div>
    </div>
  );
}

function JornadaCard({
  row,
  index,
  onOpen,
}: {
  row: TmrRow;
  index: number;
  onOpen?: (row: TmrRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const exclusionReason = possibleExclusionReason(row);
  return (
    <li
      className={onOpen ? `${styles.card} ${styles.clickCard}` : styles.card}
      onClick={onOpen ? () => onOpen(row) : undefined}
    >
      <header>
        <span className={styles.seq}>{index + 1}</span>
        <div>
          <h4>
            Actividad {index + 1} · orden {row.caseSerial || row.jobSerial}
          </h4>
          <p>
            {row.municipality || "Sin municipio"}
            {row.ubicacion ? ` · ${row.ubicacion}` : ""}
            {row.exclusion ? ` · ${row.exclusion}` : ""}
          </p>
        </div>
        <button
          type="button"
          className={styles.more}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          {open ? "Ocultar" : "Ampliar"}
        </button>
      </header>

      <p className={styles.snip}>
        <strong>Actividad desarrollada. </strong>
        {row.workType || "—"}
      </p>
      <p className={styles.snip}>
        <strong>Observación. </strong>
        {row.observacion || "—"}
      </p>

      <div className={styles.times}>
        {TIMES.map((item) => {
          const Icon = item.icon;
          const value = row[item.key];
          return (
            <div key={item.key} className={value ? styles.time : styles.timeEmpty}>
              <Icon size={16} aria-hidden />
              <span>{item.label}</span>
              <strong>{formatClock(value)}</strong>
              <small>{formatTs(value)}</small>
            </div>
          );
        })}
      </div>

      <dl className={styles.spans}>
        <div>
          <dt>Alistamiento</dt>
          <dd>{formatSpan(row.tmrAlist)}</dd>
        </div>
        <div>
          <dt>Desplazamiento</dt>
          <dd>{formatSpan(row.tmrDesp)}</dd>
        </div>
        <div>
          <dt>Servicio</dt>
          <dd>{formatSpan(row.tmrSer)}</dd>
        </div>
        <div>
          <dt>TMR CEO</dt>
          <dd>{formatSpan(row.tmrDuracion)}</dd>
        </div>
        <div>
          <dt>TMR UTEN</dt>
          <dd>{formatSpan(row.tmrDuracionUten)}</dd>
        </div>
      </dl>
      {exclusionReason ? (
        <p className={styles.reason}>
          <strong>Posible exclusión. </strong>
          {exclusionReason}
        </p>
      ) : null}

      {open ? (
        <div className={styles.extra}>
          <p>
            <strong>Reporte causa usuario. </strong>
            {row.caseDescription || row.cause || "—"}
            {row.caseDescription && row.cause ? ` · ${row.cause}` : ""}
          </p>
          <p>
            <strong>Trabajo realizado. </strong>
            {row.workType || "—"}
            {row.ticketDescription ? ` — ${row.ticketDescription}` : ""}
          </p>
          <p>
            <strong>Notas de la brigada. </strong>
            {row.jobComment || "—"}
          </p>
        </div>
      ) : null}
    </li>
  );
}
