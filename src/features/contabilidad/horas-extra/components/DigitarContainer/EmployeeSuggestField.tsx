"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { ManualEmployeeOption } from "../../api/overtimeApi";
import styles from "./EmployeeSuggestField.module.scss";

type Mode = "document" | "name";

interface Props {
  mode: Mode;
  value: string;
  employees: ManualEmployeeOption[];
  placeholder?: string;
  inputMode?: "numeric" | "text";
  onChange: (value: string) => void;
  onPick: (employee: ManualEmployeeOption) => void;
  onCommit: (value: string) => void;
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function EmployeeSuggestField({
  mode,
  value,
  employees,
  placeholder,
  inputMode,
  onChange,
  onPick,
  onCommit,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pickedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const matches = useMemo(() => {
    const q = normalize(value);
    if (q.length < 2) return [];
    const list = employees.filter((e) => {
      if (mode === "document") {
        return e.documentNumber.includes(q.replace(/\D/g, "") || q);
      }
      return normalize(e.fullName).includes(q);
    });
    return list.slice(0, 12);
  }, [employees, mode, value]);

  function updateCoords() {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 220) });
  }

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function pick(emp: ManualEmployeeOption) {
    pickedRef.current = true;
    onPick(emp);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) {
      if (e.key === "Enter") onCommit(value);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[highlight] ?? matches[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && matches.length > 0 && coords && typeof document !== "undefined";

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        className={`${styles.input} ${mode === "name" ? styles.inputName : ""}`}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => {
          updateCoords();
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            if (pickedRef.current) {
              pickedRef.current = false;
              return;
            }
            onCommit(value);
          }, 120);
        }}
        onKeyDown={handleKeyDown}
      />
      {showList &&
        createPortal(
          <ul
            className={styles.list}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            role="listbox"
          >
            {matches.map((emp, i) => (
              <li key={emp.employeeId}>
                <button
                  type="button"
                  className={i === highlight ? styles.optionActive : styles.option}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(emp)}
                >
                  <span className={styles.doc}>{emp.documentNumber}</span>
                  <span className={styles.name}>{emp.fullName}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
