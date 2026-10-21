"use client";

import { useEffect, useState } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Anchor, Autocomplete, Avatar, Breadcrumb, Button, DatePicker, FormLabel, Input, InputMasked, Textarea } from "@dnb/eufemia/components";
// HelpButtonInline eksporteres ikke fra pakkeroten — må dyp-importeres,
// samme som på internationalPayment.
import HelpButtonInline, { HelpButtonInlineContent } from "@dnb/eufemia/components/help-button/HelpButtonInline";
import { H1, P } from "@dnb/eufemia/elements";

// Identisk med fromAccountList på internationalPayment
const fromAccountList = [
  { content: ["Lønnskonto", "7001 19 60764"], suffixValue: "NOK 7 804,46" },
  { content: ["Brukskonto", "0539 52 33566"], suffixValue: "NOK 0,00" },
  { content: ["Sparekonto", "1234 56 78901"], suffixValue: "NOK 152 300,00" },
  { content: ["Felleskonto", "1503 24 78612"], suffixValue: "NOK 42 500,00" },
];

const fromAccounts = fromAccountList.map((a, i) => ({
  ...a,
  selectedKey: String(i),
}));

const recipients = [
  { name: "Allente Norge As", number: "6005 07 81871" },
  { name: "Espen Lunar", number: "9602 07 17286" },
];

const toAccounts = recipients.map((r) => ({
  selectedKey: r.number,
  selectedValue: r.name,
  content: [r.name, r.number],
}));

const fromAccountFieldId = "domestic-payment-from-account";
const fromAccountHelpId = `${fromAccountFieldId}-help`;
const fromAccountHelp = {
  content: (
    <>
      Betaling fra valutakonto må gjøres i{" "}
      <Anchor href="#" target="_blank" rel="noopener noreferrer" noLaunchIcon>
        gammel løsning
      </Anchor>
      .
    </>
  ),
};
const messageMaxLength = 70;

export default function DomesticPayment() {
  const [selectedFromKey, setSelectedFromKey] = useState<string | null>(null);
  const [selectedToKey, setSelectedToKey] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  // Settes etter mount, ikke under render — ellers kan server og klient
  // regne ut ulik dato og gi hydration mismatch.
  const [paymentDate, setPaymentDate] = useState<string | undefined>(undefined);
  useEffect(() => {
    setPaymentDate(new Date().toISOString().slice(0, 10));
  }, []);

  return (
    <Theme colorScheme="light">
      {/* Toppfelt med brødsmulesti, samme oppsett som på internationalPayment */}
      <div style={{
        background: "var(--token-color-background-page-background, var(--token-color-background-neutral))",
        height: "80px",
        display: "flex",
        alignItems: "flex-end",
        boxSizing: "border-box",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          height: "62px",
          padding: "0 48px",
          maxWidth: "calc(72rem + 96px)",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}>
          <Breadcrumb
            variant="multiple"
            navText="Sidehierarki"
            data={[
              { text: "Hjem", href: "/" },
              { text: "Betalingsoversikt", href: "/paymentsOverview" },
              { text: "Betal" },
            ]}
          />
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <Avatar size="medium" variant="primary" hasLabel>E</Avatar>
            <Button variant="tertiary" size="small" icon="chevron_down" iconPosition="right">Meg</Button>
          </div>
        </div>
      </div>
      <div style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "calc(100vh - 80px)", padding: "48px", boxSizing: "border-box" }}>
        <div
          style={{
            background: "var(--token-color-background-neutral)",
            boxShadow: "0px 8px 16px 0px rgba(51,51,51,0.08)",
            padding: "48px 96px",
            display: "flex",
            flexDirection: "column",
            gap: "48px",
            minHeight: "calc(100vh - 176px)",
            boxSizing: "border-box",
            maxWidth: "72rem",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <H1 size="x-large">Betal</H1>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px", width: "100%" }}>
            <div>
              <FormLabel forId={fromAccountFieldId} style={{ marginBottom: "0.5rem" }}>
                Fra konto
                <span style={{ marginLeft: "0.45em", whiteSpace: "nowrap" }}>
                  <HelpButtonInline contentId={fromAccountHelpId} help={fromAccountHelp} />
                </span>
              </FormLabel>
              <HelpButtonInlineContent contentId={fromAccountHelpId} help={fromAccountHelp} bottom="x-small" />
              <Autocomplete
                id={fromAccountFieldId}
                size="medium"
                data={fromAccounts}
                placeholder="Velg konto"
                stretch
                showSubmitButton
                submitButtonTitle=""
                value={selectedFromKey ?? undefined}
                onChange={({ selectedItem }) => {
                  setSelectedFromKey(typeof selectedItem === "number" ? String(selectedItem) : null);
                }}
              />
            </div>
            <Autocomplete
              label="Til konto"
              size="medium"
              data={toAccounts}
              placeholder="Skriv og velg"
              stretch
              showSubmitButton
              submitButtonTitle=""
              value={selectedToKey ?? undefined}
              onChange={({ selectedItem }) => {
                const r = typeof selectedItem === "number" ? recipients[selectedItem] : undefined;
                setSelectedToKey(r?.number ?? null);
                // Fyll inn mottakernavn fra valgt mottaker
                if (r) setRecipientName(r.name);
              }}
            />
            <Input
              label="Mottakernavn"
              size="medium"
              style={{ width: "336px" }}
              value={recipientName}
              onChange={({ value }) => setRecipientName(value)}
            />
            <InputMasked
              label="Beløp"
              size="medium"
              style={{ width: "176px" }}
              numberMask={{
                suffix: " kr",
                allowDecimal: true,
                decimalLimit: 2,
                thousandsSeparatorSymbol: " ",
                decimalSymbol: ",",
              }}
              placeholder="kr"
              value={amount}
              onChange={({ numberValue }) => setAmount(numberValue !== undefined && !isNaN(numberValue) ? String(numberValue) : "")}
            />
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
            <DatePicker
              label="Betalingsdato"
              size="medium"
              showInput
              date={paymentDate}
              onChange={({ date }) => {
                if (date) setPaymentDate(date);
              }}
            />
            <Button variant="primary" text="Bekreft betaling" style={{ alignSelf: "flex-start" }} />
          </div>
        </div>
      </div>
    </Theme>
  );
}
