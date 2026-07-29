/** URL de la vista de impresión HTML del detalle de un formulario. */
export function formSubmissionPrintPageUrl(
  slug: string,
  id: string,
  autoPrint = false,
): string {
  const base = `/imprimir/formularios/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;
  return autoPrint ? `${base}?print=1` : base;
}
