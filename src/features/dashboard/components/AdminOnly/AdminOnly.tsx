"use client";

import type { ReactNode } from "react";
import { Card } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface AdminOnlyProps {
  title: string;
  children: ReactNode;
}

/** Pantalla visible solo para el rol ADMIN. */
export default function AdminOnly({ title, children }: AdminOnlyProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role !== "ADMIN") {
    return (
      <Card title={title}>
        <p>No tiene permiso para este módulo.</p>
      </Card>
    );
  }

  return children;
}
