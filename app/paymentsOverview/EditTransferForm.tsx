"use client";

import { useState } from "react";
import { Autocomplete, DatePicker, FormStatus, Icon, Input, InputMasked, List, Textarea } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";
import { funds_medium, investment_account_medium, loan_medium, savings_account_medium, transfer_medium } from "@dnb/eufemia/icons";

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

/** Samme ikoner som radene i oversikten (TransactionRow). */
const transferIcons = {
  transfer: transfer_medium,
  loan: loan_medium,
  savings: savings_account_medium,
  investment: investment_account_medium,
  funds: funds_medium,
};

/**
 * Overføring mellom egne kontoer. Til-kontoen vises i samme mottakerboks
 * som i betalingsmodalene, med kontoikonet (uten avatarsirkel) og kontonummeret
 * under navnet. Ellers samme felt og knapper.
 * `readOnly` brukes for avdrag på lån (Boliglånet): alle felt er låst, og
 * Stopp og Slett er ikke tillatt. Fondskjøp (DNB Global index) har
 * KID i stedet for melding, som en eFaktura. ASK har ingen
 * melding.
 */
export default function EditTransferForm({
  tx,
  accountName,
  onClose,
  onSave,
  saveDelayMs,
  initiallyStopped = false,
  readOnly = false,
  fieldStatus,
}: {
  tx: Transaction;
  /** Kontonavnet fra betalingsoversikten, for å forhåndsvelge «Fra konto». */
  accountName: string;
  /** Knappene i bunnen gjør ingenting ennå utover å lukke modalen. */
  onClose: () => void;
  /** Se EditPaymentActions: kalles når Lagre er ferdig. */
  onSave?: () => void;
  /** Se EditPaymentActions: spinnertid på Lagre. */
  saveDelayMs?: number;
  /** Stoppet med «Show warnings» i oversikten — modalen åpner da i stoppet tilstand. */
  initiallyStopped?: boolean;
  readOnly?: boolean;
  /** Form state fra Tools-menyen. Satt: overstyrer readOnly, fond og KID-
   *  regelen per felt. Utelatt: feltene følger reglene over. */
  fieldStatus?: FieldStatusMap;
}) {
  const indexOf = (name: string) => {
    const i = toAccountList.findIndex((a) => a.content[0] === name);
    return i >= 0 ? String(i) : null;
  };

  const [selectedFromKey, setSelectedFromKey] = useState<string | null>(() => indexOf(accountName));
  // Mottakeren på en overføring er navnet på til-kontoen; kontonummeret
  // hentes fra kontolisten når transaksjonen ikke har det selv.
  const toAccountNumber = tx.toAccount ?? toAccountList.find((a) => a.content[0] === tx.recipient)?.content[1];
  const [amount, setAmount] = useState(String(tx.amountNok));
  const [message, setMessage] = useState(tx.message ?? "");
  // KID i state, så det brukeren skriver (når Form state gjør feltet
  // redigerbart) overlever bytte av status og vises i read only.
  const [kid, setKid] = useState(tx.kid ?? "");
  const [paymentDate, setPaymentDate] = useState(tx.dateValue);
  const [stopped, setStopped] = useState(initiallyStopped);
  // Overføring til aksjesparekonto (ASK) har verken melding eller KID.
  const isAsk = tx.icon === "investment";
  const status = (key: FieldKey, legacyDisabled = false) => resolveFieldStatus(fieldStatus, key, legacyDisabled);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* 488px er bredden på skjemaet på /domesticPayment. Knapperaden under
          ligger utenfor, så den kan gå over hele modalens bredde. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px" }}>
        {/* Samme mottakerboks som i EditDomesticPaymentForm. Varselet ligger
            i mottakerraden, som i betalingsmodalene. */}
        <div className="po-edit-recipient">
          <List.Container>
            <List.Item.Basic>
              <List.Cell.Start>
                {/* Ikon uten sirkel, som radene for overføringer i oversikten.
                    Der farger List.Item.Action ikonet med icon-action; denne
                    raden er List.Item.Basic og ville arvet tekstfargen. */}
                <Icon
                  icon={transferIcons[tx.icon ?? "transfer"]}
                  size="medium"
                  style={{ color: "var(--token-color-icon-action)" }}
                />
              </List.Cell.Start>
              <List.Cell.Title>
                {tx.recipient}
                {toAccountNumber && <List.Cell.Title.Subline>{toAccountNumber}</List.Cell.Title.Subline>}
              </List.Cell.Title>
              {stopped && (
                <List.Cell.Footer>
                  <FormStatus state="warning" text="Overføringen er stoppet." stretch />
                </List.Cell.Footer>
              )}
            </List.Item.Basic>
          </List.Container>
        </div>

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

        {/* KID identifiserer fondskjøpet og kan ikke endres (uten Form state). */}
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
        onSave={onSave}
        saveDelayMs={saveDelayMs}
        stopped={stopped}
        onToggleStop={() => setStopped(!stopped)}
        locked={readOnly}
      />
    </div>
  );
}
