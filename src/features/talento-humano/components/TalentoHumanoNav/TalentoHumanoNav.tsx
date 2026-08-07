"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TalentoHumanoNav.module.scss";

const LINKS = [
  { href: "/dashboard/talento-humano/trabajadores", label: "Trabajadores" },
  { href: "/dashboard/talento-humano/cargos-areas", label: "Cargos y áreas" },
];

export default function TalentoHumanoNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Talento humano">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? styles.active : styles.link}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
