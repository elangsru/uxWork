"use client";

import type { ReactNode } from "react";

import ReadOnlyField from "../shared/ReadOnlyField";
import { LOCALE } from "./data";

/**
 * «Form state» i Tools-menyen: hvert felt i redigeringsskjemaene kan settes
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
 * Statusen et felt faktisk får: fra Form state når den er slått på, ellers
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

// Tekstene som vises i read only. Samme format i alle tre skjemaene.

/** «Felleskonto 1503 24 78612», eller tom streng uten valgt konto. */
export function accountText(list: { content: string[] }[], key: string | null): string {
  if (key === null) return "";
  return list[Number(key)]?.content.join(" ") ?? "";
}

/** «12 345,00 kr» (eller «EUR 500,00» med valutakode), tom streng uten beløp. */
export function amountText(amount: string, currencyCode?: string): string {
  const n = parseFloat(amount);
  if (isNaN(n)) return "";
  const formatted = n.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currencyCode ? `${currencyCode} ${formatted}` : `${formatted} kr`;
}

/** «3. desember 2026» fra ISO-dato (YYYY-MM-DD), lest som lokal dato. */
export function dateText(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" });
}
