"use client";

import { useCallback, useState } from "react";
import { AlertCircle, IdCard } from "lucide-react";
import { linkEmployee } from "../../api/linkEmployeeApi";
import type { LinkEmployeeErrorCode } from "@/types/auth";
import styles from "./EmployeeLinkBanner.module.scss";

interface Props {
  onLinked: () => void;
}

const ERROR_MESSAGES: Record<LinkEmployeeErrorCode, string> = {
  EMPLOYEE_NOT_FOUND:
    "No estás registrado como empleado. Comunícate con administración para solicitar tu registro.",
  EMPLOYEE_ALREADY_LINKED: "Esta cédula ya está vinculada a otra cuenta de Google.",
  USER_ALREADY_LINKED: "Tu cuenta ya está vinculada a un empleado.",
  EMPLOYEE_INACTIVE: "Tu registro laboral no está activo. Comunícate con administración.",
  INVALID_DOCUMENT: "Ingresa un número de cédula válido (solo dígitos).",
};

export default function EmployeeLinkBanner({ onLinked }: Props) {
  const [documentNumber, setDocumentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const digits = documentNumber.replace(/\D/g, "");
      if (!digits) {
        setError(ERROR_MESSAGES.INVALID_DOCUMENT);
        return;
      }
      setLoading(true);
      try {
        await linkEmployee(digits);
        onLinked();
      } catch (err) {
        const code = (err as Error & { code?: LinkEmployeeErrorCode }).code;
        setError(
          code && ERROR_MESSAGES[code]
            ? ERROR_MESSAGES[code]
            : err instanceof Error
              ? err.message
              : "Error al vincular",
        );
        if (code === "EMPLOYEE_NOT_FOUND") {
          setShowHelp(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [documentNumber, onLinked],
  );

  return (
    <div className={styles.banner} role="region" aria-label="Vinculación de cédula">
      <div className={styles.iconWrap}>
        <IdCard size={28} aria-hidden />
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>Vincula tu cédula</h2>
        <p className={styles.text}>
          Para usar IOTEC Forms confirma tu número de cédula. Debe coincidir con el registro de
          empleados de UTEN.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={15}
            className={styles.input}
            placeholder="Número de cédula"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
            disabled={loading}
            aria-label="Número de cédula"
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Verificando…" : "Vincular"}
          </button>
        </form>
        {error ? (
          <p className={styles.error} role="alert">
            <AlertCircle size={16} aria-hidden />
            {error}
          </p>
        ) : null}
        {showHelp ? (
          <p className={styles.help}>
            Si acabas de ingresar a UTEN, solicita a Talento Humano o administración que den de alta
            tu ficha con esta cédula antes de vincular.
          </p>
        ) : null}
      </div>
    </div>
  );
}
