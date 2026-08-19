"use client";

import styles from "./CatalogSelectField.module.scss";

interface Props {
  value: string;
  options: Array<{ key: string; value: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function CatalogSelectField({
  value,
  options,
  placeholder = "Seleccionar",
  onChange,
}: Props) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((item) => (
        <option key={item.key} value={item.value}>
          {item.value}
        </option>
      ))}
    </select>
  );
}
