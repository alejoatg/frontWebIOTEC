"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canSeeOvertimeReviewNav } from "@/features/dashboard/constants/nav";
import styles from "./HorasExtraNav.module.scss";

const LINKS = [
  { href: "/dashboard/contabilidad/horas-extra", label: "Resumen", exact: true },
  { href: "/dashboard/contabilidad/horas-extra/cargar", label: "Cargar Excel" },
  { href: "/dashboard/contabilidad/horas-extra/digitar", label: "Digitar" },
  { href: "/dashboard/contabilidad/horas-extra/mis-registros", label: "Mis registros" },
  {
    href: "/dashboard/contabilidad/horas-extra/registros",
    label: "Registros",
    reviewOnly: true,
  },
  {
    href: "/dashboard/contabilidad/horas-extra/registros/planilla",
    label: "Vista planilla",
    reviewOnly: true,
  },
  {
    href: "/dashboard/contabilidad/horas-extra/planillas",
    label: "Planillas",
    reviewOnly: true,
  },
  { href: "/dashboard/contabilidad/horas-extra/estadisticas", label: "Estadísticas" },
  { href: "/dashboard/contabilidad/horas-extra/pdf", label: "PDF" },
  {
    href: "/dashboard/contabilidad/horas-extra/parametros",
    label: "Parámetros",
    reviewOnly: true,
  },
  {
    href: "/dashboard/contabilidad/horas-extra/consolidado",
    label: "Consolidado",
    reviewOnly: true,
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href.endsWith("/registros")) {
    return (
      pathname === href ||
      /^\/dashboard\/contabilidad\/horas-extra\/registros\/[^/]+$/.test(pathname)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HorasExtraNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const showReview = canSeeOvertimeReviewNav(user?.role);

  const links = LINKS.filter((l) => !("reviewOnly" in l && l.reviewOnly) || showReview);

  return (
    <nav className={styles.nav} aria-label="Horas extra">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={isActive(pathname, l.href, "exact" in l ? l.exact : undefined) ? styles.active : styles.link}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
