"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  fetchManualEmployees,
  type ManualEmployeeOption,
} from "../../api/overtimeApi";
import styles from "./EmployeeSuggestField.module.scss";

type Mode = "document" | "name";

interface Props {
  mode: Mode;
  value: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  onChange: (value: string) => void;
  onPick: (employee: ManualEmployeeOption) => void;
  onCommit: (value: string) => void;
}

export default function EmployeeSuggestField({
  mode,
  value,
  placeholder,
  inputMode,
  onChange,
  onPick,
  onCommit,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pickedRef = useRef(false);
  const requestIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<ManualEmployeeOption[]>([]);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  function updateCoords() {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 2,
      left: rect.left,
      width: Math.max(rect.width, 260),
    });
  }

  useEffect(() => {
    const q = value.trim();
    if (!open || q.length < 1) {
      setMatches([]);
      setLoading(false);
      return;
    }

    updateCoords();
    const requestId = ++requestIdRef.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void fetchManualEmployees(q)
        .then((list) => {
          if (requestId !== requestIdRef.current) return;
          setMatches(list);
          setHighlight(0);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setMatches([]);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false);
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (listRef.current && target && listRef.current.contains(target)) return;
      setOpen(false);
    };
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

  const showList =
    open &&
    value.trim().length >= 1 &&
    coords &&
    typeof document !== "undefined" &&
    (loading || matches.length > 0 || !loading);

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
          }, 160);
        }}
        onKeyDown={handleKeyDown}
      />
      {showList &&
        createPortal(
          <ul
            ref={listRef}
            className={styles.list}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            role="listbox"
          >
            {loading && matches.length === 0 && (
              <li className={styles.status}>Buscando…</li>
            )}
            {!loading && matches.length === 0 && (
              <li className={styles.status}>Sin coincidencias</li>
            )}
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
