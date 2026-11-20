import { redirect } from "next/navigation";

export default function PdfHorasExtraPage() {
  redirect("/dashboard/contabilidad/horas-extra/pdf/generar");
}
