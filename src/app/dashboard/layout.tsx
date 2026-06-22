"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { APP_TITLE } from "@/lib/branding";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
          }}
        >
          <p>Cargando...</p>
        </div>
      }
    >
      <ProtectedRoute>
        <DashboardLayout title={APP_TITLE}>{children}</DashboardLayout>
      </ProtectedRoute>
    </Suspense>
  );
}
