import { HorasExtraNav } from "@/features/contabilidad/horas-extra";

export default function HorasExtraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HorasExtraNav />
      {children}
    </>
  );
}
