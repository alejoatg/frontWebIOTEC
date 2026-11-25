import type { TmrRow } from "./api";
import { formatClock, formatSpan, formatTs, wallDate } from "./jornada";

const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;
const DAY_MS = 24 * HOUR_MS;
const COMPACT_DAY_WEIGHT = 1.75 * HOUR_MS;
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

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
  kind: "hour" | "day";
}

export interface TimelineAxisSpan {
  fromMs: number;
  toMs: number;
  weight: number;
  compact: boolean;
  label: string;
}

export interface JornadaTimelineModel {
  fromMs: number;
  toMs: number;
  spanMs: number;
  axisWeight: number;
  spans: TimelineAxisSpan[];
  ticks: TimelineTick[];
  lanes: TimelineLane[];
  overlaps: TimelineOverlap[];
  overlapMs: number;
  multiDay: boolean;
}

function msOf(iso: string | null | undefined): number | null {
  const d = iso ? wallDate(iso) : null;
  return d ? d.getTime() : null;
}

function segment(kind: TimelinePhase, start: number | null, end: number | null): TimelineSegment | null {
  if (start == null || end == null || end <= start) return null;
  return { kind, startMs: start, endMs: end };
}

export type TimelineMode = "completa" | "campo";

function laneFromOrder(row: TmrRow, index: number, mode: TimelineMode): TimelineLane | null {
  const start = msOf(row.startTime);
  const assigned = msOf(row.assignedAt);
  const enRoute = msOf(row.enRouteAt);
  const site = msOf(row.arrivedSiteAt);
  const done = msOf(row.completedAt) ?? msOf(row.closedAt);

  const segments =
    mode === "campo"
      ? [
          segment("desp", enRoute, site),
          segment("ser", site, done),
        ].filter((item): item is TimelineSegment => Boolean(item))
      : [
          segment("alist", assigned ?? start, enRoute),
          segment("desp", enRoute, site),
          segment("ser", site, done),
        ].filter((item): item is TimelineSegment => Boolean(item));

  if (!segments.length) {
    if (mode === "campo" && enRoute) {
      const end = done ?? site;
      segments.push({
        kind: "tmr",
        startMs: enRoute,
        endMs: end && end > enRoute ? end : enRoute + 5 * MIN_MS,
      });
    } else {
      const fallback = segment("tmr", start ?? enRoute ?? assigned, done ?? site);
      if (fallback) segments.push(fallback);
    }
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

function utcDayStart(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayLabel(ms: number): string {
  return `${DIAS_CORTOS[new Date(ms).getUTCDay()]} ${shortDate(ms)}`;
}

function hourStep(duration: number, multiDay: boolean): number {
  if (multiDay && duration >= 12 * HOUR_MS) return 3 * HOUR_MS;
  if (duration > 18 * HOUR_MS) return 2 * HOUR_MS;
  if (duration < 3 * HOUR_MS) return 30 * MIN_MS;
  return HOUR_MS;
}

function buildSpans(lanes: TimelineLane[], fromMs: number, toMs: number): TimelineAxisSpan[] {
  const firstDay = utcDayStart(fromMs);
  const lastDay = utcDayStart(toMs);
  const raw: TimelineAxisSpan[] = [];

  for (let dayMs = firstDay; dayMs <= lastDay; dayMs += DAY_MS) {
    const clipFrom = Math.max(fromMs, dayMs);
    const clipTo = Math.min(toMs, dayMs + DAY_MS);
    if (clipTo <= clipFrom) continue;
    const laneCount = lanes.filter((lane) => lane.startMs < clipTo && lane.endMs > clipFrom).length;
    if (!laneCount) continue;
    raw.push({
      fromMs: clipFrom,
      toMs: clipTo,
      weight: clipTo - clipFrom,
      compact: false,
      label: dayLabel(dayMs),
    });
  }

  const multiDay = raw.length > 1;
  const hasDense = raw.some((span) =>
    lanes.filter((lane) => lane.startMs < span.toMs && lane.endMs > span.fromMs).length >= 2,
  );

  const spans = raw.map((span, index) => {
    const laneCount = lanes.filter((lane) => lane.startMs < span.toMs && lane.endMs > span.fromMs).length;
    const interior = index > 0 && index < raw.length - 1;
    const compact = Boolean(multiDay && laneCount <= 1 && (hasDense || interior));
    return {
      ...span,
      compact,
      weight: compact ? COMPACT_DAY_WEIGHT : span.weight,
      label: compact ? shortDate(span.fromMs) : span.label,
    };
  });

  const detailWeight = spans.filter((span) => !span.compact).reduce((sum, span) => sum + span.weight, 0);
  const compactSpans = spans.filter((span) => span.compact);
  if (compactSpans.length && detailWeight) {
    const each = Math.min(COMPACT_DAY_WEIGHT, Math.max(HOUR_MS, (detailWeight * 0.85) / compactSpans.length));
    for (const span of compactSpans) span.weight = each;
  }

  return spans;
}

function ticksFor(spans: TimelineAxisSpan[]): TimelineTick[] {
  const ticks: TimelineTick[] = [];
  for (const span of spans) {
    ticks.push({ ms: span.fromMs, label: span.label, kind: "day" });
    if (span.compact) continue;
    const duration = span.toMs - span.fromMs;
    const step = hourStep(duration, spans.length > 1);
    const first = Math.ceil(span.fromMs / step) * step;
    for (let t = first; t < span.toMs - step * 0.2; t += step) {
      if (t - span.fromMs < step * 0.35) continue;
      ticks.push({
        ms: t,
        label: formatClock(new Date(t).toISOString()),
        kind: "hour",
      });
    }
  }
  return ticks;
}

export function jornadaTimelineModel(
  ordenes: TmrRow[],
  mode: TimelineMode = "completa",
): JornadaTimelineModel | null {
  const lanes = ordenes
    .map((row, index) => laneFromOrder(row, index, mode))
    .filter((lane): lane is TimelineLane => Boolean(lane));
  if (!lanes.length) return null;

  const minStart = Math.min(...lanes.map((lane) => lane.startMs));
  const maxEnd = Math.max(...lanes.map((lane) => lane.endMs));
  const pad = Math.max(15 * MIN_MS, Math.round((maxEnd - minStart) * 0.04));
  const fromMs = Math.max(utcDayStart(minStart), minStart - pad);
  const toMs = Math.min(utcDayStart(maxEnd) + DAY_MS, Math.max(maxEnd + pad, fromMs + HOUR_MS));

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

  const spans = buildSpans(lanes, fromMs, toMs);
  const axisFrom = spans[0]?.fromMs ?? fromMs;
  const axisTo = spans[spans.length - 1]?.toMs ?? toMs;
  const axisWeight = spans.reduce((sum, span) => sum + span.weight, 0) || axisTo - axisFrom;

  return {
    fromMs: axisFrom,
    toMs: axisTo,
    spanMs: axisTo - axisFrom,
    axisWeight,
    spans,
    ticks: ticksFor(spans),
    lanes,
    overlaps,
    overlapMs: overlapMsTotal(overlaps),
    multiDay: spans.length > 1,
  };
}

export function pctOnAxis(ms: number, model: JornadaTimelineModel): number {
  if (!model.axisWeight) return 0;
  const clamped = Math.min(model.toMs, Math.max(model.fromMs, ms));
  let acc = 0;
  for (const span of model.spans) {
    if (clamped <= span.toMs) {
      const duration = span.toMs - span.fromMs;
      const inner = duration ? ((clamped - span.fromMs) / duration) * span.weight : 0;
      return ((acc + inner) / model.axisWeight) * 100;
    }
    acc += span.weight;
  }
  return 100;
}

export function overlapCaption(overlap: TimelineOverlap): string {
  const minutes = Math.round((overlap.endMs - overlap.startMs) / MIN_MS);
  const sameDay = utcDayStart(overlap.startMs) === utcDayStart(overlap.endMs);
  const start = sameDay
    ? formatClock(new Date(overlap.startMs).toISOString())
    : formatTs(new Date(overlap.startMs).toISOString());
  const end = sameDay
    ? formatClock(new Date(overlap.endMs).toISOString())
    : formatTs(new Date(overlap.endMs).toISOString());
  return `Orden ${overlap.aIndex + 1} y ${overlap.bIndex + 1}: ${start}–${end} (${formatSpan(minutes / 60)})`;
}
