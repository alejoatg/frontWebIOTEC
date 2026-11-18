import type { TmrRow } from "./api";
import { formatClock, formatSpan, wallDate } from "./jornada";

const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

export type TimelinePhase = "alist" | "desp" | "ser" | "tmr";

export const TIMELINE_PHASE_LABEL: Record<TimelinePhase, string> = {
  alist: "Alistamiento",
  desp: "Desplazamiento",
  ser: "Servicio",
  tmr: "TMR",
};

export interface TimelineSegment {
  kind: TimelinePhase;
  startMs: number;
  endMs: number;
}

export interface TimelineLane {
  id: string;
  index: number;
  label: string;
  jobSerial: string;
  startMs: number;
  endMs: number;
  segments: TimelineSegment[];
}

export interface TimelineOverlap {
  aId: string;
  bId: string;
  aIndex: number;
  bIndex: number;
  startMs: number;
  endMs: number;
}

export interface TimelineTick {
  ms: number;
  label: string;
}

export interface JornadaTimelineModel {
  fromMs: number;
  toMs: number;
  spanMs: number;
  ticks: TimelineTick[];
  lanes: TimelineLane[];
  overlaps: TimelineOverlap[];
  overlapMs: number;
}

function msOf(iso: string | null | undefined): number | null {
  const d = iso ? wallDate(iso) : null;
  return d ? d.getTime() : null;
}

function segment(kind: TimelinePhase, start: number | null, end: number | null): TimelineSegment | null {
  if (start == null || end == null || end <= start) return null;
  return { kind, startMs: start, endMs: end };
}

function laneFromOrder(row: TmrRow, index: number): TimelineLane | null {
  const start = msOf(row.startTime);
  const assigned = msOf(row.assignedAt);
  const enRoute = msOf(row.enRouteAt);
  const site = msOf(row.arrivedSiteAt);
  const done = msOf(row.completedAt) ?? msOf(row.closedAt);

  const segments = [
    segment("alist", assigned ?? start, enRoute),
    segment("desp", enRoute, site),
    segment("ser", site, done),
  ].filter((item): item is TimelineSegment => Boolean(item));

  if (!segments.length) {
    const fallback = segment("tmr", start ?? enRoute ?? assigned, done ?? site);
    if (fallback) segments.push(fallback);
  }
  if (!segments.length) return null;

  return {
    id: row.id,
    index,
    label: `Orden ${index + 1}`,
    jobSerial: row.jobSerial || row.caseSerial || String(index + 1),
    startMs: segments[0].startMs,
    endMs: segments[segments.length - 1].endMs,
    segments,
  };
}

function overlapMsTotal(overlaps: TimelineOverlap[]): number {
  if (!overlaps.length) return 0;
  const sorted = [...overlaps].sort((a, b) => a.startMs - b.startMs);
  let total = 0;
  let cursor = sorted[0].startMs;
  let end = sorted[0].endMs;
  for (const item of sorted.slice(1)) {
    if (item.startMs <= end) {
      end = Math.max(end, item.endMs);
      continue;
    }
    total += end - cursor;
    cursor = item.startMs;
    end = item.endMs;
  }
  total += end - cursor;
  return total;
}

function ticksFor(fromMs: number, toMs: number): TimelineTick[] {
  const span = toMs - fromMs;
  const step =
    span > 18 * HOUR_MS ? 2 * HOUR_MS : span < 3 * HOUR_MS ? 30 * MIN_MS : HOUR_MS;
  const first = Math.floor(fromMs / step) * step;
  const ticks: TimelineTick[] = [];
  for (let t = first; t <= toMs + 1; t += step) {
    if (t < fromMs - step / 4) continue;
    ticks.push({
      ms: t,
      label: formatClock(new Date(t).toISOString()),
    });
  }
  return ticks.length ? ticks : [{ ms: fromMs, label: formatClock(new Date(fromMs).toISOString()) }];
}

export function jornadaTimelineModel(ordenes: TmrRow[]): JornadaTimelineModel | null {
  const lanes = ordenes
    .map((row, index) => laneFromOrder(row, index))
    .filter((lane): lane is TimelineLane => Boolean(lane));
  if (!lanes.length) return null;

  const minStart = Math.min(...lanes.map((lane) => lane.startMs));
  const maxEnd = Math.max(...lanes.map((lane) => lane.endMs));
  const pad = Math.max(15 * MIN_MS, Math.round((maxEnd - minStart) * 0.04));
  const fromMs = minStart - pad;
  const toMs = Math.max(maxEnd + pad, fromMs + HOUR_MS);

  const overlaps: TimelineOverlap[] = [];
  for (let i = 0; i < lanes.length; i += 1) {
    for (let j = i + 1; j < lanes.length; j += 1) {
      const startMs = Math.max(lanes[i].startMs, lanes[j].startMs);
      const endMs = Math.min(lanes[i].endMs, lanes[j].endMs);
      if (endMs <= startMs) continue;
      overlaps.push({
        aId: lanes[i].id,
        bId: lanes[j].id,
        aIndex: lanes[i].index,
        bIndex: lanes[j].index,
        startMs,
        endMs,
      });
    }
  }

  return {
    fromMs,
    toMs,
    spanMs: toMs - fromMs,
    ticks: ticksFor(fromMs, toMs),
    lanes,
    overlaps,
    overlapMs: overlapMsTotal(overlaps),
  };
}

export function pctOnAxis(ms: number, model: JornadaTimelineModel): number {
  if (!model.spanMs) return 0;
  return ((ms - model.fromMs) / model.spanMs) * 100;
}

export function overlapCaption(overlap: TimelineOverlap): string {
  const minutes = Math.round((overlap.endMs - overlap.startMs) / MIN_MS);
  return `Orden ${overlap.aIndex + 1} y ${overlap.bIndex + 1}: ${formatClock(new Date(overlap.startMs).toISOString())}–${formatClock(new Date(overlap.endMs).toISOString())} (${formatSpan(minutes / 60)})`;
}
