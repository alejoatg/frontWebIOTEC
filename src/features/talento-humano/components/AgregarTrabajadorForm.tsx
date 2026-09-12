"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components";
import {
  fetchCatalogItemsBatch,
  toSelectOptions,
} from "@/features/catalogs/api/catalogsApi";
import { createEmployee, fetchEmployee, updateEmployee } from "../api/hrApi";
import { useHrOrg } from "../hooks/useHrOrg";
import type { CreateEmployeePayload, EmployeeDetail } from "../types";
import styles from "./AgregarTrabajadorForm.module.scss";

type FormState = {
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  genderCatalogKey: string;
  bloodTypeCatalogKey: string;
  maritalStatusCatalogKey: string;
  mobilePhone: string;
  email: string;
  fieldWork: boolean;
  isActive: boolean;
  startDate: string;
  contractTypeCatalogKey: string;
  managementUnitId: string;
  areaId: string;
  workProcessId: string;
  jobPositionId: string;
  zoneId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  documentNumber: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  genderCatalogKey: "",
  bloodTypeCatalogKey: "",
  maritalStatusCatalogKey: "",
  mobilePhone: "",
  email: "",
  fieldWork: false,
  isActive: true,
  startDate: new Date().toISOString().slice(0, 10),
  contractTypeCatalogKey: "",
  managementUnitId: "",
  areaId: "",
  workProcessId: "",
  jobPositionId: "",
  zoneId: "",
};

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function detailToForm(detail: EmployeeDetail): FormState {
  const wl = detail.currentWorkLocation;
  return {
    documentNumber: detail.documentNumber,
    firstName: detail.firstName,
    lastName: detail.lastName,
    birthDate: toDateInput(detail.birthDate),
    genderCatalogKey: detail.genderCatalogKey ?? "",
    bloodTypeCatalogKey: detail.bloodTypeCatalogKey ?? "",
    maritalStatusCatalogKey: detail.maritalStatusCatalogKey ?? "",
    mobilePhone: detail.mobilePhone ?? "",
    email: detail.email ?? "",
    fieldWork: detail.fieldWork ?? false,
    isActive: detail.isActive,
    startDate:
      toDateInput(wl?.startDate) ||
      toDateInput(detail.currentContract?.startDate) ||
      new Date().toISOString().slice(0, 10),
    contractTypeCatalogKey: detail.currentContract?.contractTypeCatalogKey ?? "",
    managementUnitId: wl?.managementUnit?.id ?? "",
    areaId: wl?.area?.id ?? "",
    workProcessId: wl?.workProcess?.id ?? "",
    jobPositionId: wl?.jobPosition?.id ?? "",
    zoneId: wl?.zone?.id ?? "",
  };
}

type Props = {
  /** Si se pasa, el formulario carga y actualiza ese trabajador. */
  employeeId?: string;
};

