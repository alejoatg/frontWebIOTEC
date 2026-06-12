import { notFound } from "next/navigation";
import FormReportContainer from "@/features/formularios/components/shared/FormReportContainer";
import { getFormReportBySlug } from "@/features/formularios/config/formReportsRegistry";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FormReportListPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getFormReportBySlug(slug);
  if (!config) notFound();
  return <FormReportContainer slug={slug} />;
}
