"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { CatalogItemOption } from "@/features/catalogs/types";
import styles from "./CatalogSuggestField.module.scss";

interface Props {
  value: string;
  options: CatalogItemOption[];
  loading?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function filterOptions(options: CatalogItemOption[], query: string): CatalogItemOption[] {
  const q = normalizeSearch(query);
  if (!q) return options.slice(0, 25);
  return options
    .filter((item) => {
      if (item.key === "other") return false;
      const value = normalizeSearch(item.value);
      const key = normalizeSearch(item.key);
      return value.includes(q) || key.includes(q);
    })
    .slice(0, 25);
}

export default function CatalogSuggestField({
  value,
  options,
  loading = false,
  placeholder,
  onChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pickedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const matches = filterOptions(options, value);

  function updateCoords() {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 2,
      left: rect.left,
      width: Math.max(rect.width, 220),
    });
  }

  useEffect(() => {
    if (!open) return;
    updateCoords();
    setHighlight(0);
  }, [value, open, options]);

  useEffect(() => {
    if (!open) return;
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

  function pick(item: CatalogItemOption) {
    pickedRef.current = true;
    onChange(item.value);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return;
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
    coords &&
    typeof document !== "undefined" &&
    (loading || matches.length > 0 || value.trim().length > 0);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        className={styles.input}
        value={value}
        placeholder={placeholder}
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
            pickedRef.current = false;
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
              <li className={styles.status}>Cargando catálogo…</li>
            )}
            {!loading && matches.length === 0 && (
              <li className={styles.status}>Sin coincidencias</li>
            )}
            {matches.map((item, i) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={i === highlight ? styles.optionActive : styles.option}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(item)}
                >
                  {item.value}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
