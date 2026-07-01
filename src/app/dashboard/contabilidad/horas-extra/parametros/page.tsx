"use client";

import { Card } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canManageOvertimeParams } from "@/features/dashboard/constants/nav";
import { ParametrosContainer } from "@/features/contabilidad/horas-extra";

export default function ParametrosHorasExtraPage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!canManageOvertimeParams(user?.role)) {
    return (
      <Card title="Parámetros contables">
        <p>No tiene permiso para gestionar parámetros contables.</p>
      </Card>
    );
  }

  return (
    <Card title="Parámetros contables">
      <ParametrosContainer />
    </Card>
  );
}
