"use client";

import { useState } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, StepIndicator, Autocomplete, Icon, Avatar, Badge, CountryFlag, Input, Switch, DatePicker, Anchor } from "@dnb/eufemia/components";
import { H1, P } from "@dnb/eufemia/elements";
import { chevron_down, chevron_up, chevron_right, add } from "@dnb/eufemia/icons";

const fromAccounts = [
  { content: ["Lønnskonto", "7001 19 60764"], suffixValue: "NOK 7 804,46" },
  { content: ["Brukskonto", "0539 52 33566"], suffixValue: "NOK 0,00" },
  { content: ["Sparekonto", "1234 56 78901"], suffixValue: "NOK 152 300,00" },
  { content: ["Felleskonto", "1503 24 78612"], suffixValue: "NOK 42 500,00" },
];

type Recipient = { name: string; iban: string; iso: string };

const recipients: Recipient[] = [
  { name: "Didrich Stökl", iban: "AT48 3200 0000 1234 5864", iso: "AT" },
  { name: "John Jones", iban: "GB33 BUKB 2020 1555 5555 55", iso: "GB" },
  { name: "Jose Martinez", iban: "ES79 2100 0813 6101 2345 6789", iso: "ES" },
  { name: "Medel Svedsson", iban: "SE72 8000 0810 3400 0978 3242", iso: "SE" },
  { name: "Anna Schmidt", iban: "DE89 3704 0044 0532 0130 00", iso: "DE" },
  { name: "Sophie Laurent", iban: "FR14 2004 1010 0505 0001 3M02 606", iso: "FR" },
];

const toAccounts = recipients.map((r) => ({
  selectedKey: r.iban,
  selectedValue: r.iban,
  searchContent: [r.name, r.iban],
  content: (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
      <Badge
        content={<CountryFlag iso={r.iso} size="x-small" />}
        vertical="bottom"
        horizontal="right"
        variant="content"
      >
        <Avatar size="medium" variant="primary">{r.name.charAt(0)}</Avatar>
      </Badge>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
        <span>{r.name}</span>
        <span style={{ color: "var(--token-color-text-neutral-alternative)" }}>{r.iban}</span>
      </div>
    </div>
  ),
}));

type Currency = { code: string; name: string; iso: string };

const currencyList: Currency[] = [
  { code: "EUR", name: "Euro", iso: "EU" },
  { code: "USD", name: "US-dollar", iso: "US" },
  { code: "GBP", name: "Britisk pund", iso: "GB" },
  { code: "SEK", name: "Svenske kroner", iso: "SE" },
  { code: "DKK", name: "Danske kroner", iso: "DK" },
  { code: "CHF", name: "Sveitsiske franc", iso: "CH" },
  { code: "JPY", name: "Japanske yen", iso: "JP" },
  { code: "NOK", name: "Norske kroner", iso: "NO" },
];

const currencies = currencyList.map((c) => ({
  selectedKey: c.code,
  selectedValue: `${c.name} (${c.code})`,
  searchContent: [c.code, c.name],
  content: (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
      <CountryFlag iso={c.iso} size="medium" />
      <span>{c.name} ({c.code})</span>
    </div>
  ),
}));

