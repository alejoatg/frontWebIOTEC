"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refetch } = useAuth();

  const pendingLoginSuccess = searchParams.get("login") === "success";

  useEffect(() => {
    if (!pendingLoginSuccess) return;
    let cancelled = false;
    (async () => {
      await refetch();
      if (!cancelled) {
        router.replace("/dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingLoginSuccess, refetch, router]);

  useEffect(() => {
    if (loading || pendingLoginSuccess) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router, pendingLoginSuccess]);

  if (loading) {
    return (
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
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