export default function AgregarTrabajadorForm({ employeeId }: Props) {
  const isEdit = Boolean(employeeId);
  const router = useRouter();
  const { jobPositions, areas, zones, workProcesses, managementUnits, loading, error } =
    useHrOrg();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [catalogOptions, setCatalogOptions] = useState<{
    gender: { value: string; label: string }[];
    blood_type: { value: string; label: string }[];
    marital_status: { value: string; label: string }[];
    contract_type: { value: string; label: string }[];
  }>({
    gender: [],
    blood_type: [],
    marital_status: [],
    contract_type: [],
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const batch = await fetchCatalogItemsBatch([
          "gender",
          "blood_type",
          "marital_status",
          "contract_type",
        ]);
        if (cancelled) return;
        setCatalogOptions({
          gender: toSelectOptions(batch.gender ?? []),
          blood_type: toSelectOptions(batch.blood_type ?? []),
          marital_status: toSelectOptions(batch.marital_status ?? []),
          contract_type: toSelectOptions(batch.contract_type ?? []),
        });
      } catch {
        // Catálogos opcionales: el formulario sigue usable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    setLoadingEmployee(true);
    setLoadError(null);
    void (async () => {
      try {
        const detail = await fetchEmployee(employeeId);
        if (cancelled) return;
        setForm(detailToForm(detail));
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "No se pudo cargar el trabajador",
        );
      } finally {
        if (!cancelled) setLoadingEmployee(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  /**
   * Cascada suave: si UEN/área están vinculados en catálogo, prioriza coincidencias,
   * pero siempre incluye ítems sin vínculo (la mayoría del seed no tiene UEN/área).
   * Antes el filtro estricto dejaba Área y Proceso vacíos al elegir UEN.
   */
  const filteredAreas = useMemo(() => {
    if (!form.managementUnitId) return areas;
    const linked = areas.filter(
      (a) => a.managementUnit?.id === form.managementUnitId,
    );
    const unlinked = areas.filter((a) => !a.managementUnit);
    // Si hay áreas ligadas a la UEN, muestra esas + sin UEN; si no, todas.
    if (linked.length === 0) return areas;
    const seen = new Set(linked.map((a) => a.id));
    return [...linked, ...unlinked.filter((a) => !seen.has(a.id))];
  }, [areas, form.managementUnitId]);

  const filteredProcesses = useMemo(() => {
    const byArea = form.areaId
      ? workProcesses.filter((p) => !p.area || p.area.id === form.areaId)
      : null;
    const byUen = form.managementUnitId
      ? workProcesses.filter(
          (p) =>
            !p.area ||
            !p.area.managementUnit ||
            p.area.managementUnit.id === form.managementUnitId,
        )
      : null;

    let base = workProcesses;
    if (byArea) {
      const linkedToArea = byArea.filter((p) => p.area?.id === form.areaId);
      base = linkedToArea.length > 0 ? byArea : workProcesses;
    } else if (byUen) {
      const linkedToUen = byUen.filter(
        (p) => p.area?.managementUnit?.id === form.managementUnitId,
      );
      base = linkedToUen.length > 0 ? byUen : workProcesses;
    }

    if (
      form.workProcessId &&
      !base.some((p) => p.id === form.workProcessId)
    ) {
      const current = workProcesses.find((p) => p.id === form.workProcessId);
      if (current) return [current, ...base];
    }
    return base;
  }, [workProcesses, form.areaId, form.managementUnitId, form.workProcessId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "managementUnitId") {
        next.areaId = "";
        next.workProcessId = "";
      }
      if (key === "areaId") {
        next.workProcessId = "";
      }
      return next;
    });
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const digits = form.documentNumber.replace(/\D/g, "");
    if (digits.length < 5 || digits.length > 15) {
      next.documentNumber = "La cédula debe tener entre 5 y 15 dígitos";
    }
    if (!form.firstName.trim()) next.firstName = "Obligatorio";
    if (!form.lastName.trim()) next.lastName = "Obligatorio";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Correo inválido";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): CreateEmployeePayload => ({
    documentNumber: form.documentNumber.replace(/\D/g, ""),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    birthDate: optional(form.birthDate),
    genderCatalogKey: optional(form.genderCatalogKey),
    bloodTypeCatalogKey: optional(form.bloodTypeCatalogKey),
    maritalStatusCatalogKey: optional(form.maritalStatusCatalogKey),
    mobilePhone: optional(form.mobilePhone),
    email: optional(form.email),
    fieldWork: form.fieldWork,
    startDate: optional(form.startDate),
    contractTypeCatalogKey: optional(form.contractTypeCatalogKey),
    workLocation: {
      managementUnitId: optional(form.managementUnitId),
      areaId: optional(form.areaId),
      workProcessId: optional(form.workProcessId),
      jobPositionId: optional(form.jobPositionId),
      zoneId: optional(form.zoneId),
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const payload = buildPayload();
    setSubmitting(true);
    try {
      if (isEdit && employeeId) {
        await updateEmployee(employeeId, {
          ...payload,
          isActive: form.isActive,
        });
      } else {
        await createEmployee(payload);
      }
      router.push("/dashboard/talento-humano/trabajadores");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingEmployee) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>
          {loadingEmployee
            ? "Cargando trabajador..."
            : "Cargando catálogos organizacionales..."}
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.bannerError}>
        <p>{loadError}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/talento-humano/trabajadores")}
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
      {error ? <p className={styles.bannerError}>{error}</p> : null}
      {submitError ? <p className={styles.bannerError}>{submitError}</p> : null}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Identificación</h3>
        <div className={styles.grid}>
          <Input
            label="Cédula *"
            inputMode="numeric"
            autoComplete="off"
            value={form.documentNumber}
            error={fieldErrors.documentNumber}
            onChange={(e) =>
              setField("documentNumber", e.target.value.replace(/\D/g, "").slice(0, 15))
            }
          />
          <Input
            label="Nombres *"
            value={form.firstName}
            error={fieldErrors.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
          />
          <Input
            label="Apellidos *"
            value={form.lastName}
            error={fieldErrors.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
          />
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={form.birthDate}
            onChange={(e) => setField("birthDate", e.target.value)}
          />
          <SelectField
            label="Género"
            value={form.genderCatalogKey}
            options={catalogOptions.gender}
            onChange={(v) => setField("genderCatalogKey", v)}
          />
          <SelectField
            label="Tipo de sangre"
            value={form.bloodTypeCatalogKey}
            options={catalogOptions.blood_type}
            onChange={(v) => setField("bloodTypeCatalogKey", v)}
          />
          <SelectField
            label="Estado civil"
            value={form.maritalStatusCatalogKey}
            options={catalogOptions.marital_status}
            onChange={(v) => setField("maritalStatusCatalogKey", v)}
          />
          {isEdit ? (
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
              />
              Trabajador activo
            </label>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Contacto</h3>
        <div className={styles.grid}>
          <Input
            label="Celular"
            inputMode="tel"
            value={form.mobilePhone}
            onChange={(e) => setField("mobilePhone", e.target.value)}
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={form.email}
            error={fieldErrors.email}
            onChange={(e) => setField("email", e.target.value)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Ingreso a la empresa</h3>
        <div className={styles.grid}>
          <Input
            label="Fecha de ingreso"
            type="date"
            value={form.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
          />
          <SelectField
            label="Tipo de contrato"
            value={form.contractTypeCatalogKey}
            options={catalogOptions.contract_type}
            onChange={(v) => setField("contractTypeCatalogKey", v)}
          />
          <SelectField
            label="Cargo"
            value={form.jobPositionId}
            options={jobPositions.map((j) => ({ value: j.id, label: j.name }))}
            onChange={(v) => setField("jobPositionId", v)}
          />
          <SelectField
            label="UEN"
            value={form.managementUnitId}
            options={managementUnits.map((u) => ({ value: u.id, label: u.name }))}
            onChange={(v) => setField("managementUnitId", v)}
          />
          <SelectField
            label="Área"
            value={form.areaId}
            options={filteredAreas.map((a) => ({ value: a.id, label: a.name }))}
            onChange={(v) => setField("areaId", v)}
          />
          <SelectField
            label="Proceso laboral"
            value={form.workProcessId}
            options={filteredProcesses.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(v) => setField("workProcessId", v)}
          />
          <SelectField
            label="Zona"
            value={form.zoneId}
            options={zones.map((z) => ({ value: z.id, label: z.name }))}
            onChange={(v) => setField("zoneId", v)}
          />
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.fieldWork}
              onChange={(e) => setField("fieldWork", e.target.checked)}
            />
            Trabajo de campo
          </label>
        </div>
      </section>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => router.push("/dashboard/talento-humano/trabajadores")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Guardar trabajador"}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
