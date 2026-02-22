"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import styles from "./Input.module.scss";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({
  label,
  error,
  hint,
  id: idProp,
  className = "",
  disabled,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${styles.input} ${error ? styles.hasError : ""}`}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [error && `${inputId}-error`, hint && `${inputId}-hint`]
            .filter(Boolean)
            .join(" ") || undefined
        }
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
