"use client";

import { useState } from "react";
import { Autocomplete, Avatar, Badge, CountryFlag, DatePicker, FormLabel, FormStatus, InputMasked, List, Textarea } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";

import {
  currencies,
  currencyList,
  exchangeRates,
  fmtAmount,
  fromAccountList,
  fromAccounts,
  messageMaxLength,
  recipientRowStyles,
  recipients,
  type Currency,
  type Recipient,
} from "../internationalPayment/paymentData";
import type { Transaction } from "./data";
import EditPaymentActions from "./EditPaymentActions";

// Betalingsoversikten skriver «José», mottakerlisten «Jose». Aksentene fjernes
// før sammenligning, så navnet treffer uansett skrivemåte.
const normalizeName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** «EUR 500,00» → { code: "EUR", amount: "500" }. Formatet til amountDisplay i
 *  data.ts; rader i kroner har ikke amountDisplay og gir null. */
function parseAmountDisplay(display: string | undefined): { code: string; amount: string } | null {
  const m = display?.match(/^([A-Z]{3})\s+([\d\s.,]+)$/);
  if (!m) return null;
  const value = parseFloat(m[2].replace(/[\s.]/g, "").replace(",", "."));
  return isNaN(value) ? null : { code: m[1], amount: String(value) };
}

/**
 * Feltene fra steg 1 i «Betale til utlandet», forhåndsutfylt med betalingen
 * brukeren kom fra. Speiler oppsettet på /internationalPayment, men uten
 * hjelpeknapper, «Ny mottaker», «Valgfrie tilleggstjenester» og «Neste» — modalen redigerer en eksisterende betaling.
 */
