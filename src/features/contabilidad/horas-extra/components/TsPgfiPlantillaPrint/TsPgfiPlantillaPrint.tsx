"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TsPlantillaPrintData } from "../../api/overtimeApi";
import { fmtHours, formatPrintDate } from "../../lib/tsPrintFormat";
import { formatClockTime } from "../../lib/timeFormat";

const PORTAL_ID = "ts-plantilla-print-portal";
const COLS = 12;

/**
 * Plantilla PGFI-001-04 vía HTML + window.print() (mismo mecanismo que
 * DocumentoValePrint en material-web: portal, thead/tfoot, pie fijo).
 */
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
#${PORTAL_ID} .ts-footer-cell {
  padding: 0;
  border: none;
}

#${PORTAL_ID} .ts-head {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding-bottom: 4px;
}
#${PORTAL_ID} .ts-head .ts-logo-box { flex: 0 0 auto; }
#${PORTAL_ID} .ts-head .ts-empresa-box { flex: 1 1 auto; }
#${PORTAL_ID} .ts-head .ts-title { flex: 0 0 auto; text-align: left; }
#${PORTAL_ID} .ts-head img.ts-logo { height: 38px; width: auto; display: block; }
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
#${PORTAL_ID} .ts-dato { display: flex; align-items: baseline; gap: 4px; text-align: left; }
#${PORTAL_ID} .ts-dato .k { font-size: 9px; color: #555; white-space: nowrap; }
#${PORTAL_ID} .ts-dato .v { font-size: 9.5px; font-weight: 400; }

#${PORTAL_ID} thead .ts-cols th {
  border: none;
  border-bottom: 1px solid #bbb;
  padding: 3px 3px;
  font-size: 7.5px;
  text-align: left;
  vertical-align: bottom;
  text-transform: uppercase;
  line-height: 1.15;
}
#${PORTAL_ID} thead .ts-cols th.num { text-align: right; }
#${PORTAL_ID} thead .ts-cols th.cen { text-align: center; }

#${PORTAL_ID} td.cell {
  border: none;
  border-bottom: 0.5px solid #ccc;
  padding: 2.5px 3px;
  font-size: 8.5px;
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

#${PORTAL_ID} .ts-note {
  font-size: 8.5px;
  color: #444;
  padding: 4px 2px;
}

#${PORTAL_ID} .ts-footer-wrap {
  padding-top: 10px;
  margin-top: 6px;
}
#${PORTAL_ID} .ts-footer-spacer {
  visibility: hidden;
}
#${PORTAL_ID} .ts-fixed-footer {
  display: none;
}
@media print {
  #${PORTAL_ID} .ts-fixed-footer {
    display: block;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
  }
}

#${PORTAL_ID} table.ts-firmas {
  width: 100%;
  border-collapse: collapse;
}
#${PORTAL_ID} table.ts-firmas td {
  width: 33.33%;
  vertical-align: bottom;
  padding: 6px 8px 2px;
  border: none;
}
#${PORTAL_ID} .fr-tit { font-weight: 700; font-size: 9.5px; }
#${PORTAL_ID} .fr-linea { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
#${PORTAL_ID} .fr-linea .lbl { font-size: 8.5px; white-space: nowrap; }
#${PORTAL_ID} .fr-linea .guia { flex: 1; border-bottom: 1px solid #999; height: 10px; }
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

function fmtMoney(n: number): string {
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

interface Props {
  data: TsPlantillaPrintData;
}

export default function TsPgfiPlantillaPrint({ data }: Props) {
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
  const rango =
    data.dateFrom || data.dateTo
      ? `${data.dateFrom ?? "…"} → ${data.dateTo ?? "…"}`
      : "Todo el periodo";

  const footerContent = (
    <div className="ts-footer-wrap">
      <table className="ts-firmas">
        <tbody>
          <tr>
            <td>
              <div className="fr-tit">Elaboró</div>
              <div className="fr-linea">
                <span className="lbl">Firma</span>
                <span className="guia" />
              </div>
            </td>
            <td>
              <div className="fr-tit">Revisó</div>
              <div className="fr-linea">
                <span className="lbl">Firma</span>
                <span className="guia" />
              </div>
            </td>
            <td>
              <div className="fr-tit">Autorizó</div>
              <div className="fr-linea">
                <span className="lbl">Firma</span>
                <span className="guia" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="ts-pie">
        {data.formCode} · {data.plantillaCode} · Contabilidad UTEN
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
                  <div className="ts-logo-box">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="ts-logo"
                      src="/images/logo-uten-print.png"
                      alt="UTEN"
                    />
                  </div>
                  <div className="ts-empresa-box">
                    <div className="ts-empresa">
                      Unión de trabajadores de la industria energética nacional - UTEN{" "}
                      <span className="ts-nit">· NIT: 900262482-5</span>
                    </div>
                  </div>
                  <div className="ts-title">
                    <div className="t1">
                      {data.formTitle} No. {data.plantillaCode}
                    </div>
                    <div className="t2">
                      {data.formCode} v{data.formVersion} · Fecha impresión: {printedDate}
                    </div>
                  </div>
                </div>
                <div className="ts-datos">
                  <div className="ts-datos-grid">
                    <Dato k="Zona" v={data.zoneName} />
                    <Dato k="Municipio sede" v={data.municipality} />
                    <Dato k="Mes / periodo" v={`${data.monthLabel} (${data.periodCode})`} />
                    <Dato k="Rango fechas" v={rango} />
                    <Dato k="Nombre" v={data.employeeFullName} />
                    <Dato k="Cédula" v={data.employeeDocumentNumber} />
                    <Dato k="Cargo" v={data.jobPositionName} />
                    <Dato k="Proceso" v={data.processName} />
                  </div>
                </div>
              </th>
            </tr>
            <tr className="ts-cols">
              <th>Fecha</th>
              <th>Consigna / Incidencia</th>
              <th className="cen">Inicio (HH:mm)</th>
              <th className="cen">Fin (HH:mm)</th>
              <th className="num">Disp.</th>
              <th className="num">TS Diurno</th>
              <th className="num">TS Noct.</th>
              <th className="num">TS Dom. D</th>
              <th className="num">TS Dom. N</th>
              <th className="num">Dom./Fest.</th>
              <th className="num">Rec. noct.</th>
              <th>Lugar comisión</th>
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
            {data.rows.map((row, i) => (
              <tr key={i}>
                <td className="cell">{row.workDate}</td>
                <td className="cell">{row.consigna}</td>
                <td className="cell cen">{formatClockTime(row.startTime)}</td>
                <td className="cell cen">{formatClockTime(row.endTime)}</td>
                <td className="cell num">{fmtHours(row.hoursDisponibilidad)}</td>
                <td className="cell num">{fmtHours(row.hoursTsd)}</td>
                <td className="cell num">{fmtHours(row.hoursTsn)}</td>
                <td className="cell num">{fmtHours(row.hoursHedd)}</td>
                <td className="cell num">{fmtHours(row.hoursHend)}</td>
                <td className="cell num">{fmtHours(row.hoursRd)}</td>
                <td className="cell num">{fmtHours(row.hoursRn)}</td>
                <td className="cell">{row.commissionMunicipality}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={COLS} className="ts-total">
                Total registros: {data.entryCount} · Total $: {fmtMoney(data.totalAmount)}
              </td>
            </tr>
            <tr>
              <td colSpan={COLS} className="ts-note">
                * Disponibilidad aplica solo para Alta Tensión y Subestaciones
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
