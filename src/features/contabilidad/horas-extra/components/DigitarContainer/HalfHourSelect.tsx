"use client";

import { HALF_HOUR_OPTIONS } from "../../lib/timeFormat";
import styles from "./DigitarContainer.module.scss";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function HalfHourSelect({ value, onChange }: Props) {
  return (
    <select
      className={`${styles.cellInput} ${styles.timeSelect}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      {HALF_HOUR_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
