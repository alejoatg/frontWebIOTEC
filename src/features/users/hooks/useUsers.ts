"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/api";
import type { UserListItem, UseUsersResult } from "../types";

/**
 * Hook para obtener el listado de usuarios.
 * Requiere que el usuario autenticado tenga rol ADMIN, CORDINADOR o SUPERVISOR.
 */
export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("No autorizado. Inicia sesión nuevamente.");
        }
        if (response.status === 403) {
          throw new Error("No tienes permisos para ver los usuarios.");
        }
        throw new Error("Error al cargar los usuarios.");
      }

      const data: UserListItem[] = await response.json();
      setUsers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}
