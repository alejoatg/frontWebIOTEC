"use client";

import { Card } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ExclusionesContainer } from "@/features/exclusiones-distribucion";

export default function ExclusionesDistribucionPage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role !== "ADMIN") {
    return (
      <Card title="Exclusiones Distribución">
        <p>No tiene permiso para este módulo.</p>
      </Card>
    );
  }

  return (
    <Card title="Exclusiones Distribución">
      <ExclusionesContainer />
    </Card>
  );
}