export default function EditPaymentForm({
  tx,
  accountName,
  onClose,
}: {
  tx: Transaction;
  /** Kontonavnet fra betalingsoversikten, for å forhåndsvelge «Fra konto». */
  accountName: string;
  /** Knappene i bunnen gjør ingenting ennå utover å lukke modalen. */
  onClose: () => void;
}) {
  const parsed = parseAmountDisplay(tx.amountDisplay);

  const [selectedFromKey, setSelectedFromKey] = useState<string | null>(() => {
    const i = fromAccountList.findIndex((a) => a.content[0] === accountName);
    return i >= 0 ? String(i) : null;
  });
  // Mottakeren kan ikke byttes her — «Til konto» er tatt ut av modalen.
  const selectedRecipient: Recipient | null =
    recipients.find((r) => normalizeName(r.name) === normalizeName(tx.recipient)) ?? null;
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    () => currencyList.find((c) => c.code === parsed?.code) ?? null,
  );
  const [amount, setAmount] = useState(parsed?.amount ?? "");
  const [message, setMessage] = useState("Rent of vacation home");
  const [paymentDate, setPaymentDate] = useState(tx.dateValue);
  const [stopped, setStopped] = useState(false);

  const filteredCurrencies = selectedRecipient
    ? currencies.filter((c) => selectedRecipient.currencies.includes(String(c.selectedKey)))
    : currencies;

  // Egne id-er, så de ikke kolliderer med feltene på /internationalPayment.
  const fromAccountFieldId = "edit-payment-from-account";
  const currencyFieldId = "edit-payment-currency";
  const amountFieldId = "edit-payment-amount";
  const messageFieldId = "edit-payment-message";

  const amountHint = (() => {
    const amountNum = parseFloat(amount.replace(",", ".")) || 0;
    const rate = selectedCurrency ? exchangeRates[selectedCurrency.code] ?? 1 : 1;
    const nok = amountNum * rate;
    return `Du blir belastet ca NOK ${nok > 0 ? fmtAmount(nok) : "-,--"}.`;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* 488px er bredden på skjemaet i steg 1 på /internationalPayment. Knapperaden under
          ligger utenfor, så den kan gå over hele modalens bredde. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px" }}>
        {selectedRecipient && (
          <div className="ip-recipient-row po-edit-recipient">
            <style>{recipientRowStyles}</style>
            {/* Avatar og flagg som mottakerraden på steg 1 (medium /
                x-small). Øverst, rett under tittelen, så det er tydelig hvem betalingen
                går til. Basic, ikke Action som på steg 1: «Rediger mottaker»
                finnes ikke her, og en klikkbar rad uten handling ville vært
                misvisende. */}
            <List.Container>
              <List.Item.Basic>
                <List.Cell.Start>
                  <Badge
                    content={<CountryFlag iso={selectedRecipient.iso} size="x-small" />}
                    vertical="bottom"
                    horizontal="right"
                    variant="content"
                  >
                    <Avatar size="medium" variant="primary" hasLabel>
                      {selectedRecipient.name}
                    </Avatar>
                  </Badge>
                </List.Cell.Start>
                {/* Kontonummeret står under navnet i stedet for i et eget
                    «Til konto»-felt. */}
                <List.Cell.Title>
                  {selectedRecipient.name}
                  <List.Cell.Title.Subline>{selectedRecipient.iban}</List.Cell.Title.Subline>
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
            </List.Container>
          </div>
        )}
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
            showSubmitButton
            submitButtonTitle=""
            value={selectedFromKey ?? undefined}
            onChange={({ selectedItem }) =>
              setSelectedFromKey(typeof selectedItem === "number" ? String(selectedItem) : null)
            }
          />
        </div>

        <div>
          <FormLabel forId={currencyFieldId} style={{ marginBottom: "0.5rem" }}>
            Valuta som sendes
          </FormLabel>
          <Autocomplete
            id={currencyFieldId}
            size="medium"
            data={filteredCurrencies}
            placeholder="Velg valuta"
            stretch
            disabled={!selectedRecipient}
            showSubmitButton
            submitButtonTitle=""
            icon={selectedCurrency ? <CountryFlag iso={selectedCurrency.iso} size="small" /> : undefined}
            value={selectedCurrency?.code ?? undefined}
            onChange={({ selectedItem }) => {
              const code = typeof selectedItem === "number" ? filteredCurrencies[selectedItem]?.selectedKey : undefined;
              setSelectedCurrency(currencyList.find((c) => c.code === code) ?? null);
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <FormLabel forId={amountFieldId} style={{ marginBottom: "0.5rem" }}>
              Beløp
            </FormLabel>
            <InputMasked
              id={amountFieldId}
              size="medium"
              stretch
              numberMask={{
                prefix: `${selectedCurrency?.code ?? "NOK"} `,
                suffix: "",
                allowDecimal: true,
                decimalLimit: 2,
                thousandsSeparatorSymbol: " ",
                decimalSymbol: ",",
              }}
              placeholder={selectedCurrency?.code ?? ""}
              value={amount}
              onChange={({ numberValue }) =>
                setAmount(numberValue !== undefined && !isNaN(numberValue) ? String(numberValue) : "")
              }
            />
          </div>
          <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
            {amountHint}
          </P>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <FormLabel forId={messageFieldId} style={{ marginBottom: "0.5rem" }}>
              Melding
            </FormLabel>
            <Textarea
              id={messageFieldId}
              size="medium"
              stretch
              rows={1}
              autoResize
              autoResizeMaxRows={6}
              placeholder="Melding til mottaker"
              value={message}
              maxLength={messageMaxLength}
              onChange={({ value }) => setMessage(value)}
            />
          </div>
          <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
            {messageMaxLength - message.length} av {messageMaxLength} tegn gjenstår.
          </P>
        </div>

        <DatePicker
          label="Betalingsdato"
          size="medium"
          showInput
          date={paymentDate}
          onChange={({ date }) => {
            if (date) setPaymentDate(date);
          }}
        />

      </div>

      <EditPaymentActions onClose={onClose} stopped={stopped} onToggleStop={() => setStopped(!stopped)} />
    </div>
  );
}
