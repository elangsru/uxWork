"use client";

import type { ReactNode } from "react";

import ReadOnlyField from "../shared/ReadOnlyField";

/**
 * «Field status» i Tools-menyen: hvert felt i redigeringsskjemaene kan settes
 * til redigerbart, deaktivert eller read only, for å simulere ulike UI-er.
 * Når statusene er satt, overstyrer de skjemaenes egne regler (låst KID,
 * låst lån, låst til-konto for fond).
 */

export type FieldKey = "fromAccount" | "toAccount" | "currency" | "amount" | "message" | "kid" | "paymentDate";
export type FieldStatus = "editable" | "disabled" | "readOnly";
export type FieldStatusMap = Record<FieldKey, FieldStatus>;

/** Rekkefølgen i Tools-menyen. */
export const FIELD_LABELS: { key: FieldKey; label: string }[] = [
  { key: "fromAccount", label: "Fra konto" },
  { key: "toAccount", label: "Til konto" },
  { key: "currency", label: "Valuta" },
  { key: "amount", label: "Beløp" },
  { key: "message", label: "Melding" },
  { key: "kid", label: "KID" },
  { key: "paymentDate", label: "Betalingsdato" },
];

export const FIELD_STATUS_OPTIONS: { value: FieldStatus; label: string }[] = [
  { value: "editable", label: "Editable" },
  { value: "disabled", label: "Disabled" },
  { value: "readOnly", label: "Read only" },
];

export const DEFAULT_FIELD_STATUS: FieldStatusMap = {
  fromAccount: "editable",
  toAccount: "editable",
  currency: "editable",
  amount: "editable",
  message: "editable",
  kid: "editable",
  paymentDate: "editable",
};

/**
 * Statusen et felt faktisk får: fra Field status når den er slått på, ellers
 * skjemaets egen regel (`legacyDisabled`), som før funksjonen fantes.
 */
export function resolveFieldStatus(
  fieldStatus: FieldStatusMap | undefined,
  key: FieldKey,
  legacyDisabled = false,
): FieldStatus {
  if (fieldStatus) return fieldStatus[key];
  return legacyDisabled ? "disabled" : "editable";
}

/**
 * Viser feltet som vanlig, deaktivert, eller som read only (etikett + grå
 * tekst). `children` får `disabled` og rendrer selve feltet, så feltets egen
 * state (det brukeren har skrevet) ligger i skjemaet og overlever bytte av
 * status. Tom verdi i read only vises som «–».
 */
export function ConfigurableField({
  status,
  label,
  value,
  children,
}: {
  status: FieldStatus;
  label: string;
  value: string;
  children: (disabled: boolean) => ReactNode;
}) {
  if (status === "readOnly") return <ReadOnlyField label={label} lines={[value || "–"]} />;
  return <>{children(status === "disabled")}</>;
}
