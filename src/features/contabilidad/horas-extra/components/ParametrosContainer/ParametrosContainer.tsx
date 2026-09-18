"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import {
  fetchAccountingAssignments,
  fetchAccountingCatalog,
  importCompensationParams,
  previewRecalculateForCatalog,
  updateAccountingCatalog,
  updateAccountingAssignment,
  type AccountingAssignment,
  type AccountingCatalogItem,
  type AccountingImportResult,
  type ManualEmployeeOption,
} from "../../api/overtimeApi";
import RecalculateModal from "../RecalculateModal/RecalculateModal";
import EmployeeSuggestField from "../DigitarContainer/EmployeeSuggestField";
import styles from "../../styles/shared.module.scss";
import tabStyles from "./ParametrosContainer.module.scss";

type Tab = "catalog" | "assignments";

type PendingCatalogEdit = {
  catalogId: string;
  label: string;
  monthlySalary: number;
  payrollFactor: number;
};

function catalogOptionLabel(c: AccountingCatalogItem): string {
  const area = c.area ?? "—";
  const process = c.processName ?? "—";
  return `${c.jobTitle} — ${area}/${process} ($${Number(c.monthlySalary).toLocaleString("es-CO")})`;
}

export default function ParametrosContainer() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<AccountingCatalogItem[]>([]);
  const [assignments, setAssignments] = useState<AccountingAssignment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState("");
  const [editFactor, setEditFactor] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [affectedCount, setAffectedCount] = useState(0);
  const [periodCodes, setPeriodCodes] = useState<string[]>([]);
  const [employeeLabel, setEmployeeLabel] = useState<string | undefined>();
  const [pendingEdit, setPendingEdit] = useState<PendingCatalogEdit | null>(null);
  const [assignCatalogId, setAssignCatalogId] = useState<Record<string, string>>({});

  const [newEmployeeQuery, setNewEmployeeQuery] = useState("");
  const [newEmployee, setNewEmployee] = useState<ManualEmployeeOption | null>(null);
  const [newCatalogId, setNewCatalogId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const assignedEmployeeIds = useMemo(
    () => new Set(assignments.map((a) => a.employeeId)),
    [assignments],
  );

  const loadCatalog = useCallback(async () => {
    setCatalog(await fetchAccountingCatalog(search || undefined));
  }, [search]);

  const loadAssignments = useCallback(async () => {
    setAssignments(await fetchAccountingAssignments(search || undefined));
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadCatalog(), loadAssignments()]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [loadCatalog, loadAssignments]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!newCatalogId && catalog.length > 0) {
      setNewCatalogId(catalog[0].id);
    }
  }, [catalog, newCatalogId]);

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setMessage(null);
    try {
      const result = await importCompensationParams(file, false);
      setMessage(formatImportResult(result));
      setFile(null);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  function formatImportResult(r: AccountingImportResult) {
    return (
      `Catálogo: ${r.catalogCreated} creados, ${r.catalogUpdated} actualizados. ` +
      `Asignaciones: ${r.assignmentsCreated} creadas, ${r.assignmentsUpdated} actualizadas.` +
      (r.workersNotFound.length ? ` ${r.workersNotFound.length} cédulas no en RRHH.` : "")
    );
  }

  async function handleCatalogSave(item: AccountingCatalogItem) {
    const salary = Number(editSalary);
    const factor = Number(editFactor);
    if (!salary || !factor) {
      setMessage("Salario y factor deben ser mayores a 0");
      return;
    }
    if (
      salary === Number(item.monthlySalary) &&
      factor === Number(item.payrollFactor)
    ) {
      setEditingCatalogId(null);
      return;
    }

    const label = `${item.jobTitle} — ${item.area ?? ""} / ${item.processName ?? ""}`;
    const preview = await previewRecalculateForCatalog(item.id);
    setAffectedCount(preview.totalAffectedEntries);
    setPeriodCodes([...new Set(preview.byEmployee.flatMap((e) => e.periodCodes))]);
    setEmployeeLabel(label);
    setPendingEdit({
      catalogId: item.id,
      label,
      monthlySalary: salary,
      payrollFactor: factor,
    });
    setModalOpen(true);
  }

  async function handleModalConfirm(recalculate: boolean) {
    setModalLoading(true);
    try {
      if (pendingEdit) {
        const res = await updateAccountingCatalog(pendingEdit.catalogId, {
          monthlySalary: pendingEdit.monthlySalary,
          payrollFactor: pendingEdit.payrollFactor,
          recalculateOpenPeriod: recalculate,
        });
        setMessage(
          res.recalculatedEntries > 0
            ? `Catálogo actualizado. ${res.recalculatedEntries} registro(s) recalculado(s).`
            : "Catálogo actualizado.",
        );
        setEditingCatalogId(null);
      }
      setModalOpen(false);
      setPendingEdit(null);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setModalLoading(false);
    }
  }

  function handleModalCancel() {
    setModalOpen(false);
    setPendingEdit(null);
  }

  async function saveAssignment(a: AccountingAssignment) {
    const catalogId = assignCatalogId[a.employeeId] ?? a.catalogId;
    if (catalogId === a.catalogId) return;
    try {
      await updateAccountingAssignment(a.employeeId, catalogId);
      setMessage("Asignación actualizada");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al asignar");
    }
  }

  function clearNewAssignmentForm() {
    setNewEmployee(null);
    setNewEmployeeQuery("");
  }

  async function handleCreateAssignment() {
    if (!newEmployee) {
      setMessage("Busque y seleccione un trabajador");
      return;
    }
    if (!newCatalogId) {
      setMessage("Seleccione un ítem de catálogo (sueldo)");
      return;
    }
    if (assignedEmployeeIds.has(newEmployee.employeeId)) {
      setMessage(
        "Ese trabajador ya tiene asignación. Cámbiela en la tabla de abajo.",
      );
      return;
    }

    setAssigning(true);
    setMessage(null);
    try {
      await updateAccountingAssignment(newEmployee.employeeId, newCatalogId);
      setMessage(
        `Asignación creada: ${newEmployee.fullName} (${newEmployee.documentNumber})`,
      );
      clearNewAssignmentForm();
      await load();
      setTab("assignments");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al crear asignación");
    } finally {
      setAssigning(false);
    }
  }

  const assignForm = (
    <div className={tabStyles.assignPanel}>
      <h3 className={tabStyles.assignTitle}>Asignar trabajador a sueldo</h3>
      <p className={tabStyles.assignHint}>
        Busque un empleado creado en RRHH y asócielo a un ítem del catálogo contable.
        No requiere Excel.
      </p>
      {catalog.length === 0 ? (
        <div className={`${styles.alert} ${styles.alertInfo}`}>
          Primero cree o importe ítems en la pestaña Catálogo (con sueldo).
        </div>
      ) : (
        <div className={tabStyles.assignGrid}>
          <div className={tabStyles.assignField}>
            <label className={tabStyles.assignLabel}>Trabajador</label>
            <EmployeeSuggestField
              mode="name"
              value={newEmployeeQuery}
              placeholder="Cédula o nombre…"
              onChange={(v) => {
                setNewEmployeeQuery(v);
                setNewEmployee(null);
              }}
              onPick={(emp) => {
                setNewEmployee(emp);
                setNewEmployeeQuery(`${emp.documentNumber} — ${emp.fullName}`);
              }}
              onCommit={() => undefined}
            />
          </div>
          <div className={tabStyles.assignField}>
            <label className={tabStyles.assignLabel}>Catálogo / sueldo</label>
            <select
              className={tabStyles.assignSelect}
              value={newCatalogId}
              onChange={(e) => setNewCatalogId(e.target.value)}
            >
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {catalogOptionLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div className={tabStyles.assignActions}>
            <Button
              type="button"
              size="sm"
              disabled={assigning || !newEmployee || !newCatalogId}
              onClick={() => void handleCreateAssignment()}
            >
              {assigning ? "Guardando…" : "Asignar"}
            </Button>
            {newEmployee ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearNewAssignmentForm}
              >
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>
      )}
      {newEmployee ? (
        <p className={tabStyles.assignSelected}>
          Seleccionado: <strong>{newEmployee.fullName}</strong> · cédula{" "}
          {newEmployee.documentNumber}
          {newEmployee.isActive === false ? " (inactivo)" : ""}
        </p>
      ) : null}
    </div>
  );

  return (
    <div>
      <p className={tabStyles.intro}>
        Catálogo contable (cargo + área + proceso + sueldo) e importación desde{" "}
        <strong>INFORMACION_CONTABLE.xlsx</strong> (hojas CATALOGO y LISTADO TRABAJADORES).
        También puede asignar un trabajador a un sueldo desde la pestaña Asignaciones.
      </p>

      <div className={styles.toolbar}>
        <input
          type="file"
          accept=".xlsx,.xls"
          className={styles.fileInput}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button type="button" size="sm" disabled={!file || importing} onClick={handleImport}>
          Importar Excel
        </Button>
        <input
          type="search"
          placeholder="Buscar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {message && <div className={`${styles.alert} ${styles.alertInfo}`}>{message}</div>}

      <div className={tabStyles.tabs}>
        <button
          type="button"
          className={tab === "catalog" ? tabStyles.tabActive : tabStyles.tab}
          onClick={() => setTab("catalog")}
        >
          Catálogo ({catalog.length})
        </button>
        <button
          type="button"
          className={tab === "assignments" ? tabStyles.tabActive : tabStyles.tab}
          onClick={() => setTab("assignments")}
        >
          Asignaciones ({assignments.length})
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando…</div>
      ) : tab === "catalog" ? (
        catalog.length === 0 ? (
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            Sin catálogo. Importe INFORMACION_CONTABLE.xlsx (hoja CATALOGO).
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cargo</th>
                  <th>Gerencia</th>
                  <th>Área</th>
                  <th>Proceso</th>
                  <th>Salario</th>
                  <th>Factor</th>
                  <th>Trabajadores</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((c) => (
                  <tr key={c.id}>
                    <td>{c.jobTitle}</td>
                    <td>{c.managementUnit ?? "—"}</td>
                    <td>{c.area ?? "—"}</td>
                    <td>{c.processName ?? "—"}</td>
                    <td>
                      {editingCatalogId === c.id ? (
                        <input
                          type="number"
                          value={editSalary}
                          onChange={(e) => setEditSalary(e.target.value)}
                          className={styles.inputInline}
                        />
                      ) : (
                        Number(c.monthlySalary).toLocaleString("es-CO")
                      )}
                    </td>
                    <td>
                      {editingCatalogId === c.id ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={editFactor}
                          onChange={(e) => setEditFactor(e.target.value)}
                          className={styles.inputInline}
                        />
                      ) : (
                        Number(c.payrollFactor)
                      )}
                    </td>
                    <td>{c._count?.assignments ?? 0}</td>
                    <td>
                      {editingCatalogId === c.id ? (
                        <div className={styles.actions}>
                          <Button type="button" size="sm" onClick={() => handleCatalogSave(c)}>
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCatalogId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCatalogId(c.id);
                            setEditSalary(String(Number(c.monthlySalary)));
                            setEditFactor(String(Number(c.payrollFactor)));
                          }}
                        >
                          Editar sueldo
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <>
          {assignForm}
          {assignments.length === 0 ? (
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              Aún no hay asignaciones. Use el formulario de arriba o importe LISTADO
              TRABAJADORES.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Empleado</th>
                    <th>Zona</th>
                    <th>Catálogo asignado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.employee.documentNumber}</td>
                      <td>
                        {a.employee.firstName} {a.employee.lastName}
                      </td>
                      <td>{a.zoneName ?? "—"}</td>
                      <td>
                        <select
                          value={assignCatalogId[a.employeeId] ?? a.catalogId}
                          onChange={(e) =>
                            setAssignCatalogId((prev) => ({
                              ...prev,
                              [a.employeeId]: e.target.value,
                            }))
                          }
                          className={tabStyles.select}
                        >
                          {catalog.map((c) => (
                            <option key={c.id} value={c.id}>
                              {catalogOptionLabel(c)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Button type="button" size="sm" onClick={() => saveAssignment(a)}>
                          Guardar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <RecalculateModal
        open={modalOpen}
        affectedCount={affectedCount}
        employeeLabel={employeeLabel}
        periodCodes={periodCodes}
        loading={modalLoading}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
