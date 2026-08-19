/**
 * Origen del tiempo suplementario (campo Sistema en digitación).
 * Lista fija en código — solo aplica en Digitar.
 */

export const SISTEMA_TS_OPTIONS = [
  { code: "correo", label: "Correo" },
  { code: "open", label: "Open" },
  { code: "sgd", label: "SGD" },
  { code: "sistema", label: "Sistema" },
  { code: "toa", label: "TOA" },
] as const;

export type SistemaTsCode = (typeof SISTEMA_TS_OPTIONS)[number]["code"];

export const SISTEMA_TS_SELECT_OPTIONS = SISTEMA_TS_OPTIONS.map((item) => ({
  key: item.code,
  value: item.label,
}));

export function isSistemaTsLabel(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return SISTEMA_TS_OPTIONS.some((item) => item.label === trimmed);
}
