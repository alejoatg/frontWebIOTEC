"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { assignEmployeeSalary, fetchEmployee } from "../api/hrApi";
import styles from "./AgregarTrabajadorForm.module.scss";

function parseSalary(raw: string): number {
  const value = raw.trim();
  if (!value) return Number.NaN;
  if (value.includes(",")) {
    return Number(value.replace(/\./g, "").replace(",", "."));
  }
  const dots = value.match(/\./g)?.length ?? 0;
  if (dots > 1) return Number(value.replace(/\./g, ""));
  return Number(value);
}

interface Props {
  employeeId: string;
}

export default function AsignarSalarioForm({ employeeId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEmployee(employeeId)
      .then((employee) => {
        if (cancelled) return;
        setName(employee.fullName);
        setDocumentNumber(employee.documentNumber);
        if (employee.currentContract?.startDate) {
          setStartDate(employee.currentContract.startDate.slice(0, 10));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar el trabajador");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  function goToList() {
    router.push("/dashboard/talento-humano/trabajadores");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const salary = parseSalary(baseSalary);
    if (!Number.isFinite(salary) || salary <= 0) {
      setError("Indica un salario mayor a cero");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await assignEmployeeSalary(employeeId, {
        baseSalary: salary,
        startDate,
      });
      goToList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar el salario");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Cargando trabajador...</span>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
      {error ? <p className={styles.bannerError}>{error}</p> : null}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {name || "Trabajador"}
          {documentNumber ? ` · ${documentNumber}` : ""}
        </h3>
        <p>Asigna el salario mensual vigente. Puedes omitirlo y registrarlo después.</p>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="base-salary">
              Salario mensual *
            </label>
            <input
              id="base-salary"
              className={styles.input}
              inputMode="decimal"
              value={baseSalary}
              onChange={(event) => setBaseSalary(event.target.value)}
              placeholder="Ej. 1800000"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="salary-start">
              Vigente desde
            </label>
            <input
              id="salary-start"
              className={styles.input}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
        </div>
      </section>
      <div className={styles.actions}>
        <Button type="button" variant="outline" onClick={goToList} disabled={submitting}>
          Omitir por ahora
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar salario"}
        </Button>
      </div>
    </form>
  );
}
