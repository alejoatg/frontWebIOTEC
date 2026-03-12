"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components";
import { UserSelector } from "../UserSelector";
import type { Motorcycle, CreateMotorcyclePayload } from "../../types";
import type { UserListItem } from "../../api/usersApi";
import styles from "./MotorcycleFormModal.module.scss";

export interface MotorcycleFormModalProps {
  open: boolean;
  motorcycle?: Motorcycle | null;
  loading?: boolean;
  onSubmit: (data: CreateMotorcyclePayload) => void;
  onClose: () => void;
}

const EMPTY_FORM: CreateMotorcyclePayload = {
  placa: "",
  modelo: "",
  propietario: "",
  cedula: "",
  tipo: "",
  marca: "",
  cilindraje: "",
  telefono: "",
};

export default function MotorcycleFormModal({
  open,
  motorcycle,
  loading = false,
  onSubmit,
  onClose,
}: MotorcycleFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<CreateMotorcyclePayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateMotorcyclePayload, string>>>({});

  const isEdit = Boolean(motorcycle);

  useEffect(() => {
    if (open && motorcycle) {
      setForm({
        placa: motorcycle.placa,
        modelo: motorcycle.modelo,
        propietario: motorcycle.propietario,
        cedula: motorcycle.cedula,
        tipo: motorcycle.tipo,
        marca: motorcycle.marca,
        cilindraje: motorcycle.cilindraje,
        telefono: motorcycle.telefono,
        userId: motorcycle.userId || undefined,
      });
    } else if (open) {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [open, motorcycle]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleChange = (field: keyof CreateMotorcyclePayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleUserSelect = (userId: string | null, user: UserListItem | null) => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        userId,
        propietario: user.name,
        cedula: "",
        telefono: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        userId: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateMotorcyclePayload, string>> = {};

    if (!form.placa.trim()) newErrors.placa = "La placa es obligatoria";
    if (!form.modelo.trim()) newErrors.modelo = "El modelo es obligatorio";
    if (!form.propietario.trim()) newErrors.propietario = "El propietario es obligatorio";
    if (!form.cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
    if (!form.tipo.trim()) newErrors.tipo = "El tipo es obligatorio";
    if (!form.marca.trim()) newErrors.marca = "La marca es obligatoria";
    if (!form.cilindraje.trim()) newErrors.cilindraje = "El cilindraje es obligatorio";
    if (!form.telefono.trim()) newErrors.telefono = "El teléfono es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <form onSubmit={handleSubmit} className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {isEdit ? "Editar Motocicleta" : "Nueva Motocicleta"}
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.userSection}>
          <UserSelector
            value={form.userId || null}
            onSelect={handleUserSelect}
            disabled={loading}
          />
        </div>

        <div className={styles.grid}>
          <Input
            label="Placa"
            placeholder="Ej: ABC123"
            value={form.placa}
            onChange={(e) => handleChange("placa", e.target.value)}
            error={errors.placa}
            disabled={loading}
          />
          <Input
            label="Marca"
            placeholder="Ej: Yamaha"
            value={form.marca}
            onChange={(e) => handleChange("marca", e.target.value)}
            error={errors.marca}
            disabled={loading}
          />
          <Input
            label="Modelo"
            placeholder="Ej: 2024"
            value={form.modelo}
            onChange={(e) => handleChange("modelo", e.target.value)}
            error={errors.modelo}
            disabled={loading}
          />
          <Input
            label="Tipo"
            placeholder="Ej: Enduro, Scooter"
            value={form.tipo}
            onChange={(e) => handleChange("tipo", e.target.value)}
            error={errors.tipo}
            disabled={loading}
          />
          <Input
            label="Cilindraje"
            placeholder="Ej: 150cc"
            value={form.cilindraje}
            onChange={(e) => handleChange("cilindraje", e.target.value)}
            error={errors.cilindraje}
            disabled={loading}
          />
          <Input
            label="Propietario"
            placeholder="Nombre completo"
            value={form.propietario}
            onChange={(e) => handleChange("propietario", e.target.value)}
            error={errors.propietario}
            disabled={loading}
          />
          <Input
            label="Cédula"
            placeholder="Número de documento"
            value={form.cedula}
            onChange={(e) => handleChange("cedula", e.target.value)}
            error={errors.cedula}
            disabled={loading}
          />
          <Input
            label="Teléfono"
            placeholder="Ej: 3001234567"
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            error={errors.telefono}
            disabled={loading}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Crear motocicleta"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
