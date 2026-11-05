"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isOvertimeAnalyst } from "@/features/dashboard/constants/nav";

const GROUP_HOME = "/dashboard/contabilidad/horas-extra/grupo";

function analystMayOpen(pathname: string) {
  if (pathname === GROUP_HOME || pathname.startsWith(`${GROUP_HOME}/`)) return true;
  return /^\/dashboard\/contabilidad\/horas-extra\/registros\/[^/]+$/.test(pathname);
}

export default function HorasExtraGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const analyst = isOvertimeAnalyst(user?.role);
  const allowed = !analyst || analystMayOpen(pathname);

  useEffect(() => {
    if (loading || !analyst || allowed) return;
    router.replace(GROUP_HOME);
  }, [loading, analyst, allowed, router]);

  if (!loading && analyst && !allowed) return null;
  return <>{children}</>;
}
