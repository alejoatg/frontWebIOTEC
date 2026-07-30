"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

/**
 * Layout para vistas de evidencia (`/ver/*`).
 * Protegido por sesión por ahora; la URL es estable para poder abrirla
 * públicamente en el futuro sin romper enlaces del Excel/impresión.
 */
export default function VerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Cargando…</p>
        </div>
      }
    >
      <ProtectedRoute>{children}</ProtectedRoute>
    </Suspense>
  );
}
