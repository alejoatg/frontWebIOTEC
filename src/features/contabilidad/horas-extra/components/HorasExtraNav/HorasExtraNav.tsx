"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./HorasExtraNav.module.scss";

const LINKS = [
  { href: "/dashboard/contabilidad/horas-extra", label: "Resumen", exact: true },
  { href: "/dashboard/contabilidad/horas-extra/cargar", label: "Cargar Excel" },
  { href: "/dashboard/contabilidad/horas-extra/digitar", label: "Digitar" },
  { href: "/dashboard/contabilidad/horas-extra/registros", label: "Registros" },
  { href: "/dashboard/contabilidad/horas-extra/registros/planilla", label: "Vista planilla" },
  { href: "/dashboard/contabilidad/horas-extra/planillas", label: "Planillas" },
  { href: "/dashboard/contabilidad/horas-extra/pdf", label: "PDF" },
  { href: "/dashboard/contabilidad/horas-extra/parametros", label: "Parámetros" },
  { href: "/dashboard/contabilidad/horas-extra/consolidado", label: "Consolidado" },
];

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
  return (
    <nav className={styles.nav} aria-label="Horas extra">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={isActive(pathname, l.href, l.exact) ? styles.active : styles.link}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
