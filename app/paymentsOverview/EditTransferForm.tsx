"use client";

import { useState } from "react";
import { Autocomplete, DatePicker, FormStatus, Input, InputMasked, Textarea } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";

import { fromAccountList, fromAccounts } from "../internationalPayment/paymentData";
import type { Transaction } from "./data";
import EditPaymentActions from "./EditPaymentActions";

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
  readOnly = false,
}: {
  tx: Transaction;
  /** Kontonavnet fra betalingsoversikten, for å forhåndsvelge «Fra konto». */
  accountName: string;
  /** Knappene i bunnen gjør ingenting ennå utover å lukke modalen. */
  onClose: () => void;
  readOnly?: boolean;
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
  const [paymentDate, setPaymentDate] = useState(tx.dateValue);
  const [stopped, setStopped] = useState(false);
  const isFund = tx.icon === "funds";
  // Overføring til aksjesparekonto (ASK) har verken melding eller KID.
  const isAsk = tx.icon === "investment";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* 488px er bredden på skjemaet på /domesticPayment. Knapperaden under
          ligger utenfor, så den kan gå over hele modalens bredde. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px" }}>
        {/* Uten mottakerboks står varselet øverst i skjemaet. */}
        {stopped && <FormStatus state="warning" text="Betalingen er stoppet." stretch />}

        <Autocomplete
          label="Fra konto"
          size="medium"
          data={fromAccounts}
          placeholder="Velg konto"
          stretch
          disabled={readOnly}
          showSubmitButton
          submitButtonTitle=""
          value={selectedFromKey ?? undefined}
          onChange={({ selectedItem }) =>
            setSelectedFromKey(typeof selectedItem === "number" ? String(selectedItem) : null)
          }
        />

        <Autocomplete
          label="Til konto"
          size="medium"
          data={toAccounts}
          placeholder="Velg konto"
          stretch
          // Et fondskjøp går alltid til samme fondskonto.
          disabled={readOnly || isFund}
          showSubmitButton
          submitButtonTitle=""
          value={selectedToKey ?? undefined}
          onChange={({ selectedItem }) =>
            setSelectedToKey(typeof selectedItem === "number" ? String(selectedItem) : null)
          }
        />

        <InputMasked
          label="Beløp"
          size="medium"
          stretch
          disabled={readOnly}
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

        {tx.kid ? (
          <Input
            label="KID"
            size="medium"
            stretch
            // KID identifiserer fondskjøpet og kan ikke endres.
            disabled
            value={tx.kid}
          />
        ) : !isAsk && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Textarea
              label="Melding"
              size="medium"
              stretch
              disabled={readOnly}
              rows={1}
              autoResize
              autoResizeMaxRows={6}
              value={message}
              maxLength={messageMaxLength}
              onChange={({ value }) => setMessage(value)}
            />
            <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
              {messageMaxLength - message.length} av {messageMaxLength} tegn gjenstår.
            </P>
          </div>
        )}

        <DatePicker
          label="Betalingsdato"
          size="medium"
          showInput
          disabled={readOnly}
          date={paymentDate}
          onChange={({ date }) => {
            if (date) setPaymentDate(date);
          }}
        />
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
