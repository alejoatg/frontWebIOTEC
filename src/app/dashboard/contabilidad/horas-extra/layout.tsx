import { HorasExtraGate, HorasExtraNav } from "@/features/contabilidad/horas-extra";

export default function HorasExtraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HorasExtraGate>
      <HorasExtraNav />
      {children}
    </HorasExtraGate>
  );
}
