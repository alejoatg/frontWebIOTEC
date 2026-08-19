import { isSundayOrHoliday } from "./colombiaHolidays";
import { formatClockTime, isHalfHourClock } from "./timeFormat";

/** Horario diurno Colombia (CST): 6:00 inclusive – 21:00 exclusive. */
const DIURNAL_START_MIN = 6 * 60;
const DIURNAL_END_MIN = 21 * 60;
const SLOT_MINUTES = 30;

export type SuggestedSupplementalHours = {
  hoursTsd: number;
  hoursTsn: number;
  hoursHedd: number;
  hoursHend: number;
};

function clockToMinutes(clock: string): number {
  const [hh, mm] = clock.split(":").map(Number);
  return hh * 60 + mm;
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isDiurnalMinute(minuteOfDay: number): boolean {
  return minuteOfDay >= DIURNAL_START_MIN && minuteOfDay < DIURNAL_END_MIN;
}

function roundHours(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Reparte la duración Inicio–Fin en TSD/TSN/HEDD/HEND según fecha y franjas diurna/nocturna.
 * RD, RN y Disponibilidad quedan fuera (digitación manual).
 */
export function suggestSupplementalCategoryHours(
  workDate: string,
  startTime: string,
  endTime: string,
): SuggestedSupplementalHours | null {
  const date = workDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!isHalfHourClock(startTime) || !isHalfHourClock(endTime)) return null;

  const startClock = formatClockTime(startTime);
  const endClock = formatClockTime(endTime);
  const startMin = clockToMinutes(startClock);
  const endMin = clockToMinutes(endClock);
  if (startMin === endMin) return null;

  let endDate = date;
  if (endMin <= startMin) {
    endDate = addDaysIso(date, 1);
  }

  let tsd = 0;
  let tsn = 0;
  let hedd = 0;
  let hend = 0;

  let cursorDate = date;
  let cursorMin = startMin;

  while (cursorDate < endDate || (cursorDate === endDate && cursorMin < endMin)) {
    const festive = isSundayOrHoliday(cursorDate);
    const diurnal = isDiurnalMinute(cursorMin);
    const slotHours = SLOT_MINUTES / 60;

    if (festive) {
      if (diurnal) hedd += slotHours;
      else hend += slotHours;
    } else if (diurnal) {
      tsd += slotHours;
    } else {
      tsn += slotHours;
    }

    cursorMin += SLOT_MINUTES;
    if (cursorMin >= 24 * 60) {
      cursorMin -= 24 * 60;
      cursorDate = addDaysIso(cursorDate, 1);
    }
  }

  return {
    hoursTsd: roundHours(tsd),
    hoursTsn: roundHours(tsn),
    hoursHedd: roundHours(hedd),
    hoursHend: roundHours(hend),
  };
}

export function formatSuggestedHours(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(value);
}

export function suggestedHoursToRowPatch(
  suggested: SuggestedSupplementalHours,
): Pick<
  {
    hoursRd: string;
    hoursRn: string;
    hoursTsd: string;
    hoursTsn: string;
    hoursHedd: string;
    hoursHend: string;
    hoursDisponibilidad: string;
  },
  "hoursTsd" | "hoursTsn" | "hoursHedd" | "hoursHend"
> {
  return {
    hoursTsd: formatSuggestedHours(suggested.hoursTsd),
    hoursTsn: formatSuggestedHours(suggested.hoursTsn),
    hoursHedd: formatSuggestedHours(suggested.hoursHedd),
    hoursHend: formatSuggestedHours(suggested.hoursHend),
  };
}
