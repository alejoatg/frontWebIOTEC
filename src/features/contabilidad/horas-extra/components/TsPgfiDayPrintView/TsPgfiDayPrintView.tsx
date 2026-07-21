"use client";

import { Button } from "@/components";
import type { TsDayPrintData } from "../../api/overtimeApi";
import { buildPrintRows, fmtHours, formatPrintDate } from "../../lib/tsPrintFormat";
import styles from "./TsPgfiDayPrintView.module.scss";

interface TsPgfiDayPrintViewProps {
  data: TsDayPrintData;
  onClose?: () => void;
}

export default function TsPgfiDayPrintView({ data, onClose }: TsPgfiDayPrintViewProps) {
  const rows = buildPrintRows(data);
  const printedDate = formatPrintDate(data.printedAt);

  return (
    <div className={styles.root}>
      <div className={`${styles.toolbar} no-print`}>
        <div className={styles.toolbarInfo}>
          <strong>{data.formCode}</strong> — {data.employeeFullName} ({data.workDateLabel})
        </div>
        <div className={styles.toolbarActions}>
          <Button type="button" size="sm" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </Button>
          {onClose ? (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => window.close()}>
              Cerrar
            </Button>
          )}
        </div>
      </div>

      <article className={styles.sheet}>
        <header className={styles.sheetHeader}>
          <div className={styles.headerTop}>
            <div className={styles.logoWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-uten-print.png"
                alt="UTEN"
                className={styles.logo}
              />
            </div>

            <h1 className={styles.title}>{data.formTitle}</h1>

            <div className={styles.metaBox}>
              <table>
                <tbody>
                  <tr>
                    <th>Código:</th>
                    <td>{data.formCode}</td>
                  </tr>
                  <tr>
                    <th>Versión:</th>
                    <td>{data.formVersion}</td>
                  </tr>
                  <tr>
                    <th>Fecha:</th>
                    <td>{printedDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.topFields}>
            <div className={styles.fieldLine}>
              <span className={styles.fieldLabel}>ZONA:</span>
              <span className={styles.fieldValue}>{data.zoneName}</span>
            </div>
            <div className={styles.fieldLine}>
              <span className={styles.fieldLabel}>MUNICIPIO:</span>
              <span className={styles.fieldValue}>{data.municipality}</span>
            </div>
            <div className={styles.fieldLine}>
              <span className={styles.fieldLabel}>MES:</span>
              <span className={styles.fieldValue}>{data.monthLabel}</span>
            </div>
          </div>

          <div className={styles.employeeHeader}>
            <div className={styles.employeeRow}>
              <span className={styles.fieldLabel}>NOMBRES Y APELLIDOS:</span>
              <span className={styles.fieldValueWide}>{data.employeeFullName}</span>
              <span className={styles.fieldLabel}>CÉDULA:</span>
              <span className={styles.fieldValueMedium}>{data.employeeDocumentNumber}</span>
            </div>
            <div className={styles.employeeRow}>
              <span className={styles.fieldLabel}>PROCESO:</span>
              <span className={styles.fieldValueWide}>{data.processName}</span>
              <span className={styles.fieldLabel}>CARGO:</span>
              <span className={styles.fieldValueMedium}>{data.jobPositionName}</span>
            </div>
          </div>
        </header>

        <table className={styles.grid}>
          <thead>
            <tr>
              <th rowSpan={2}>
                FECHA LABOR
                <br />
                DESARROLLADA
              </th>
              <th rowSpan={2}>
                (Consigna/
                <br />
                Incidencia)
              </th>
              <th colSpan={2}>HORA DE</th>
              <th rowSpan={2}>
                DISPONI-
                <br />
                BILIDAD
              </th>
              <th rowSpan={2}>
                TIEMPO SUPL
                <br />
                DIURNO
              </th>
              <th rowSpan={2}>
                TIEMPO SUPL
                <br />
                NOCTURNO
              </th>
              <th rowSpan={2}>
                TIEMPO SUPL
                <br />
                DOMINICAL /
                <br />
                FESTIVO
                <br />
                DIURNO
              </th>
              <th rowSpan={2}>
                TIEMPO SUPL
                <br />
                DOMINICAL /
                <br />
                FESTIVO
                <br />
                NOCTURNO
              </th>
              <th rowSpan={2}>
                DOMINICALES
                <br />/ FESTIVOS
              </th>
              <th rowSpan={2}>
                RECARGO
                <br />
                NOCTURNO
              </th>
              <th rowSpan={2}>LUGAR DE COMISIÓN</th>
            </tr>
            <tr>
              <th>
                INICIO
                <br />
                (HH:mm)
              </th>
              <th>
                FINAL
                <br />
                (HH:mm)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{row.workDate}</td>
                <td className={styles.textCell}>{row.consigna}</td>
                <td className={styles.numCell}>{row.startTime}</td>
                <td className={styles.numCell}>{row.endTime}</td>
                <td className={styles.numCell}>{fmtHours(row.hoursDisponibilidad)}</td>
                <td className={styles.numCell}>{fmtHours(row.hoursTsd)}</td>
                <td className={styles.numCell}>{fmtHours(row.hoursTsn)}</td>
                <td className={styles.numCell}>{fmtHours(row.hoursHedd)}</td>
                <td className={styles.numCell}>{fmtHours(row.hoursHend)}</td>
                <td className={styles.numCell}>{fmtHours(row.hoursRd)}</td>
                <td className={styles.numCell}>{fmtHours(row.hoursRn)}</td>
                <td className={styles.textCell}>{row.commissionMunicipality}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.footnote}>
          * Disponibilidad aplica solo para Alta Tensión y Subestaciones
        </p>

        <footer className={styles.signatures}>
          <div className={styles.signatureCol}>
            <div>Elaboró: ______________________________________</div>
            <div>Firma: ________________________________________</div>
          </div>
          <div className={styles.signatureCol}>
            <div>Revisó: ______________________________________</div>
            <div>Firma: _______________________________________</div>
          </div>
          <div className={styles.signatureCol}>
            <div>Autorizó: _________________________________________</div>
            <div>Firma: ___________________________________________</div>
          </div>
        </footer>
      </article>
    </div>
  );
}
