"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import "@/features/contabilidad/horas-extra/styles/ts-print.global.scss";

export default function ImprimirLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Cargando vista de impresión…</p>
        </div>
      }
    >
      <ProtectedRoute>{children}</ProtectedRoute>
    </Suspense>
  );
}
