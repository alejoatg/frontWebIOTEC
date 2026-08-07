"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAreas,
  fetchJobPositions,
  fetchManagementUnits,
  fetchWorkProcesses,
  fetchZones,
} from "../api/hrApi";
import type {
  AreaItem,
  JobPositionItem,
  ManagementUnitItem,
  WorkProcessItem,
  ZoneItem,
} from "../types";

export function useHrOrg(includeInactive = false) {
  const [jobPositions, setJobPositions] = useState<JobPositionItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [workProcesses, setWorkProcesses] = useState<WorkProcessItem[]>([]);
  const [managementUnits, setManagementUnits] = useState<ManagementUnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [positions, areaRows, zoneRows, processRows, uenRows] = await Promise.all([
        fetchJobPositions(includeInactive),
        fetchAreas(includeInactive),
        fetchZones(includeInactive),
        fetchWorkProcesses(includeInactive),
        fetchManagementUnits(includeInactive),
      ]);
      setJobPositions(positions);
      setAreas(areaRows);
      setZones(zoneRows);
      setWorkProcesses(processRows);
      setManagementUnits(uenRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setJobPositions([]);
      setAreas([]);
      setZones([]);
      setWorkProcesses([]);
      setManagementUnits([]);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    jobPositions,
    areas,
    zones,
    workProcesses,
    managementUnits,
    loading,
    error,
    refetch,
  };
}
