"use client";

import { Button } from "@/components/Button";
import type { FormReportConfig } from "../../../config/formReportTypes";
import FormSubmissionSheet from "./FormSubmissionSheet";
import styles from "./FormSubmissionPrint.module.scss";

export interface FormSubmissionPrintProps {
  config: FormReportConfig;
  record: Record<string, unknown>;
}

export default function FormSubmissionPrint({
  config,
  record,
}: FormSubmissionPrintProps) {
  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          <strong>{config.title}</strong>
          <span>{config.detailTitle(record)}</span>
        </div>
        <div className={styles.toolbarActions}>
          <Button type="button" size="sm" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.close()}
          >
            Cerrar
          </Button>
        </div>
      </div>

      <FormSubmissionSheet config={config} record={record} />
    </div>
  );
}
