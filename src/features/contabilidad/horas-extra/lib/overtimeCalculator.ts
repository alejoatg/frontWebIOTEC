/** Réplica ligera de `api/src/overtime/overtime-calculator.ts` para vista previa en UI. */

const CATEGORY_CODES = [
  "RD",
  "RN",
  "TSD",
  "TSN",
  "HEDD",
  "HEND",
  "DISPONIBILIDAD",
] as const;

type CategoryCode = (typeof CATEGORY_CODES)[number];
export type CategoryHours = Record<CategoryCode, number>;

const CATEGORIES: Record<CategoryCode, { multiplier: number; postMultiplier: number }> = {
  RD: { multiplier: 0.8, postMultiplier: 1 },
  RN: { multiplier: 0.35, postMultiplier: 1 },
  TSD: { multiplier: 1.25, postMultiplier: 1 },
  TSN: { multiplier: 1.75, postMultiplier: 1 },
  HEDD: { multiplier: 2.05, postMultiplier: 1 },
  HEND: { multiplier: 2.55, postMultiplier: 1 },
  DISPONIBILIDAD: { multiplier: 2.05, postMultiplier: 0.2 },
};

function roundExcel(value: number): number {
  return Math.round((value + Number.EPSILON) * 1) / 1;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeAmounts(
  hours: CategoryHours,
  monthlySalary: number,
  payrollFactor: number,
  divisor: number,
) {
  const vh = divisor ? monthlySalary / divisor : 0;
  let subtotal = 0;
  const amounts = {} as Record<CategoryCode, number>;

  for (const code of CATEGORY_CODES) {
    const def = CATEGORIES[code];
    const h = hours[code] ?? 0;
    const base = roundExcel(vh * def.multiplier * h);
    const amount = roundExcel(base * def.postMultiplier);
    amounts[code] = amount;
    subtotal += amount;
  }

  return { amounts, subtotal: round2(subtotal), total: round2(subtotal * payrollFactor) };
}

export function sumCategoryHours(hours: CategoryHours): number {
  return CATEGORY_CODES.reduce((acc, code) => acc + (hours[code] ?? 0), 0);
}

export function calcStartEndHours(startTime: string, endTime: string): number | null {
  const parse = (hhmm: string) => {
    const s = hhmm.replace(/\D/g, "").padStart(4, "0");
    return Number(s.slice(0, 2)) * 60 + Number(s.slice(2, 4));
  };
  if (!startTime || !endTime) return null;
  let diff = (parse(endTime) - parse(startTime)) / 60;
  if (diff < 0) diff += 24;
  return Math.round(diff * 10000) / 10000;
}

export const HOURS_COHERENCE_TOLERANCE = 0.02;
