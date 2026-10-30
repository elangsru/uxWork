"use client";

import { useState } from "react";
import { Autocomplete, Avatar, DatePicker, FormLabel, FormStatus, Input, InputMasked, List, Textarea } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";
import { ainvoice_medium, attachment_medium, office_buildings } from "@dnb/eufemia/icons";

import { fromAccountList, fromAccounts } from "../internationalPayment/paymentData";
import type { Transaction } from "./data";
import EditPaymentActions from "./EditPaymentActions";

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
}: {
  tx: Transaction;
  /** Kontonavnet fra betalingsoversikten, for å forhåndsvelge «Fra konto». */
  accountName: string;
  /** Knappene i bunnen gjør ingenting ennå utover å lukke modalen. */
  onClose: () => void;
}) {
  const [selectedFromKey, setSelectedFromKey] = useState<string | null>(() => {
    const i = fromAccountList.findIndex((a) => a.content[0] === accountName);
    return i >= 0 ? String(i) : null;
  });
  const [paymentDate, setPaymentDate] = useState(tx.dateValue);
  const [message, setMessage] = useState(tx.message ?? "");
  const [amount, setAmount] = useState(String(tx.amountNok));
  const [stopped, setStopped] = useState(false);

  // Egne id-er, så de ikke kolliderer med feltene på /domesticPayment.
  const fromAccountFieldId = "edit-domestic-payment-from-account";

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
                href="https://www.google.com"
                target="_blank"
                rel="noopener noreferrer"
                icon={tx.type === "efaktura" ? attachment_medium : ainvoice_medium}
                title={tx.type === "efaktura" ? "eFakturavedlegg" : "Avtalegiro-avtale"}
              />
            )}
          </List.Container>
        </div>

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

        <InputMasked
          label="Beløp"
          size="medium"
          stretch
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
            // KID kommer fra fakturaen og kan ikke endres.
            disabled
            value={tx.kid}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Textarea
              label="Melding"
              size="medium"
              stretch
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
