"use client";

import { formatClockTime, HALF_HOUR_OPTIONS } from "../../lib/timeFormat";
import styles from "./DigitarContainer.module.scss";

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Hora en reloj HH:MM. Acepta 0630, 06:30 y 06:30:00. */
export function selectClock(value: string): string {
  const formatted = formatClockTime(value);
  if (formatted === "24:00" || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formatted)) {
    return formatted;
  }
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour === 24 && minute === 0) return "24:00";
  if (hour > 23 || minute > 59) return "";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function optionsFor(clock: string): string[] {
  if (!clock || HALF_HOUR_OPTIONS.includes(clock)) return HALF_HOUR_OPTIONS;
  return [...HALF_HOUR_OPTIONS, clock].sort((a, b) => a.localeCompare(b));
}

export default function HalfHourSelect({ id, value, onChange, className }: Props) {
  const clock = selectClock(value);
  const options = optionsFor(clock);

  return (
    <select
      id={id}
      className={className ?? `${styles.cellInput} ${styles.timeSelect}`}
      value={clock}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
