"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useMotorcycles } from "../../hooks/useMotorcycles";
import {
  createMotorcycle,
  updateMotorcycle,
  deactivateMotorcycle,
} from "../../api/motorcyclesApi";
import { MotorcyclesTable } from "../MotorcyclesTable";
import { MotorcycleFormModal } from "../MotorcycleFormModal";
import { MotorcycleDetailModal } from "../MotorcycleDetailModal";
import { ConfirmModal } from "../ConfirmModal";
import type { Motorcycle, CreateMotorcyclePayload } from "../../types";
import styles from "./MotorcyclesContainer.module.scss";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; motorcycle: Motorcycle }
  | { type: "detail"; motorcycle: Motorcycle }
  | { type: "deactivate"; motorcycle: Motorcycle };

export default function MotorcyclesContainer() {
  const { motorcycles, loading, error, refetch } = useMotorcycles();
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const closeModal = () => {
    setModal({ type: "closed" });
    setActionError(null);
  };

  const handleCreate = async (data: CreateMotorcyclePayload) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await createMotorcycle(data);
      closeModal();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data: CreateMotorcyclePayload) => {
    if (modal.type !== "edit") return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateMotorcycle(modal.motorcycle.id, data);
      closeModal();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (modal.type !== "deactivate") return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deactivateMotorcycle(modal.motorcycle.id);
      closeModal();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al inactivar");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Cargando motocicletas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button type="button" className={styles.retryBtn} onClick={refetch}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.summary}>
            <span className={styles.count}>{motorcycles.length}</span>
            <span className={styles.countLabel}>
              {motorcycles.length === 1 ? "motocicleta" : "motocicletas"}
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={refetch}
            aria-label="Actualizar lista"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setModal({ type: "create" })}
          >
            <Plus size={18} />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className={styles.actionError}>
          <p>{actionError}</p>
        </div>
      )}

      <MotorcyclesTable
        motorcycles={motorcycles}
        onView={(m) => setModal({ type: "detail", motorcycle: m })}
        onEdit={(m) => setModal({ type: "edit", motorcycle: m })}
        onDeactivate={(m) => setModal({ type: "deactivate", motorcycle: m })}
      />

      <MotorcycleFormModal
        open={modal.type === "create"}
        loading={actionLoading}
        onSubmit={handleCreate}
        onClose={closeModal}
      />

      <MotorcycleFormModal
        open={modal.type === "edit"}
        motorcycle={modal.type === "edit" ? modal.motorcycle : null}
        loading={actionLoading}
        onSubmit={handleUpdate}
        onClose={closeModal}
      />

      <MotorcycleDetailModal
        open={modal.type === "detail"}
        motorcycle={modal.type === "detail" ? modal.motorcycle : null}
        onClose={closeModal}
      />

      <ConfirmModal
        open={modal.type === "deactivate"}
        title="Inactivar Motocicleta"
        message={
          modal.type === "deactivate"
            ? `¿Estás seguro de que deseas inactivar la motocicleta con placa ${modal.motorcycle.placa}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Inactivar"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeactivate}
        onCancel={closeModal}
      />
    </div>
  );
}
