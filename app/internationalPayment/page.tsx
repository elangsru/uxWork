"use client";

import { useState, type CSSProperties } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, StepIndicator, Autocomplete, Icon, Avatar, Badge, CountryFlag, Input, Switch, DatePicker, Anchor, List, FormStatus, Radio, Dropdown } from "@dnb/eufemia/components";
import { H1, H3, P } from "@dnb/eufemia/elements";
import { chevron_down, chevron_up, chevron_right, add, globe_medium, filter, close } from "@dnb/eufemia/icons";

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

const exchangeRates: Record<string, number> = {
  EUR: 10.84,
  USD: 9.85,
  GBP: 12.85,
  SEK: 0.95,
  DKK: 1.46,
  CHF: 11.50,
  JPY: 0.064,
  NOK: 1,
};

function fmtAmount(value: number): string {
  return value.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
}

function SummaryStep({
  paymentDate,
  recipient,
  currency,
  amount,
  amountInNok,
  showFixedRate,
  showPurpose,
}: {
  paymentDate: string;
  recipient: Recipient | null;
  currency: Currency | null;
  amount: string;
  amountInNok: boolean;
  showFixedRate: boolean;
  showPurpose: boolean;
}) {
  const rate = currency ? exchangeRates[currency.code] ?? 1 : 1;
  const amountNum = parseFloat(amount.replace(",", ".")) || 0;
  const foreignAmount = amountInNok ? amountNum / rate : amountNum;
  const nokAmount = amountInNok ? amountNum : amountNum * rate;
  const currencyCode = currency?.code ?? "—";

  const [costOption, setCostOption] = useState("delt");
  const cost = costOption === "jeg" ? 410 : costOption === "mottaker" ? 0 : 60;
  const costMessage = costOption === "jeg"
    ? "Ekstra gebyr (NOK 350,00) legges til prisen (NOK 60,00) for å dekke kostnader belastet i andre banker."
    : costOption === "mottaker"
    ? `Kostnader belastet av andre banker blir trukket fra beløpet som sendes (${currencyCode} ${fmtAmount(foreignAmount)}). Sørg for å ha nok til å dekke det du skal betale for.`
    : "Transaksjonskostnaden er delt mellom deg og mottaker. Dette er din pris.";

  const [agreedRate, setAgreedRate] = useState("");
  const [reference, setReference] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");

  const optionalLabel = (text: string) => (
    <>
      {text}{" "}
      <span style={{ color: "var(--token-color-text-neutral-alternative)", fontWeight: "normal" }}>
        Valgfritt felt
      </span>
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "488px", width: "100%" }}>
      <style>{`
        .summary-container .dnb-list__item::after { display: none !important; }
        .summary-container .dnb-list__item { border-radius: 0 !important; }
        .summary-container .dnb-list__item:not(:last-child) {
          border-bottom: 1px solid var(--token-color-stroke-neutral-subtle);
        }
      `}</style>

      {/* Oppsummering */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <H3>Oppsummering</H3>
        <div
          className="summary-container"
          style={{
            outline: "1px solid var(--token-color-stroke-neutral-alternative)",
            borderRadius: "var(--token-radius-lg)",
            overflow: "hidden",
          }}
        >
          <List.Container>
            <List.Item.Basic>
              <List.Cell.Title>Dato</List.Cell.Title>
              <List.Cell.End>{fmtDate(paymentDate)}</List.Cell.End>
            </List.Item.Basic>
            <List.Item.Basic>
              <List.Cell.Title>Du sender (ca)</List.Cell.Title>
              <List.Cell.End>NOK {fmtAmount(nokAmount)}</List.Cell.End>
            </List.Item.Basic>
            <List.Item.Basic>
              <List.Cell.Title>{recipient ? `${recipient.name} mottar` : "Mottaker mottar"}</List.Cell.Title>
              <List.Cell.End>{currencyCode} {fmtAmount(foreignAmount)}</List.Cell.End>
            </List.Item.Basic>
            <List.Item.Basic>
              <List.Cell.Title>Valutakurs ({currencyCode} 1)</List.Cell.Title>
              <List.Cell.End>NOK {fmtAmount(rate)}</List.Cell.End>
            </List.Item.Basic>
          </List.Container>
          <FormStatus
            state="information"
            stretch
            text="Valutakurs er kun foreløpig. Endelig kurs settes når betalingen gjennomføres."
            style={{ "--form-status-radius": "0" } as CSSProperties}
          />
        </div>
      </div>

      {/* Pris */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <H3>Pris</H3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <P>Hvem dekker omkostninger?</P>
          <Radio.Group
            layoutDirection="row"
            value={costOption}
            onChange={({ value }) => setCostOption(value)}
          >
            <Radio label="Delt (anbefalt)" value="delt" />
            <Radio label="Jeg (+NOK 350)" value="jeg" />
            <Radio label="Mottaker" value="mottaker" />
          </Radio.Group>
        </div>
        <div
          className="summary-container"
          style={{
            outline: "1px solid var(--token-color-stroke-neutral-alternative)",
            borderRadius: "var(--token-radius-lg)",
            overflow: "hidden",
          }}
        >
          <List.Container>
            <List.Item.Basic>
              <List.Cell.Start>
                <Icon icon={globe_medium} color="var(--token-color-icon-action)" />
              </List.Cell.Start>
              <List.Cell.Title>Cross border-betaling</List.Cell.Title>
              <List.Cell.End>NOK {fmtAmount(cost)}</List.Cell.End>
            </List.Item.Basic>
          </List.Container>
          <FormStatus
            state="information"
            stretch
            text={costMessage}
            style={{ "--form-status-radius": "0" } as CSSProperties}
          />
        </div>
      </div>

      {/* Avtalt valutakurs */}
      {showFixedRate && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <H3>Avtalt valutakurs</H3>
          <P>
            Når beløp overstiger tre millioner kroner, kan vekslingskurs avtales for oppdraget. Kontakt en av våre valutameglere på telefon +47 24 16 90 90.
          </P>
          <Input
            label={optionalLabel("Avtalt kurs")}
            size="medium"
            stretch
            placeholder={`Valutakurs (${currencyCode})`}
            value={agreedRate}
            onChange={({ value }) => setAgreedRate(value)}
          />
          <Input
            label={optionalLabel("Referanse")}
            size="medium"
            stretch
            placeholder="Navn/avtalenummer"
            value={reference}
            onChange={({ value }) => setReference(value)}
          />
        </div>
      )}

      {/* Formål med betalingen */}
      {showPurpose && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <H3>Formål med betalingen</H3>
          <P>
            Vennligst oppgi et passende formål med betalingen din. Beskriv også kort hva du betaler for.
          </P>
          <Dropdown
            label="Formål"
            size="medium"
            stretch
            title="Velg"
            data={[
              { selectedKey: "lonn", content: "Lønn" },
              { selectedKey: "familie", content: "Familiestøtte" },
              { selectedKey: "varer", content: "Kjøp av varer" },
              { selectedKey: "tjenester", content: "Kjøp av tjenester" },
              { selectedKey: "investering", content: "Investering" },
              { selectedKey: "annet", content: "Annet" },
            ]}
            value={purpose}
            onChange={({ data }) => setPurpose(typeof data?.selectedKey === "string" ? data.selectedKey : "")}
          />
          <Input
            label="Beskrivelse"
            size="medium"
            stretch
            placeholder="Beskriv hva du betaler for"
            value={description}
            onChange={({ value }) => setDescription(value)}
          />
        </div>
      )}
    </div>
  );
}

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
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const messageMaxLength = 140;
  const today = new Date().toISOString().slice(0, 10);
  const [paymentDate, setPaymentDate] = useState(today);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [showFixedRate, setShowFixedRate] = useState(false);
  const [showPurpose, setShowPurpose] = useState(false);
  const [paymentType, setPaymentType] = useState("cross-border");

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
                mode="strict"
                currentStep={currentStep}
                data={[
                  { title: "Betalingsdetaljer" },
                  { title: "Se over og fullfør" },
                ]}
                onChange={({ currentStep: next }) => setCurrentStep(next)}
              />
            </div>
          </div>

          {/* Step content */}
          {currentStep === 0 ? (
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
                    <Input
                      label="Beløp"
                      size="medium"
                      stretch
                      value={amount}
                      onChange={({ value }) => setAmount(value)}
                    />
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
          ) : (
            <SummaryStep
              paymentDate={paymentDate}
              recipient={selectedRecipient}
              currency={selectedCurrency}
              amount={amount}
              amountInNok={amountInNok}
              showFixedRate={showFixedRate}
              showPurpose={showPurpose}
            />
          )}
        </div>
      </div>

      {/* Tools button */}
      <div style={{ position: "fixed", top: "32px", right: "32px", zIndex: 100 }}>
        <Button
          variant="secondary"
          icon={filter}
          aria-label="Tools menu"
          onClick={() => setToolsOpen((o) => !o)}
          style={{ borderRadius: "50%", width: "48px", height: "48px", padding: 0 }}
        />
      </div>

      {/* Tools popover */}
      {toolsOpen && (
        <div
          style={{
            position: "fixed",
            top: "92px",
            right: "32px",
            background: "var(--token-color-background-neutral)",
            border: "1px solid var(--token-color-stroke-neutral-subtle, #ebebeb)",
            filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.08))",
            borderRadius: "var(--token-radius-md, 8px)",
            minWidth: "440px",
            maxWidth: "560px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 99,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <P size="basis" style={{ fontWeight: 500, margin: 0 }}>Configurations menu</P>
              <button
                onClick={() => setToolsOpen(false)}
                aria-label="Lukk"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon icon={close} size="small" />
              </button>
            </div>
            <P size="basis" style={{ margin: 0 }}>
              For experimening purposes only...
            </P>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Show fixed rate</P>
            <Switch label="Show fixed rate" labelSrOnly checked={showFixedRate} onChange={({ checked }) => setShowFixedRate(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Show purpose</P>
            <Switch label="Show purpose" labelSrOnly checked={showPurpose} onChange={({ checked }) => setShowPurpose(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Payment type</P>
            <div className="narrow-dropdown">
              <style>{`
                .narrow-dropdown .dnb-dropdown { --dropdown-width: 10rem; }
              `}</style>
              <Dropdown
                label="Payment type"
                labelSrOnly
                size="small"
                value={paymentType}
                data={[
                  { selectedKey: "cross-border", content: "Cross border" },
                  { selectedKey: "europa", content: "Europa" },
                  { selectedKey: "sepa", content: "SEPA" },
                ]}
                onChange={({ data }) => setPaymentType(typeof data?.selectedKey === "string" ? data.selectedKey : "cross-border")}
              />
            </div>
          </div>
        </div>
      )}
    </Theme>
  );
}

