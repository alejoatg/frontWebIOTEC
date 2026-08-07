"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAreas, fetchJobPositions, fetchZones } from "../api/hrApi";
import type { AreaItem, JobPositionItem, ZoneItem } from "../types";

export function useHrOrg(includeInactive = false) {
  const [jobPositions, setJobPositions] = useState<JobPositionItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [positions, areaRows, zoneRows] = await Promise.all([
        fetchJobPositions(includeInactive),
        fetchAreas(includeInactive),
        fetchZones(includeInactive),
      ]);
      setJobPositions(positions);
      setAreas(areaRows);
      setZones(zoneRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setJobPositions([]);
      setAreas([]);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { jobPositions, areas, zones, loading, error, refetch };
}
