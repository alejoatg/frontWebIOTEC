"use client";

import FormReportContainer from "../shared/FormReportContainer";
import IgeiSupervisionDaysPanel from "./IgeiSupervisionDaysPanel";

export default function IgeiSupervisionReport() {
  return (
    <>
      <FormReportContainer slug="igei-supervision-terreno" />
      <IgeiSupervisionDaysPanel />
    </>
  );
}
