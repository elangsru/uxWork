"use client";

import { useState } from "react";
import { Autocomplete, Avatar, DatePicker, FormLabel, FormStatus, Input, InputMasked, List, Textarea } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";
import { ainvoice_medium, attachment_medium, office_buildings } from "@dnb/eufemia/icons";

import { fromAccountList, fromAccounts } from "../internationalPayment/paymentData";
import type { Transaction } from "./data";
import EditPaymentActions from "./EditPaymentActions";
import { ConfigurableField, accountText, amountText, dateText, resolveFieldStatus, type FieldKey, type FieldStatusMap } from "./fieldStatus";

/** Samme grense som meldingsfeltet på /domesticPayment. */
const messageMaxLength = 70;

/**
 * Innenlands motstykke til EditPaymentForm. Feltene følger /domesticPayment.
 * En eFaktura (Tibber) eller AvtaleGiro (Happybytes) har låst KID, en vanlig
 * betaling (Kim Olsen) har en redigerbar melding i stedet. Beløpet kan
 * redigeres i alle.
 */
export default function EditDomesticPaymentForm({
  tx,
  accountName,
  onClose,
  initiallyStopped = false,
  fieldStatus,
}: {
  tx: Transaction;
  /** Kontonavnet fra betalingsoversikten, for å forhåndsvelge «Fra konto». */
  accountName: string;
  /** Knappene i bunnen gjør ingenting ennå utover å lukke modalen. */
  onClose: () => void;
  /** Stoppet med «Show warnings» i oversikten — modalen åpner da i stoppet tilstand. */
  initiallyStopped?: boolean;
  /** Form state fra Tools-menyen. Satt: overstyrer KID-regelen per felt.
   *  Utelatt: feltene følger dagens regler. */
  fieldStatus?: FieldStatusMap;
}) {
  const [selectedFromKey, setSelectedFromKey] = useState<string | null>(() => {
    const i = fromAccountList.findIndex((a) => a.content[0] === accountName);
    return i >= 0 ? String(i) : null;
  });
  const [paymentDate, setPaymentDate] = useState(tx.dateValue);
  const [message, setMessage] = useState(tx.message ?? "");
  // KID i state, så det brukeren skriver (når Form state gjør feltet
  // redigerbart) overlever bytte av status og vises i read only.
  const [kid, setKid] = useState(tx.kid ?? "");
  const [amount, setAmount] = useState(String(tx.amountNok));
  const [stopped, setStopped] = useState(initiallyStopped);

  // Egne id-er, så de ikke kolliderer med feltene på /domesticPayment.
  const fromAccountFieldId = "edit-domestic-payment-from-account";
  const status = (key: FieldKey, legacyDisabled = false) => resolveFieldStatus(fieldStatus, key, legacyDisabled);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* 488px er bredden på skjemaet på /domesticPayment. Knapperaden under
          ligger utenfor, så den kan gå over hele modalens bredde. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px" }}>
        {/* Samme mottakerboks som i EditPaymentForm, uten flagg. Avataren
            er medium som på steg 1, med bokstav for person og ikon for
            selskap som i oversikten. */}
        <div className="po-edit-recipient">
          <List.Container>
            <List.Item.Basic>
              <List.Cell.Start>
                {tx.avatarKind === "person" ? (
                  <Avatar size="medium" variant="primary" hasLabel aria-hidden>
                    {tx.recipient}
                  </Avatar>
                ) : (
                  <Avatar size="medium" variant="primary" icon={office_buildings} hasLabel aria-hidden />
                )}
              </List.Cell.Start>
              <List.Cell.Title>
                {tx.recipient}
                {tx.toAccount && <List.Cell.Title.Subline>{tx.toAccount}</List.Cell.Title.Subline>}
              </List.Cell.Title>
              {/* Varselet ligger i mottakerraden, som adressevarselet på
                  steg 1. Lokal tilstand: nullstilles når modalen lukkes,
                  siden skjemaet monteres på nytt for hver åpning. */}
              {stopped && (
                <List.Cell.Footer>
                  <FormStatus state="warning" text="Betalingen er stoppet." stretch />
                </List.Cell.Footer>
              )}
            </List.Item.Basic>
            {/* eFaktura lenker til vedlegget, AvtaleGiro til avtalen. Begge
                åpnes i ny fane; Eufemias lenke legger selv på launch-ikonet
                ved target="_blank", og chevronen som List.Item.Action alltid
                tegner skjules i CSS (.po-edit-attachment). */}
            {(tx.type === "efaktura" || tx.type === "avtalegiro") && (
              <List.Item.Action
                className="po-edit-attachment"
                href={
                  tx.type === "efaktura"
                    ? "https://www.google.com"
                    : "https://www.dnb.no/segp/ps/applikasjoner/payment-agreements/DirectDebit/70871410354138/details"
                }
                target="_blank"
                rel="noopener noreferrer"
                icon={tx.type === "efaktura" ? attachment_medium : ainvoice_medium}
                title={tx.type === "efaktura" ? "eFakturavedlegg" : "AvtaleGiro-avtale"}
              />
            )}
          </List.Container>
        </div>

        {/* FormLabel står utenfor feltet; i read only erstatter ReadOnlyField
            hele blokken, så etiketten ikke står to ganger. */}
        <ConfigurableField
          status={status("fromAccount")}
          label="Fra konto"
          value={accountText(fromAccountList, selectedFromKey)}
        >
          {(disabled) => (
            <div>
              <FormLabel forId={fromAccountFieldId} style={{ marginBottom: "0.5rem" }}>
                Fra konto
              </FormLabel>
              <Autocomplete
                id={fromAccountFieldId}
                size="medium"
                data={fromAccounts}
                placeholder="Velg konto"
                stretch
                disabled={disabled}
                showSubmitButton
                submitButtonTitle=""
                value={selectedFromKey ?? undefined}
                onChange={({ selectedItem }) =>
                  setSelectedFromKey(typeof selectedItem === "number" ? String(selectedItem) : null)
                }
              />
            </div>
          )}
        </ConfigurableField>

        <ConfigurableField status={status("amount")} label="Beløp" value={amountText(amount)}>
          {(disabled) => (
            <InputMasked
              label="Beløp"
              size="medium"
              stretch
              disabled={disabled}
              numberMask={{
                suffix: " kr",
                allowDecimal: true,
                decimalLimit: 2,
                thousandsSeparatorSymbol: " ",
                decimalSymbol: ",",
              }}
              placeholder="kr"
              value={amount}
              onChange={({ numberValue }) =>
                setAmount(numberValue !== undefined && !isNaN(numberValue) ? String(numberValue) : "")
              }
            />
          )}
        </ConfigurableField>

        {/* KID kommer fra fakturaen og kan ikke endres (uten Form state). */}
        {tx.kid ? (
          <ConfigurableField status={status("kid", true)} label="KID" value={kid}>
            {(disabled) => (
              <Input
                label="KID"
                size="medium"
                stretch
                disabled={disabled}
                value={kid}
                onChange={({ value }) => setKid(value)}
              />
            )}
          </ConfigurableField>
        ) : (
          <ConfigurableField status={status("message")} label="Melding" value={message}>
            {(disabled) => (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Textarea
                  label="Melding"
                  size="medium"
                  stretch
                  disabled={disabled}
                  rows={1}
                  autoResize
                  autoResizeMaxRows={6}
                  value={message}
                  maxLength={messageMaxLength}
                  onChange={({ value }) => setMessage(value)}
                />
                {!disabled && (
                  <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
                    {messageMaxLength - message.length} av {messageMaxLength} tegn gjenstår.
                  </P>
                )}
              </div>
            )}
          </ConfigurableField>
        )}

        <ConfigurableField status={status("paymentDate")} label="Betalingsdato" value={dateText(paymentDate)}>
          {(disabled) => (
            <DatePicker
              label="Betalingsdato"
              size="medium"
              showInput
              disabled={disabled}
              date={paymentDate}
              onChange={({ date }) => {
                if (date) setPaymentDate(date);
              }}
            />
          )}
        </ConfigurableField>

      </div>

      <EditPaymentActions onClose={onClose} stopped={stopped} onToggleStop={() => setStopped(!stopped)} />
    </div>
  );
}
