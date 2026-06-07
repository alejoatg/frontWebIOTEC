/** Aplana submission anidada (checklist) al registro raíz para listado/export. */
export function flattenChecklistRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const submission = row.submission as Record<string, unknown> | undefined;
  const submittedBy = submission?.submittedBy as { name?: string } | undefined;
  return {
    ...row,
    syncedAt: submission?.syncedAt,
    startedAt: submission?.startedAt,
    completedAt: submission?.completedAt,
    submittedBy,
    files: submission?.files,
  };
}

export function flattenChecklistDetail(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const submission = record.submission as Record<string, unknown> | undefined;
  const data = (submission?.data as Record<string, unknown>) ?? {};
  return {
    ...record,
    ...data,
    syncedAt: submission?.syncedAt,
    startedAt: submission?.startedAt,
    completedAt: submission?.completedAt,
    submittedBy: submission?.submittedBy,
    files: submission?.files,
  };
}
