"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isOvertimeAnalyst } from "@/features/dashboard/constants/nav";

const GROUP_HOME = "/dashboard/contabilidad/horas-extra/grupo";

const ANALYST_PAGES = [
  "/dashboard/contabilidad/horas-extra/digitar",
  "/dashboard/contabilidad/horas-extra/mis-registros",
  "/dashboard/contabilidad/horas-extra/pdf",
  GROUP_HOME,
];

function analystMayOpen(pathname: string) {
  if (ANALYST_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))) {
    return true;
  }
  return /^\/dashboard\/contabilidad\/horas-extra\/registros\/[^/]+$/.test(pathname);
}

export default function HorasExtraGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const analyst = isOvertimeAnalyst(user?.role);
  const allowed = !analyst || analystMayOpen(pathname);
  const firmas = pathname.startsWith("/dashboard/contabilidad/horas-extra/pdf/firmas");
  const firmasBlocked = firmas && user?.role !== "ADMIN";

  useEffect(() => {
    if (loading) return;
    if (firmasBlocked) {
      router.replace("/dashboard/contabilidad/horas-extra");
      return;
    }
    if (!analyst || allowed) return;
    router.replace(GROUP_HOME);
  }, [loading, analyst, allowed, firmasBlocked, router]);

  if (!loading && (firmasBlocked || (analyst && !allowed))) return null;
  return <>{children}</>;
}
