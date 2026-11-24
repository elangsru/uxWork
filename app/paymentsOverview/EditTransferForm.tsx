"use client";

import { useState } from "react";
import { Autocomplete, DatePicker, FormStatus, Input, InputMasked, Textarea } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";

import { fromAccountList, fromAccounts } from "../internationalPayment/paymentData";
import type { Transaction } from "./data";
import EditPaymentActions from "./EditPaymentActions";
import { ConfigurableField, accountText, amountText, dateText, resolveFieldStatus, type FieldKey, type FieldStatusMap } from "./fieldStatus";

/** Samme grense som meldingsfeltet på /domesticPayment. */
const messageMaxLength = 70;

/** Spare-, fonds- og lånekontoene overføringer går til. Ligger ikke i fromAccountList
 *  fordi den deles med betalingssidene, der man ikke betaler fra disse. */
const savingsAccountList = [
  { content: ["Sparing bryllup", "1503 61 92045"], suffixValue: "NOK 18 300,00" },
  { content: ["ASK", "1503 72 18564"], suffixValue: "NOK 64 820,00" },
  // Fondskontoen viser ikke saldo — et fondskjøp handler ikke om hva som står
  // på kontoen.
  { content: ["DNB Global index", "1503 74 50931"] },
  { content: ["Boliglånet", "1503 88 30417"], suffixValue: "NOK -2 450 000,00" },
];

// Til-listen er egne kontoer pluss sparekontoene. Nøklene fortsetter etter
// fromAccounts, så en indeks peker på samme konto i begge listene.
const toAccountList = [...fromAccountList, ...savingsAccountList];
const toAccounts = toAccountList.map((a, i) => ({ ...a, selectedKey: String(i) }));

/**
 * Overføring mellom egne kontoer. I stedet for mottakerboksen i de andre
 * modalene velges både fra- og til-konto, ellers samme felt og knapper.
 * `readOnly` brukes for avdrag på lån (Boliglånet): alle felt er låst, og
 * Stopp og Slett er ikke tillatt. Fondskjøp (DNB Global index) har låst
 * til-konto og KID i stedet for melding, som en eFaktura. ASK har ingen
 * melding.
 */
export default function EditTransferForm({
  tx,
  accountName,
  onClose,
  initiallyStopped = false,
  readOnly = false,
  fieldStatus,
}: {
  tx: Transaction;
  /** Kontonavnet fra betalingsoversikten, for å forhåndsvelge «Fra konto». */
  accountName: string;
  /** Knappene i bunnen gjør ingenting ennå utover å lukke modalen. */
  onClose: () => void;
  /** Stoppet med «Show warnings» i oversikten — modalen åpner da i stoppet tilstand. */
  initiallyStopped?: boolean;
  readOnly?: boolean;
  /** Field status fra Tools-menyen. Satt: overstyrer readOnly, fond og KID-
   *  regelen per felt. Utelatt: feltene følger reglene over. */
  fieldStatus?: FieldStatusMap;
}) {
  const indexOf = (name: string) => {
    const i = toAccountList.findIndex((a) => a.content[0] === name);
    return i >= 0 ? String(i) : null;
  };

  const [selectedFromKey, setSelectedFromKey] = useState<string | null>(() => indexOf(accountName));
  // Mottakeren på en overføring er navnet på til-kontoen.
  const [selectedToKey, setSelectedToKey] = useState<string | null>(() => indexOf(tx.recipient));
  const [amount, setAmount] = useState(String(tx.amountNok));
  const [message, setMessage] = useState(tx.message ?? "");
  // KID i state, så det brukeren skriver (når Field status gjør feltet
  // redigerbart) overlever bytte av status og vises i read only.
  const [kid, setKid] = useState(tx.kid ?? "");
  const [paymentDate, setPaymentDate] = useState(tx.dateValue);
  const [stopped, setStopped] = useState(initiallyStopped);
  const isFund = tx.icon === "funds";
  // Overføring til aksjesparekonto (ASK) har verken melding eller KID.
  const isAsk = tx.icon === "investment";
  const status = (key: FieldKey, legacyDisabled = false) => resolveFieldStatus(fieldStatus, key, legacyDisabled);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* 488px er bredden på skjemaet på /domesticPayment. Knapperaden under
          ligger utenfor, så den kan gå over hele modalens bredde. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px" }}>
        {/* Uten mottakerboks står varselet øverst i skjemaet. */}
        {stopped && <FormStatus state="warning" text="Overføringen er stoppet." stretch />}

        <ConfigurableField
          status={status("fromAccount", readOnly)}
          label="Fra konto"
          value={accountText(fromAccountList, selectedFromKey)}
        >
          {(disabled) => (
            <Autocomplete
              label="Fra konto"
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
          )}
        </ConfigurableField>

        {/* Et fondskjøp går alltid til samme fondskonto. */}
        <ConfigurableField
          status={status("toAccount", readOnly || isFund)}
          label="Til konto"
          value={accountText(toAccountList, selectedToKey)}
        >
          {(disabled) => (
            <Autocomplete
              label="Til konto"
              size="medium"
              data={toAccounts}
              placeholder="Velg konto"
              stretch
              disabled={disabled}
              showSubmitButton
              submitButtonTitle=""
              value={selectedToKey ?? undefined}
              onChange={({ selectedItem }) =>
                setSelectedToKey(typeof selectedItem === "number" ? String(selectedItem) : null)
              }
            />
          )}
        </ConfigurableField>

        <ConfigurableField status={status("amount", readOnly)} label="Beløp" value={amountText(amount)}>
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

        {/* KID identifiserer fondskjøpet og kan ikke endres (uten Field status). */}
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
        ) : !isAsk && (
          <ConfigurableField status={status("message", readOnly)} label="Melding" value={message}>
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
                {/* Telleren hører til et felt man kan skrive i. */}
                {!disabled && (
                  <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
                    {messageMaxLength - message.length} av {messageMaxLength} tegn gjenstår.
                  </P>
                )}
              </div>
            )}
          </ConfigurableField>
        )}

        <ConfigurableField
          status={status("paymentDate", readOnly)}
          label="Betalingsdato"
          value={dateText(paymentDate)}
        >
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

      <EditPaymentActions
        onClose={onClose}
        stopped={stopped}
        onToggleStop={() => setStopped(!stopped)}
        locked={readOnly}
      />
    </div>
  );
}
