/**
 * Festivos de Colombia (Ley Emiliani) para clasificar TS dominical/festivo.
 * Domingo siempre cuenta como no hábil; además se consulta el calendario por año.
 */

const holidayCache = new Map<number, Set<string>>();

function isoDateUtc(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). */
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Traslada al lunes siguiente (Ley Emiliani), salvo que ya sea lunes. */
function toEmilianiMonday(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  const dow = d.getUTCDay();
  if (dow === 1) return isoDate;
  const add = dow === 0 ? 1 : 8 - dow;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

function buildHolidaySet(year: number): Set<string> {
  const set = new Set<string>();

  const fixed = [
    [1, 1],
    [5, 1],
    [7, 20],
    [8, 7],
    [12, 8],
    [12, 25],
  ] as const;
  for (const [m, d] of fixed) {
    set.add(isoDateUtc(year, m, d));
  }

  const emilianiFixed = [
    [1, 6],
    [3, 19],
    [6, 29],
    [8, 15],
    [10, 12],
    [11, 1],
    [11, 11],
  ] as const;
  for (const [m, d] of emilianiFixed) {
    set.add(toEmilianiMonday(isoDateUtc(year, m, d)));
  }

  const easter = easterSunday(year);
  const easterIso = isoDateUtc(year, easter.month, easter.day);
  set.add(addDaysIso(easterIso, -3));
  set.add(addDaysIso(easterIso, -2));
  set.add(toEmilianiMonday(addDaysIso(easterIso, 43)));
  set.add(toEmilianiMonday(addDaysIso(easterIso, 64)));
  set.add(toEmilianiMonday(addDaysIso(easterIso, 71)));

  return set;
}

function holidaysForYear(year: number): Set<string> {
  let cached = holidayCache.get(year);
  if (!cached) {
    cached = buildHolidaySet(year);
    holidayCache.set(year, cached);
  }
  return cached;
}

export function isSunday(isoDate: string): boolean {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  return d.getUTCDay() === 0;
}

export function isColombiaHoliday(isoDate: string): boolean {
  const year = Number(isoDate.slice(0, 4));
  if (!Number.isFinite(year)) return false;
  return holidaysForYear(year).has(isoDate);
}

/** Domingo o festivo oficial en Colombia. */
export function isSundayOrHoliday(isoDate: string): boolean {
  return isSunday(isoDate) || isColombiaHoliday(isoDate);
}
