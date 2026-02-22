"use client";

import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard">{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
