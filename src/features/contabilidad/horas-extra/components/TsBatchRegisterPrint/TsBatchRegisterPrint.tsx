"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { BatchRegisterPrintData } from "../../api/overtimeApi";
import { fmtHours, formatPrintDate } from "../../lib/tsPrintFormat";
import { formatClockTime } from "../../lib/timeFormat";

const PORTAL_ID = "ts-batch-print-portal";
const COLS = 11;

const PRINT_CSS = `
#${PORTAL_ID} .ts-print-root {
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
  font-size: 10px;
  line-height: 1.25;
}
#${PORTAL_ID} table.ts-main {
  width: 100%;
  border-collapse: collapse;
}
#${PORTAL_ID} table.ts-main > thead { display: table-header-group; }
#${PORTAL_ID} table.ts-main > tfoot { display: table-footer-group; }
#${PORTAL_ID} table.ts-main > tbody > tr {
  break-inside: avoid;
  page-break-inside: avoid;
}
#${PORTAL_ID} .ts-header-cell,
#${PORTAL_ID} .ts-footer-cell { padding: 0; border: none; }
#${PORTAL_ID} .ts-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 4px;
}
#${PORTAL_ID} .ts-logo { height: 38px; width: auto; display: block; }
#${PORTAL_ID} .ts-empresa { font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
#${PORTAL_ID} .ts-nit { font-size: 8.5px; color: #444; font-weight: 400; text-transform: none; }
#${PORTAL_ID} .ts-title .t1 { font-size: 13px; font-weight: 700; color: #1565c0; }
#${PORTAL_ID} .ts-title .t2 { font-size: 9px; color: #444; }
#${PORTAL_ID} .ts-datos {
  padding: 4px 0 6px;
  margin-top: 10px;
  margin-bottom: 6px;
}
#${PORTAL_ID} .ts-datos-grid {
  display: grid;
  grid-template-columns: minmax(0, 50%) minmax(0, 50%);
  gap: 3px 12px;
}
#${PORTAL_ID} .ts-dato { display: flex; align-items: baseline; gap: 4px; }
#${PORTAL_ID} .ts-dato .k { font-size: 9px; color: #555; white-space: nowrap; }
#${PORTAL_ID} .ts-dato .v { font-size: 9.5px; }
#${PORTAL_ID} thead .ts-cols th {
  border: none;
  border-bottom: 1px solid #bbb;
  padding: 3px;
  font-size: 7.5px;
  text-align: left;
  text-transform: uppercase;
}
#${PORTAL_ID} thead .ts-cols th.num { text-align: right; }
#${PORTAL_ID} thead .ts-cols th.cen { text-align: center; }
#${PORTAL_ID} td.cell {
  border: none;
  border-bottom: 0.5px solid #ccc;
  padding: 2.5px 3px;
  font-size: 8px;
  vertical-align: top;
}
#${PORTAL_ID} td.cell.num { text-align: right; white-space: nowrap; }
#${PORTAL_ID} td.cell.cen { text-align: center; }
#${PORTAL_ID} .ts-total {
  text-align: right;
  font-weight: 700;
  font-size: 10.5px;
  padding: 6px 2px;
}
#${PORTAL_ID} .ts-footer-wrap { padding-top: 10px; margin-top: 6px; }
#${PORTAL_ID} .ts-footer-spacer { visibility: hidden; }
#${PORTAL_ID} .ts-fixed-footer { display: none; }
@media print {
  #${PORTAL_ID} .ts-fixed-footer {
    display: block;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
#${PORTAL_ID} .ts-pie {
  text-align: center;
  font-style: italic;
  font-size: 8.5px;
  color: #444;
  padding: 4px 0 2px;
}
@media screen {
  #${PORTAL_ID} {
    display: block;
    max-width: 210mm;
    margin: 16px auto;
    border: 1px dashed #ccc;
    padding: 12px;
    background: #fff;
  }
  #${PORTAL_ID} .ts-fixed-footer {
    display: block;
    position: static;
    margin-top: 24px;
    border-top: 1px dashed #999;
  }
  #${PORTAL_ID} .ts-footer-spacer { display: none; }
}
`;

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="ts-dato">
      <span className="k">{k}</span>
      <span className="v">{v || "—"}</span>
    </div>
  );
}

function fmtMoney(n: number) {
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

interface Props {
  data: BatchRegisterPrintData;
}

export default function TsBatchRegisterPrint({ data }: Props) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.id = PORTAL_ID;
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  if (!container) return null;

  const printedDate = formatPrintDate(data.printedAt);
  const footerContent = (
    <div className="ts-footer-wrap">
      <div className="ts-pie">
        Soporte de registro · {data.batchCode} · {data.sourceLabel} · Contabilidad UTEN
      </div>
    </div>
  );

  const content = (
    <>
      <style>{PRINT_CSS}</style>
      <div className="ts-print-root">
        <table className="ts-main">
          <thead>
            <tr>
              <th className="ts-header-cell" colSpan={COLS}>
                <div className="ts-head">
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ts-logo" src="/images/logo-uten-print.png" alt="UTEN" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="ts-empresa">
                      Unión de trabajadores de la industria energética nacional - UTEN{" "}
                      <span className="ts-nit">· NIT: 900262482-5</span>
                    </div>
                  </div>
                  <div className="ts-title">
                    <div className="t1">{data.formTitle}</div>
                    <div className="t2">
                      {data.batchCode} · Impresión: {printedDate}
                    </div>
                  </div>
                </div>
                <div className="ts-datos">
                  <div className="ts-datos-grid">
                    <Dato k="Periodo" v={data.periodCode} />
                    <Dato k="Origen" v={data.sourceLabel} />
                    <Dato k="Registró" v={data.registeredBy} />
                    <Dato
                      k="Fecha registro"
                      v={new Date(data.registeredAt).toLocaleString("es-CO")}
                    />
                    {data.originalFilename ? (
                      <Dato k="Archivo" v={data.originalFilename} />
                    ) : (
                      <Dato k="Archivo" v="—" />
                    )}
                    <Dato k="Registros" v={String(data.entryCount)} />
                  </div>
                </div>
              </th>
            </tr>
            <tr className="ts-cols">
              <th>Código</th>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Fecha</th>
              <th className="cen">Inicio</th>
              <th className="cen">Fin</th>
              <th className="num">TSD</th>
              <th className="num">TSN</th>
              <th>Consigna</th>
              <th>Lugar</th>
              <th className="num">Total $</th>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td className="ts-footer-cell ts-footer-spacer" colSpan={COLS}>
                {footerContent}
              </td>
            </tr>
          </tfoot>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.entryCode}>
                <td className="cell">{row.entryCode}</td>
                <td className="cell">{row.employeeDocumentNumber}</td>
                <td className="cell">{row.employeeFullName}</td>
                <td className="cell">{row.workDate}</td>
                <td className="cell cen">{formatClockTime(row.startTime) || row.startTime}</td>
                <td className="cell cen">{formatClockTime(row.endTime) || row.endTime}</td>
                <td className="cell num">{fmtHours(row.hoursTsd)}</td>
                <td className="cell num">{fmtHours(row.hoursTsn)}</td>
                <td className="cell">{row.consigna}</td>
                <td className="cell">{row.commissionMunicipality}</td>
                <td className="cell num">{fmtMoney(row.amountTotal)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={COLS} className="ts-total">
                Total registros: {data.entryCount} · Total $: {fmtMoney(data.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="ts-fixed-footer">{footerContent}</div>
      </div>
    </>
  );

  return createPortal(content, container);
}
