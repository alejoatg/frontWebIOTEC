"use client";

import { useState } from "react";
import { Button } from "@/components";
import {
  downloadAuthenticatedFile,
  getTemplateDownloadUrl,
  previewImport,
  registerImport,
  type ImportPreview,
} from "../../api/overtimeApi";
import BatchRegisterSuccessModal from "../BatchRegisterSuccessModal/BatchRegisterSuccessModal";
import PeriodSelector from "../../components/PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";

const now = new Date();

export default function CargaContainer() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [successBatchId, setSuccessBatchId] = useState<string | null>(null);

  async function handlePreview() {
    if (!file) {
      setMessage({ type: "error", text: "Seleccione un archivo Excel" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await previewImport(year, month, file);
      setPreview(result);
      if (result.hasErrors) {
        setMessage({
          type: "error",
          text: `Hay ${result.errorRows} fila(s) con error. Corrija el Excel antes de registrar.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Vista previa OK: ${result.okRows} filas válidas${result.warningRows ? `, ${result.warningRows} con advertencia` : ""}.`,
        });
      }
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Error al validar" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await registerImport(year, month, file);
      setMessage({
        type: "success",
        text: `Planilla ${result.batchCode} registrada con ${result.entryCount} filas.`,
      });
      setPreview(null);
      setFile(null);
      setSuccessBatchId(result.batchId);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Error al registrar" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PeriodSelector
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
          setPreview(null);
        }}
      />

      <div className={styles.toolbar}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            downloadAuthenticatedFile(getTemplateDownloadUrl(), "plantilla-carga-ts.xlsx")
          }
        >
          Descargar plantilla
        </Button>
        <input
          type="file"
          accept=".xlsx,.xls"
          className={styles.fileInput}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setMessage(null);
          }}
        />
        <Button type="button" size="sm" disabled={!file || loading} onClick={handlePreview}>
          Validar (preview)
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!file || loading || !preview || preview.hasErrors}
          onClick={handleRegister}
        >
          Registrar planilla
        </Button>
      </div>

      {message && (
        <div
          className={`${styles.alert} ${
            message.type === "error"
              ? styles.alertError
              : message.type === "success"
                ? styles.alertSuccess
                : styles.alertInfo
          }`}
        >
          {message.text}
        </div>
      )}

      {preview && (
        <>
          <div className={styles.previewSummary}>
            <span>Total: {preview.totalRows}</span>
            <span>OK: {preview.okRows}</span>
            <span>Advertencias: {preview.warningRows}</span>
            <span>Errores: {preview.errorRows}</span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Resultado</th>
                  <th>Total</th>
                  <th>Mensajes</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.excelRowNumber}>
                    <td>{row.excelRowNumber}</td>
                    <td>{row.documentNumber}</td>
                    <td>{row.employeeFullName ?? "—"}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          row.result === "OK"
                            ? styles.badgeOk
                            : row.result === "WARNING"
                              ? styles.badgeWarning
                              : styles.badgeError
                        }`}
                      >
                        {row.result}
                      </span>
                    </td>
                    <td>{row.total.toLocaleString("es-CO")}</td>
                    <td>
                      {row.messages.map((m) => (
                        <div key={m.code}>{m.message}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {successBatchId && (
        <BatchRegisterSuccessModal
          batchId={successBatchId}
          onClose={() => setSuccessBatchId(null)}
        />
      )}
    </div>
  );
}
