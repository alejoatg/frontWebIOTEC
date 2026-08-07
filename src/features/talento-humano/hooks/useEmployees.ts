"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchEmployees } from "../api/hrApi";
import type { EmployeeListItem } from "../types";

export function useEmployees(options?: { search?: string; includeInactive?: boolean }) {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const search = options?.search ?? "";
  const includeInactive = options?.includeInactive ?? false;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmployees({ search, includeInactive });
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [search, includeInactive]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { employees, loading, error, refetch };
}
