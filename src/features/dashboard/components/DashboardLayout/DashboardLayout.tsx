"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Users,
  FileText,
  Bike,
} from "lucide-react";
import { getLogoutUrl } from "@/lib/auth";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DASHBOARD_NAV_ITEMS } from "../../constants/nav";
import styles from "./DashboardLayout.module.scss";

const ICON_MAP = {
  Home,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Users,
  FileText,
  Bike,
} as const;

export interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.homeLink} aria-label="Inicio">
            <Home size={24} aria-hidden />
          </Link>
          <h1 className={styles.title}>{title}</h1>
        </div>

        <div className={styles.headerRight}>
          {user && (
            <>
              <div className={styles.userInfo}>
                {user.picture && (
                  <Image
                    src={user.picture}
                    alt=""
                    width={32}
                    height={32}
                    className={styles.avatar}
                  />
                )}
                <span className={styles.userName}>{user.name}</span>
              </div>
              <a
                href={getLogoutUrl()}
                className={styles.logoutLink}
                aria-label="Cerrar sesión"
              >
                <LogOut size={22} aria-hidden />
              </a>
            </>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <aside
          className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}
          aria-label="Navegación principal"
        >
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {sidebarCollapsed ? (
              <PanelLeft size={22} aria-hidden />
            ) : (
              <PanelLeftClose size={22} aria-hidden />
            )}
          </button>
          <nav className={styles.sidebarNav}>
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? Home;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path + item.label}
                  href={item.path}
                  className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}
                  title={item.label}
                >
                  <Icon size={22} aria-hidden />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>

      <nav
        className={styles.bottomNav}
        aria-label="Navegación móvil"
        role="navigation"
      >
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? Home;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path + item.label}
              href={item.path}
              className={`${styles.bottomNavLink} ${isActive ? styles.bottomNavLinkActive : ""}`}
              title={item.label}
            >
              <Icon size={24} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