export default function InternationalPayment() {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [amountInNok, setAmountInNok] = useState(false);
  const [message, setMessage] = useState("");
  const messageMaxLength = 140;
  const today = new Date().toISOString().slice(0, 10);
  const [paymentDate, setPaymentDate] = useState(today);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const recipientError = submitted && !selectedRecipient ? "Dette feltet må fylles ut." : undefined;
  const messageError = submitted && !message.trim() ? "Dette feltet må fylles ut." : undefined;

  function handleNext() {
    setSubmitted(true);
    if (selectedRecipient && message.trim()) {
      setCurrentStep(1);
    }
  }

  return (
    <Theme colorScheme="light">
      <div style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "100vh", padding: "48px", boxSizing: "border-box" }}>
        <div
          style={{
            background: "var(--token-color-background-neutral)",
            boxShadow: "0px 8px 16px 0px rgba(51,51,51,0.08)",
            padding: "48px 96px",
            display: "flex",
            flexDirection: "column",
            gap: "48px",
            minHeight: "calc(100vh - 96px)",
            boxSizing: "border-box",
            maxWidth: "72rem",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Hero */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <H1 size="x-large">Betale til utlandet</H1>
              <P>
                Du finner mer info om priser og oppgjørstider{" "}
                <Anchor
                  href="https://www.dnb.no/dagligbank/betaling/til-utland"
                  target="_blank"
                  rel="noopener noreferrer"
                  noLaunchIcon
                >
                  her
                </Anchor>
                .
              </P>
            </div>
            <div style={{ maxWidth: "488px", width: "100%" }}>
              <StepIndicator
                mode="static"
                currentStep={currentStep}
                data={[
                  { title: "Betalingsdetaljer" },
                  { title: "Se over og fullfør" },
                ]}
              />
            </div>
          </div>

          {/* Account fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px", width: "100%" }}>
            <Autocomplete
              label="Fra konto"
              size="medium"
              data={fromAccounts}
              placeholder="Velg konto"
              stretch
              showSubmitButton
              submitButtonTitle=""
              submitButtonIcon={<Icon icon={fromOpen ? chevron_up : chevron_down} />}
              onOpen={() => setFromOpen(true)}
              onClose={() => setFromOpen(false)}
            />
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <Autocomplete
                  label="Til konto"
                  size="medium"
                  data={toAccounts}
                  placeholder="Velg mottaker"
                  stretch
                  showSubmitButton
                  submitButtonTitle=""
                  submitButtonIcon={<Icon icon={toOpen ? chevron_up : chevron_down} />}
                  status={recipientError}
                  onOpen={() => setToOpen(true)}
                  onClose={() => setToOpen(false)}
                  onChange={({ selectedItem }) => {
                    if (typeof selectedItem === "number" && recipients[selectedItem]) {
                      setSelectedRecipient(recipients[selectedItem]);
                    } else {
                      setSelectedRecipient(null);
                    }
                  }}
                />
              </div>
              <div style={{ paddingTop: "2rem" }}>
                <Button variant="secondary" text="Ny" icon={add} iconPosition="left" />
              </div>
            </div>
            {selectedRecipient && (
              <div style={{ marginTop: "-16px" }}>
                <Button variant="tertiary" text={selectedRecipient.name} icon={chevron_right} iconPosition="right" />
              </div>
            )}
            <Autocomplete
              label="Valuta som sendes"
              size="medium"
              data={currencies}
              placeholder="Velg valuta"
              stretch
              disabled={!selectedRecipient}
              showSubmitButton
              submitButtonTitle=""
              submitButtonIcon={<Icon icon={currencyOpen ? chevron_up : chevron_down} />}
              icon={selectedCurrency ? <CountryFlag iso={selectedCurrency.iso} size="small" /> : undefined}
              onOpen={() => setCurrencyOpen(true)}
              onClose={() => setCurrencyOpen(false)}
              onChange={({ selectedItem }) => {
                if (typeof selectedItem === "number" && currencyList[selectedItem]) {
                  setSelectedCurrency(currencyList[selectedItem]);
                } else {
                  setSelectedCurrency(null);
                }
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Input label="Beløp" size="medium" stretch />
                </div>
                <div style={{ height: "2.5rem", display: "flex", alignItems: "center" }}>
                  <Switch
                    label="Tast beløp i NOK"
                    labelPosition="right"
                    checked={amountInNok}
                    onChange={({ checked }) => setAmountInNok(checked)}
                  />
                </div>
              </div>
              <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
                Du blir belastet ca NOK -,--. Korrekt kurs fastsettes når betalingen gjennomføres.
              </P>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Input
                label="Melding (på engelsk)"
                size="medium"
                stretch
                placeholder="Melding til mottaker"
                value={message}
                maxLength={messageMaxLength}
                status={messageError}
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
            <div>
              <Button
                variant="primary"
                text="Neste"
                icon={chevron_right}
                iconPosition="right"
                onClick={handleNext}
              />
            </div>
          </div>
        </div>
      </div>
    </Theme>
  );
}

