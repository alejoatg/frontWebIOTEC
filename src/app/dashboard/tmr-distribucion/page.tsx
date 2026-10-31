"use client";

import { Card } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TmrContainer } from "@/features/tmr-distribucion";

export default function TmrDistribucionPage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role !== "ADMIN") {
    return (
      <Card title="TMR Distribución">
        <p>No tiene permiso para este módulo.</p>
      </Card>
    );
  }

  return (
    <Card title="TMR Distribución">
      <TmrContainer />
    </Card>
  );
}
