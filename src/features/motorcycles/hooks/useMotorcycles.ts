"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchMotorcycles } from "../api/motorcyclesApi";
import type { Motorcycle, UseMotorcyclesResult } from "../types";

export function useMotorcycles(): UseMotorcyclesResult {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchMotorcycles();
      setMotorcycles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setMotorcycles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { motorcycles, loading, error, refetch };
}
