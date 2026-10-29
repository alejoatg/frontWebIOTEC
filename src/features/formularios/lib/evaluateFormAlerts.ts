import type { FormAlertMatch, FormAlertRule } from "../config/formAlertTypes";
import { humanizeFieldKey } from "./formatters";

function isYes(value: unknown): boolean {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "si";
}

function hasText(value: unknown): boolean {
  return String(value ?? "").trim().length > 0;
}

function matchesNonConforming(value: unknown, expected: string[]): boolean {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return expected.some((item) => item.toLowerCase() === raw.toLowerCase());
}

/** Evalúa un registro según las reglas del formato. Un mismo registro puede tener varias alertas. */
export function evaluateFormAlerts(
  record: Record<string, unknown>,
  rule: FormAlertRule,
): FormAlertMatch[] {
  const matches: FormAlertMatch[] = [];

  const ncItems = rule.inspectionFields.filter((key) =>
    matchesNonConforming(record[key], rule.nonConformingValues),
  );
  const hasNoConforme = ncItems.length > 0;
  if (hasNoConforme) {
    matches.push({
      kind: "no_conforme",
      details: ncItems.map((key) => humanizeFieldKey(key)),
    });
  }

  if (!hasNoConforme) {
    const observations = rule.observationFields.filter((key) => hasText(record[key]));
    if (observations.length > 0) {
      matches.push({
        kind: "observacion",
        details: observations.map((key) => humanizeFieldKey(key)),
      });
    }
  }

  if (rule.novedadField && isYes(record[rule.novedadField])) {
    matches.push({ kind: "novedad", details: [] });
  }

  const riskHits = rule.somnolenciaRiskFields.filter((field) => isYes(record[field.key]));
  if (riskHits.length > 0) {
    matches.push({
      kind: "somnolencia",
      details: riskHits.map((field) => field.label),
    });
    if (rule.somnolenciaSupervisorField && !isYes(record[rule.somnolenciaSupervisorField])) {
      matches.push({ kind: "no_informo_supervisor", details: [] });
    }
  }

  return matches;
}
