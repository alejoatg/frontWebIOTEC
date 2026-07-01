"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./HorasExtraNav.module.scss";

const LINKS = [
  { href: "/dashboard/contabilidad/horas-extra", label: "Resumen" },
  { href: "/dashboard/contabilidad/horas-extra/cargar", label: "Cargar Excel" },
  { href: "/dashboard/contabilidad/horas-extra/registros", label: "Registros" },
  { href: "/dashboard/contabilidad/horas-extra/planillas", label: "Planillas" },
  { href: "/dashboard/contabilidad/horas-extra/parametros", label: "Parámetros" },
  { href: "/dashboard/contabilidad/horas-extra/consolidado", label: "Consolidado" },
];

export default function HorasExtraNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Horas extra">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={pathname === l.href ? styles.active : styles.link}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
