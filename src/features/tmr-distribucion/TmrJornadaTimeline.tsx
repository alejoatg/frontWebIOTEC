"use client";

import { useMemo, type ReactNode } from "react";
import type { TmrRow } from "./api";
import {
  jornadaTimelineModel,
  overlapCaption,
  pctOnAxis,
  TIMELINE_PHASE_LABEL,
  type TimelineLane,
  type TimelineOverlap,
} from "./jornada-timeline";
import { formatClock, formatSpan } from "./jornada";
import styles from "./TmrJornadaTimeline.module.scss";

interface Props {
  ordenes: TmrRow[];
  currentId?: string;
  compact?: boolean;
  onOpenOrder?: (id: string) => void;
}

export default function TmrJornadaTimeline({ ordenes, currentId, compact, onOpenOrder }: Props) {
  const model = useMemo(() => jornadaTimelineModel(ordenes), [ordenes]);
  if (!model) return null;

  function styleFor(startMs: number, endMs: number) {
    const left = pctOnAxis(startMs, model!);
    const width = Math.max(0.7, pctOnAxis(endMs, model!) - left);
    return { left: `${left}%`, width: `${width}%` };
  }

  function overlapsFor(lane: TimelineLane): TimelineOverlap[] {
    return model.overlaps.filter((item) => item.aId === lane.id || item.bId === lane.id);
  }

  return (
    <div className={compact ? `${styles.wrap} ${styles.compact}` : styles.wrap}>
      <header className={styles.head}>
        <div>
          <h4>Línea de tiempo</h4>
          <p>
            Cada barra es una orden. Los tramos de color son alistamiento, desplazamiento y
            servicio. El sombreado marca solapes entre órdenes.
          </p>
        </div>
        <p className={model.overlaps.length ? styles.overlapStat : styles.okStat}>
          {model.overlaps.length
            ? `${model.overlaps.length} solape${model.overlaps.length === 1 ? "" : "s"} · ${formatSpan(model.overlapMs / 3_600_000)}`
            : "Sin solapes"}
        </p>
      </header>

      <div className={styles.chart} role="img" aria-label="Línea de tiempo de la jornada">
        <div className={styles.axisSpacer} />
        <div className={styles.axis}>
          {model.ticks.map((tick) => (
            <span
              key={tick.ms}
              className={styles.tick}
              style={{ left: `${pctOnAxis(tick.ms, model)}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        {model.lanes.map((lane) => {
          const current = lane.id === currentId;
          const laneOverlaps = overlapsFor(lane);
          return (
            <LaneRow
              key={lane.id}
              label={lane.label}
              jobSerial={lane.jobSerial}
              current={current}
              clickable={Boolean(onOpenOrder)}
              onClick={onOpenOrder ? () => onOpenOrder(lane.id) : undefined}
            >
              {model.ticks.map((tick) => (
                <span
                  key={`${lane.id}-${tick.ms}`}
                  className={styles.grid}
                  style={{ left: `${pctOnAxis(tick.ms, model)}%` }}
                />
              ))}
              {lane.segments.map((seg) => (
                <span
                  key={`${lane.id}-${seg.kind}-${seg.startMs}`}
                  className={`${styles.bar} ${styles[seg.kind]}`}
                  style={styleFor(seg.startMs, seg.endMs)}
                  title={`${lane.label} · ${TIMELINE_PHASE_LABEL[seg.kind]} ${formatClock(new Date(seg.startMs).toISOString())}–${formatClock(new Date(seg.endMs).toISOString())}`}
                />
              ))}
              {laneOverlaps.map((overlap) => (
                <span
                  key={`${lane.id}-ov-${overlap.aId}-${overlap.bId}-${overlap.startMs}`}
                  className={styles.overlap}
                  style={styleFor(overlap.startMs, overlap.endMs)}
                  title={overlapCaption(overlap)}
                />
              ))}
            </LaneRow>
          );
        })}

        {model.overlaps.length ? (
          <LaneRow label="Solapes" jobSerial="" current={false}>
            {model.ticks.map((tick) => (
              <span
                key={`ov-${tick.ms}`}
                className={styles.grid}
                style={{ left: `${pctOnAxis(tick.ms, model)}%` }}
              />
            ))}
            {model.overlaps.map((overlap) => (
              <span
                key={`band-${overlap.aId}-${overlap.bId}-${overlap.startMs}`}
                className={styles.overlapBand}
                style={styleFor(overlap.startMs, overlap.endMs)}
                title={overlapCaption(overlap)}
              />
            ))}
          </LaneRow>
        ) : null}
      </div>

      <ul className={styles.legend}>
        <li>
          <span className={`${styles.swatch} ${styles.alist}`} />
          Alistamiento
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.desp}`} />
          Desplazamiento
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.ser}`} />
          Servicio
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.overlapSwatch}`} />
          Solape
        </li>
      </ul>

      {model.overlaps.length ? (
        <ul className={styles.overlapList}>
          {model.overlaps.map((overlap) => (
            <li key={`${overlap.aId}-${overlap.bId}-${overlap.startMs}`}>
              {overlapCaption(overlap)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LaneRow({
  label,
  jobSerial,
  current,
  clickable,
  onClick,
  children,
}: {
  label: string;
  jobSerial: string;
  current: boolean;
  clickable?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = `${styles.track} ${current ? styles.trackOn : ""} ${clickable ? styles.trackBtn : ""}`;
  return (
    <>
      <div className={current ? `${styles.label} ${styles.labelOn}` : styles.label}>
        <strong>{label}</strong>
        {jobSerial ? <span>{jobSerial}</span> : null}
      </div>
      {clickable ? (
        <button type="button" className={className} onClick={onClick}>
          {children}
        </button>
      ) : (
        <div className={className}>{children}</div>
      )}
    </>
  );
}
