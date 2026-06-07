import type { FormReportEvidenceField } from "../config/formReportTypes";

export interface EvidenceItem {
  label: string;
  url: string;
}

export function collectEvidences(
  record: Record<string, unknown>,
  fields: FormReportEvidenceField[],
): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  for (const field of fields) {
    const raw = record[field.key];
    if (!raw) continue;
    if (field.multiple && Array.isArray(raw)) {
      (raw as string[]).forEach((url, i) => {
        if (typeof url === "string" && url.startsWith("http")) {
          items.push({ label: `${field.label} ${i + 1}`, url });
        }
      });
    } else if (typeof raw === "string" && raw.startsWith("http")) {
      items.push({ label: field.label, url: raw });
    }
  }

  const files = record.files as Array<{ fieldKey?: string; s3Url?: string }> | undefined;
  if (Array.isArray(files)) {
    files.forEach((file, i) => {
      if (file.s3Url?.startsWith("http")) {
        items.push({
          label: file.fieldKey ? `Adjunto: ${file.fieldKey}` : `Adjunto ${i + 1}`,
          url: file.s3Url,
        });
      }
    });
  }

  return items;
}
