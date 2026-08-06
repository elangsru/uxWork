"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, StepIndicator, Autocomplete, Icon, Avatar, Badge, CountryFlag, Input, InputMasked, Textarea, Switch, DatePicker, Anchor, List, FormStatus, Radio, Dropdown, Popover, Dialog, Accordion, Tabs } from "@dnb/eufemia/components";
import { H1, H3, P } from "@dnb/eufemia/elements";
import { chevron_down, chevron_up, chevron_right, chevron_left, add, globe_medium, filter, close, bank_medium, location_medium, edit } from "@dnb/eufemia/icons";

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

type Recipient = {
  name: string;
  iban: string;
  iso: string;
  currencies: string[];
  defaultCurrency: string;
  bankName: string;
  bankAddress: string[];
  swift: string;
  address: string[];
};

const recipients: Recipient[] = [
  {
    name: "Didrich Stökl",
    iban: "AT48 3200 0000 1234 5864",
    iso: "AT",
    currencies: ["EUR"],
    defaultCurrency: "EUR",
    bankName: "RAIFFEISENLANDESBANK NIEDEROESTERREICH-WIEN AG",
    bankAddress: ["Friedrich-Wilhelm-Raiffeisenplatz 1", "Austria"],
    swift: "RLNWATWWXXX",
    address: ["Streetname 123", "12345 Vienna", "Austria"],
  },
  {
    name: "John Jones",
    iban: "GB33 BUKB 2020 1555 5555 55",
    iso: "GB",
    currencies: ["EUR", "GBP"],
    defaultCurrency: "GBP",
    bankName: "BARCLAYS BANK PLC",
    bankAddress: ["1 Churchill Place", "London", "United Kingdom"],
    swift: "BUKBGB22",
    address: ["12 Baker Street", "W1U 6TT London", "United Kingdom"],
  },
  {
    name: "Jose Martinez",
    iban: "ES79 2100 0813 6101 2345 6789",
    iso: "ES",
    currencies: ["EUR"],
    defaultCurrency: "EUR",
    bankName: "CAIXABANK S.A.",
    bankAddress: ["Av. Diagonal 621", "Barcelona", "Spain"],
    swift: "CAIXESBBXXX",
    address: ["Carrer de Mallorca 401", "08013 Barcelona", "Spain"],
  },
  {
    name: "Medel Svedsson",
    iban: "SE72 8000 0810 3400 0978 3242",
    iso: "SE",
    currencies: ["EUR", "SEK"],
    defaultCurrency: "SEK",
    bankName: "SVENSKA HANDELSBANKEN AB",
    bankAddress: ["Kungsträdgårdsgatan 2", "Stockholm", "Sweden"],
    swift: "HANDSESS",
    address: ["Drottninggatan 15", "111 51 Stockholm", "Sweden"],
  },
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
  showPurpose,
  customInfoStyle,
  paymentType,
  fullWidth,
  costOption,
  setCostOption,
  purpose,
  setPurpose,
  description,
  setDescription,
  onBack,
}: {
  paymentDate: string;
  recipient: Recipient | null;
  currency: Currency | null;
  amount: string;
  amountInNok: boolean;
  showPurpose: boolean;
  customInfoStyle: boolean;
  paymentType: string;
  fullWidth: boolean;
  costOption: string;
  setCostOption: (value: string) => void;
  purpose: string;
  setPurpose: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  onBack: () => void;
}) {
  const rate = currency ? exchangeRates[currency.code] ?? 1 : 1;
  const amountNum = parseFloat(amount.replace(",", ".")) || 0;
  const foreignAmount = amountInNok ? amountNum / rate : amountNum;
  const nokAmount = amountInNok ? amountNum : amountNum * rate;
  const currencyCode = currency?.code ?? "—";

  const isEuropa = paymentType === "europa";
  const isSepa = paymentType === "sepa";
  const isCrossBorder = !isEuropa && !isSepa;
  const cost = isEuropa
    ? 30
    : isSepa
    ? 0
    : costOption === "jeg"
    ? 410
    : costOption === "mottaker"
    ? 0
    : 60;
  const costLabel = isEuropa
    ? "Europa-betaling"
    : isSepa
    ? "SEPA-betaling"
    : "Cross border-betaling";
  const costDisplay = isEuropa
    ? "kr 30,00"
    : isSepa
    ? "kr 0,00"
    : `NOK ${fmtAmount(cost)}`;
  const costMessage = isSepa
    ? null
    : isEuropa
    ? "Transaksjonskostnaden er delt mellom deg og mottaker. Dette er din pris."
    : costOption === "jeg"
    ? "Ekstra gebyr (NOK 350,00) legges til prisen (NOK 60,00) for å dekke kostnader belastet i andre banker."
    : costOption === "mottaker"
    ? `Kostnader belastet av andre banker blir trukket fra beløpet som sendes (${currencyCode} ${fmtAmount(foreignAmount)}). Sørg for å ha nok til å dekke det du skal betale for.`
    : "Transaksjonskostnaden er delt mellom deg og mottaker. Dette er din pris.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: fullWidth ? "100%" : "488px", width: "100%" }}>
      <style>{`
        .summary-container .dnb-list__item::after { display: none !important; }
        .summary-container .dnb-list__item { border-radius: 0 !important; }
        .summary-container .dnb-list__item:not(:last-child) {
          border-bottom: 1px solid var(--token-color-stroke-neutral-subtle);
        }
        .summary-container .dnb-list__item__footer-separator { display: none; }
        .summary-container .dnb-list__item__footer { padding-top: 0; }
        .summary-container .dnb-form-status,
        .summary-container .dnb-form-status__shell,
        .summary-container .dnb-form-status__text { max-width: none !important; width: 100%; }
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
              <List.Cell.Title>Betalingsdato</List.Cell.Title>
              <List.Cell.End>{fmtDate(paymentDate)}</List.Cell.End>
            </List.Item.Basic>
            <List.Item.Basic>
              <List.Cell.Title>Du sender{amountInNok ? "" : " (ca)"}</List.Cell.Title>
              <List.Cell.End>NOK {fmtAmount(nokAmount)}</List.Cell.End>
            </List.Item.Basic>
            <List.Item.Basic>
              <List.Cell.Title>{recipient ? `${recipient.name} mottar` : "Mottaker mottar"}{amountInNok ? " (ca)" : ""}</List.Cell.Title>
              <List.Cell.End>{currencyCode} {fmtAmount(foreignAmount)}</List.Cell.End>
            </List.Item.Basic>
            <List.Item.Basic>
              <List.Cell.Title>Valutakurs ({currencyCode} 1)</List.Cell.Title>
              <List.Cell.End>NOK {fmtAmount(rate)}</List.Cell.End>
              {!customInfoStyle && (
                <List.Cell.Footer>
                  <FormStatus
                    state="information"
                    stretch
                    text="Valutakurs er kun foreløpig. Endelig kurs settes når betalingen gjennomføres."
                  />
                </List.Cell.Footer>
              )}
            </List.Item.Basic>
          </List.Container>
          {customInfoStyle && (
            <FormStatus
              state="information"
              stretch
              text="Valutakurs er kun foreløpig. Endelig kurs settes når betalingen gjennomføres."
              style={{ "--form-status-radius": "0" } as CSSProperties}
            />
          )}
        </div>
      </div>

      {/* Pris */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <H3>Pris</H3>
        {isCrossBorder && (
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
        )}
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
              <List.Cell.Title>{costLabel}</List.Cell.Title>
              <List.Cell.End>{costDisplay}</List.Cell.End>
              {!customInfoStyle && costMessage && (
                <List.Cell.Footer>
                  <FormStatus state="information" stretch text={costMessage} />
                </List.Cell.Footer>
              )}
            </List.Item.Basic>
          </List.Container>
          {customInfoStyle && (
            <FormStatus
              state="information"
              stretch
              text={costMessage ?? ""}
              style={{
                "--form-status-radius": "0",
                display: costMessage ? undefined : "none",
              } as CSSProperties}
            />
          )}
        </div>
      </div>

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

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Button
          variant="tertiary"
          text="Tilbake"
          icon={chevron_left}
          iconPosition="left"
          onClick={onBack}
        />
        <Button variant="primary" text="Betal" href="/internationalPaymentConfirmation" />
      </div>
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

type BankCountry = { code: string; name: string; iso: string };

const bankCountryList: BankCountry[] = [
  { code: "AU", name: "Australia", iso: "AU" },
  { code: "DK", name: "Danmark", iso: "DK" },
  { code: "FR", name: "Frankrike", iso: "FR" },
  { code: "ES", name: "Spania", iso: "ES" },
  { code: "GB", name: "Storbritannia", iso: "GB" },
  { code: "SE", name: "Sverige", iso: "SE" },
  { code: "DE", name: "Tyskland", iso: "DE" },
  { code: "US", name: "USA", iso: "US" },
];

const bankCountries = bankCountryList.map((c) => ({
  selectedKey: c.code,
  selectedValue: c.name,
  searchContent: [c.name, c.code],
  content: (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
      <CountryFlag iso={c.iso} size="medium" />
      <span>{c.name}</span>
    </div>
  ),
}));

type BankDetails = { swift: string; name: string; address: string };

const prefixValidatedCountries = new Set(["DK", "ES", "SE", "DE", "FR"]);

// Example IBANs following each country's structure (iban.com/structure)
const ibanExamples: Record<string, string> = {
  DK: "DK50 0040 0440 1162 43",
  ES: "ES91 2100 0418 4502 0005 1332",
  SE: "SE45 5000 0000 0583 9825 7466",
  DE: "DE89 3704 0044 0532 0130 00",
  FR: "FR14 2004 1010 0505 0001 3M02 606",
};

// IBAN total length (excl. spaces) per country (iban.com/structure)
const ibanLengths: Record<string, number> = {
  DK: 18,
  ES: 24,
  SE: 24,
  DE: 22,
  FR: 27,
};

const bankLookup: Record<string, BankDetails> = {
  DK12345: {
    swift: "DABADKKK",
    name: "Danske Bank",
    address: "Holmens Kanal 2-12\n1092 København K\nDanmark",
  },
  ES12345: {
    swift: "BSCHESMMXXX",
    name: "Banco Santander",
    address: "Paseo de Pereda 9-12\n39004 Santander\nSpania",
  },
  SE12345: {
    swift: "SWEDSESS",
    name: "Swedbank",
    address: "Landsvägen 40\n172 63 Sundbyberg\nSverige",
  },
  DE12345: {
    swift: "DEUTDEFF",
    name: "Deutsche Bank",
    address: "Taunusanlage 12\n60325 Frankfurt am Main\nTyskland",
  },
  FR12345: {
    swift: "BNPAFRPP",
    name: "BNP Paribas",
    address: "16 Boulevard des Italiens\n75009 Paris\nFrankrike",
  },
};

export default function InternationalPayment() {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [bankCountryOpen, setBankCountryOpen] = useState(false);
  const [selectedBankCountry, setSelectedBankCountry] = useState<BankCountry | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientCountryOpen, setRecipientCountryOpen] = useState(false);
  const [recipientCountry, setRecipientCountry] = useState<BankCountry | null>(null);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const recipientNameMaxLength = 35;
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [selectedFromKey, setSelectedFromKey] = useState<string | null>(null);
  const [amountInNok, setAmountInNok] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const messageMaxLength = 140;
  const today = new Date().toISOString().slice(0, 10);
  const [paymentDate, setPaymentDate] = useState(today);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [showPurpose, setShowPurpose] = useState(false);
  const [customInfoStyle, setCustomInfoStyle] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [paymentType, setPaymentType] = useState("sepa");
  const [recipientLayout, setRecipientLayout] = useState<"none" | "accordion" | "tabs">("none");
  const [costOption, setCostOption] = useState("delt");
  const [agreedRate, setAgreedRate] = useState("");
  const [reference, setReference] = useState("");
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    const fw = sessionStorage.getItem("fullWidth");
    const dm = sessionStorage.getItem("darkMode");
    const to = sessionStorage.getItem("toolsOpen");
    setFullWidth(fw === "true");
    setDarkMode(dm === "true");
    setToolsOpen(to === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("fullWidth", String(fullWidth));
  }, [fullWidth, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("darkMode", String(darkMode));
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("toolsOpen", String(toolsOpen));
  }, [toolsOpen, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("message", message);
  }, [message, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("paymentType", paymentType);
  }, [paymentType, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("costOption", costOption);
  }, [costOption, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedRecipient) {
      sessionStorage.setItem("toName", selectedRecipient.name);
      sessionStorage.setItem("toNumber", selectedRecipient.iban);
    } else {
      sessionStorage.removeItem("toName");
      sessionStorage.removeItem("toNumber");
    }
  }, [selectedRecipient, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedFromKey !== null) {
      const idx = parseInt(selectedFromKey, 10);
      const acc = fromAccountList[idx];
      if (acc) {
        sessionStorage.setItem("fromName", String(acc.content[0]));
        sessionStorage.setItem("fromNumber", String(acc.content[1]));
      }
    } else {
      sessionStorage.removeItem("fromName");
      sessionStorage.removeItem("fromNumber");
    }
  }, [selectedFromKey, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("amount", amount);
  }, [amount, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("amountInNok", String(amountInNok));
  }, [amountInNok, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("paymentDate", paymentDate);
  }, [paymentDate, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedCurrency) {
      sessionStorage.setItem("currencyCode", selectedCurrency.code);
    } else {
      sessionStorage.removeItem("currencyCode");
    }
  }, [selectedCurrency, hydrated]);
  const [description, setDescription] = useState("");

  const recipientError = submitted && !selectedRecipient ? "Dette feltet må fylles ut." : undefined;

  useEffect(() => {
    if (selectedRecipient?.name === "John Jones") {
      setPaymentType("europa");
    } else if (selectedRecipient) {
      setPaymentType("sepa");
    }
  }, [selectedRecipient]);

  useEffect(() => {
    if (selectedRecipient) {
      const def = currencyList.find((c) => c.code === selectedRecipient.defaultCurrency);
      if (def) setSelectedCurrency(def);
    } else {
      setSelectedCurrency(null);
    }
  }, [selectedRecipient]);

  const filteredCurrencies = selectedRecipient
    ? currencies.filter((c) => selectedRecipient.currencies.includes(String(c.selectedKey)))
    : currencies;
  const messageError = submitted && !message.trim() ? "Dette feltet må fylles ut." : undefined;

  function handleNext() {
    setSubmitted(true);
    if (selectedRecipient && message.trim()) {
      setCurrentStep(1);
    }
  }

  if (!hydrated) {
    return <div style={{ minHeight: "100vh", background: "var(--token-color-background-neutral-subtle)" }} />;
  }

  const bankFields = (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <P>Betaling til utlandet krevet at vi vet noe om mottakers bank.</P>
      <Autocomplete
        label="Bankens land"
        size="medium"
        data={bankCountries}
        placeholder="Velg land"
        stretch
        showSubmitButton
        submitButtonTitle=""
        submitButtonIcon={<Icon icon={bankCountryOpen ? chevron_up : chevron_down} />}
        icon={selectedBankCountry ? <CountryFlag iso={selectedBankCountry.iso} size="small" /> : undefined}
        value={selectedBankCountry?.code ?? undefined}
        onOpen={() => setBankCountryOpen(true)}
        onClose={() => setBankCountryOpen(false)}
        onChange={({ selectedItem }) => {
          if (typeof selectedItem === "number" && bankCountries[selectedItem]) {
            const code = String(bankCountries[selectedItem].selectedKey);
            const country = bankCountryList.find((x) => x.code === code) ?? null;
            setSelectedBankCountry(country);
            setRecipientCountry(country);
          } else {
            setSelectedBankCountry(null);
          }
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Input
          label={
            selectedBankCountry && prefixValidatedCountries.has(selectedBankCountry.code)
              ? "Kontonummer (IBAN)"
              : "Kontonummer"
          }
          size="medium"
          stretch
          disabled={!selectedBankCountry}
          placeholder={
            selectedBankCountry && ibanExamples[selectedBankCountry.code]
              ? `e.g. ${ibanExamples[selectedBankCountry.code]}`
              : undefined
          }
          value={accountNumber}
          status={
            selectedBankCountry &&
            prefixValidatedCountries.has(selectedBankCountry.code) &&
            accountNumber.trim().length >= 2 &&
            !accountNumber.trim().toUpperCase().startsWith(selectedBankCountry.code)
              ? `Kontonummer for ${selectedBankCountry.name} må starte med ${selectedBankCountry.code}.`
              : undefined
          }
          onChange={({ value }) => {
            setAccountNumber(value);
            const match = bankLookup[value.trim().toUpperCase()];
            setSwiftBic(match?.swift ?? "");
            setBankName(match?.name ?? "");
            setBankAddress(match?.address ?? "");
          }}
        />
        {selectedBankCountry && ibanLengths[selectedBankCountry.code] && (
          <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
            {Math.max(
              ibanLengths[selectedBankCountry.code] - accountNumber.replace(/\s/g, "").length,
              0
            )}{" "}
            av {ibanLengths[selectedBankCountry.code]} tegn gjenstår.
          </P>
        )}
      </div>
      {selectedBankCountry && (
        <>
          <Input
            label="SWIFT/BIC"
            size="medium"
            stretch
            disabled
            placeholder="e.g. DK9UIZZKQDK"
            value={swiftBic}
            onChange={({ value }) => setSwiftBic(value)}
          />
          <Input
            label="Bankens navn"
            size="medium"
            stretch
            disabled
            value={bankName}
            onChange={({ value }) => setBankName(value)}
          />
          <Textarea
            label="Bankens adresse"
            size="medium"
            stretch
            rows={3}
            disabled
            value={bankAddress}
            onChange={({ value }) => setBankAddress(value)}
          />
        </>
      )}
    </div>
  );

  const recipientFields = (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <P>Vi trenger også info om mottakers navn og bostedsadresse.</P>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Input
          label="Navn/firma"
          size="medium"
          stretch
          placeholder="Navn eller firmanavn på mottaker"
          value={recipientName}
          maxLength={recipientNameMaxLength}
          onChange={({ value }) => setRecipientName(value)}
        />
        <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
          {recipientNameMaxLength - recipientName.length} av {recipientNameMaxLength} tegn gjenstår.
        </P>
      </div>
      <Autocomplete
        label="Mottakers land"
        size="medium"
        data={bankCountries}
        placeholder="Velg land"
        stretch
        showSubmitButton
        submitButtonTitle=""
        submitButtonIcon={<Icon icon={recipientCountryOpen ? chevron_up : chevron_down} />}
        icon={recipientCountry ? <CountryFlag iso={recipientCountry.iso} size="small" /> : undefined}
        value={recipientCountry?.code ?? undefined}
        onOpen={() => setRecipientCountryOpen(true)}
        onClose={() => setRecipientCountryOpen(false)}
        onChange={({ selectedItem }) => {
          if (typeof selectedItem === "number" && bankCountries[selectedItem]) {
            const code = String(bankCountries[selectedItem].selectedKey);
            setRecipientCountry(bankCountryList.find((x) => x.code === code) ?? null);
          } else {
            setRecipientCountry(null);
          }
        }}
      />
      <Input
        label="Adresselinje 1 (valgfritt)"
        size="medium"
        stretch
        placeholder="F.eks. Storgata 10"
        value={addressLine1}
        onChange={({ value }) => setAddressLine1(value)}
      />
      <Input
        label="Adresselinje 2 (valgfritt)"
        size="medium"
        stretch
        placeholder="F.eks. Bygning 1A"
        value={addressLine2}
        onChange={({ value }) => setAddressLine2(value)}
      />
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <Input
            label="Postnummer"
            size="medium"
            stretch
            placeholder="F.eks. 1234"
            value={postalCode}
            onChange={({ value }) => setPostalCode(value)}
          />
        </div>
        <div style={{ flex: 4 }}>
          <Input
            label="Sted/by"
            size="medium"
            stretch
            placeholder="F.eks. Oslo"
            value={city}
            onChange={({ value }) => setCity(value)}
          />
        </div>
      </div>
    </div>
  );

  const saveButton = (
    <Button variant="primary" top="large" style={{ alignSelf: "flex-start" }}>
      Lagre og fortsett
    </Button>
  );

  const recipientModalContent =
    recipientLayout === "none" ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <H3 style={{ margin: 0 }}>Mottakers bank</H3>
          {bankFields}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <H3 style={{ margin: 0 }}>Mottaker</H3>
          {recipientFields}
        </div>
        {saveButton}
      </div>
    ) : recipientLayout === "tabs" ? (
      <>
        <Tabs
          data={[
            { title: "Mottakers bank", key: "bank" },
            { title: "Mottakers adresse", key: "adresse" },
          ]}
        >
          {(key) => (key === "bank" ? bankFields : recipientFields)}
        </Tabs>
        {saveButton}
      </>
    ) : (
      <>
        <Accordion.Group expandBehavior="multiple" allowCloseAll>
          <Accordion title="Mottakers bank" expanded variant="outlined">
            {bankFields}
          </Accordion>
          <Accordion title="Mottakers adresse" variant="outlined" top="large">
            {recipientFields}
          </Accordion>
        </Accordion.Group>
        {saveButton}
      </>
    );

  return (
    <Theme colorScheme={darkMode ? "dark" : "light"}>
      <style>{`
        .eufemia-theme__color-scheme--dark .dnb-step-indicator {
          --step-indicator-trigger-background: var(--token-color-background-neutral-alternative);
          --step-indicator-trigger-content-background: var(--token-color-background-neutral);
          --step-indicator-current-border: var(--token-color-text-neutral);
          color: var(--token-color-text-neutral);
        }
        .eufemia-theme__color-scheme--dark .dnb-step-indicator__item__bullet--empty {
          background-color: var(--token-color-background-neutral) !important;
          border-color: var(--token-color-stroke-neutral-subtle) !important;
          color: var(--token-color-text-neutral-subtle) !important;
        }
        .eufemia-theme__color-scheme--dark .dnb-step-indicator__item__bullet--current {
          border-color: var(--token-color-text-neutral) !important;
        }
        .eufemia-theme__color-scheme--dark .dnb-step-indicator__item__line {
          background-color: var(--token-color-stroke-neutral-subtle) !important;
        }
        .eufemia-theme__color-scheme--dark .dnb-date-picker__container {
          background-color: var(--token-color-background-neutral);
        }
        .eufemia-theme__color-scheme--dark .dnb-date-picker__portal .dnb-popover {
          --popover-background-color: var(--token-color-background-neutral);
        }
        .eufemia-theme__color-scheme--dark .dnb-date-picker__header::after,
        .eufemia-theme__color-scheme--dark .dnb-date-picker__addon::after,
        .eufemia-theme__color-scheme--dark .dnb-date-picker__calendar::after {
          background-color: var(--token-color-stroke-neutral-subtle);
        }
        .eufemia-theme__color-scheme--dark .dnb-date-picker__header__title,
        .eufemia-theme__color-scheme--dark .dnb-date-picker__labels__day {
          color: var(--token-color-text-neutral);
        }
        .eufemia-theme__color-scheme--dark .dnb-date-picker__day--inactive .dnb-button {
          color: var(--token-color-text-neutral-subtle);
        }
        .eufemia-theme__color-scheme--dark .dnb-date-picker__day--end-date:not(.dnb-date-picker__day--inactive)::after,
        .eufemia-theme__color-scheme--dark .dnb-date-picker__day--preview:not(.dnb-date-picker__day--inactive):not(.dnb-date-picker__day--start-date):not(.dnb-date-picker__day--end-date),
        .eufemia-theme__color-scheme--dark .dnb-date-picker__day--start-date:not(.dnb-date-picker__day--inactive)::after,
        .eufemia-theme__color-scheme--dark .dnb-date-picker__day--within-selection:not(.dnb-date-picker__day--inactive):not(.dnb-date-picker__day--start-date):not(.dnb-date-picker__day--end-date) {
          background-color: var(--token-color-background-selected-subtle);
        }
        .eufemia-theme__color-scheme--dark .dnb-date-picker__day--end-date:not(.dnb-date-picker__day--inactive) .dnb-button,
        .eufemia-theme__color-scheme--dark .dnb-date-picker__day--start-date:not(.dnb-date-picker__day--inactive) .dnb-button {
          background-color: var(--token-color-background-selected);
          color: var(--token-color-text-neutral-inverse);
        }
      `}</style>
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
            <div style={{ maxWidth: fullWidth ? "100%" : "488px", width: "100%" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: fullWidth ? "100%" : "488px", width: "100%" }}>
              <Autocomplete
                label="Fra konto"
                size="medium"
                data={fromAccounts}
                placeholder="Velg konto"
                stretch
                showSubmitButton
                submitButtonTitle=""
                submitButtonIcon={<Icon icon={fromOpen ? chevron_up : chevron_down} />}
                value={selectedFromKey ?? undefined}
                onOpen={() => setFromOpen(true)}
                onClose={() => setFromOpen(false)}
                onChange={({ selectedItem }) => {
                  if (typeof selectedItem === "number") {
                    setSelectedFromKey(String(selectedItem));
                  } else {
                    setSelectedFromKey(null);
                  }
                }}
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
                    value={selectedRecipient?.iban ?? undefined}
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
                  <Dialog
                    title="Ny mottaker"
                    trigger={Button}
                    triggerAttributes={{ text: "Ny", variant: "secondary", icon: add, iconPosition: "left" }}
                  >
                    {recipientModalContent}
                  </Dialog>
                </div>
              </div>
              {selectedRecipient && (
                <div style={{ marginTop: "-16px" }}>
                  <Popover
                    title="Info om betalingsmottaker"
                    placement="bottom"
                    alignOnTarget="center"
                    arrowPosition="center"
                    trigger={({ ref, toggle }) => (
                      <Button
                        ref={ref as React.Ref<HTMLButtonElement>}
                        variant="tertiary"
                        text={selectedRecipient.name}
                        icon={chevron_right}
                        iconPosition="right"
                        onClick={() => toggle()}
                      />
                    )}
                  >
                    <div
                      style={{
                        outline: "1px solid var(--token-color-stroke-neutral-alternative)",
                        borderRadius: "var(--token-radius-md)",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <Icon icon={bank_medium} size="medium" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <P style={{ fontWeight: 500, margin: 0 }}>Mottakers bank:</P>
                          <P style={{ margin: 0 }}>{selectedRecipient.bankName}</P>
                          {selectedRecipient.bankAddress.map((line) => (
                            <P key={line} style={{ margin: 0 }}>{line}</P>
                          ))}
                          <P style={{ fontWeight: 500, margin: 0, marginTop: "8px" }}>SWIFT/BIC-kode:</P>
                          <P style={{ margin: 0 }}>{selectedRecipient.swift}</P>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <Icon icon={location_medium} size="medium" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <P style={{ fontWeight: 500, margin: 0 }}>Mottakers adresse:</P>
                          {selectedRecipient.address.map((line) => (
                            <P key={line} style={{ margin: 0 }}>{line}</P>
                          ))}
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid var(--token-color-stroke-neutral-subtle)", paddingTop: "12px" }}>
                        <Button variant="tertiary" text="Endre" icon={edit} iconPosition="left" />
                      </div>
                    </div>
                  </Popover>
                </div>
              )}
              <Autocomplete
                label="Valuta som sendes"
                size="medium"
                data={filteredCurrencies}
                placeholder="Velg valuta"
                stretch
                disabled={!selectedRecipient}
                showSubmitButton
                submitButtonTitle=""
                submitButtonIcon={<Icon icon={currencyOpen ? chevron_up : chevron_down} />}
                icon={selectedCurrency ? <CountryFlag iso={selectedCurrency.iso} size="small" /> : undefined}
                value={selectedCurrency?.code ?? undefined}
                onOpen={() => setCurrencyOpen(true)}
                onClose={() => setCurrencyOpen(false)}
                onChange={({ selectedItem }) => {
                  if (typeof selectedItem === "number" && filteredCurrencies[selectedItem]) {
                    const code = String(filteredCurrencies[selectedItem].selectedKey);
                    const c = currencyList.find((x) => x.code === code);
                    setSelectedCurrency(c ?? null);
                  } else {
                    setSelectedCurrency(null);
                  }
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <InputMasked
                      label="Beløp"
                      size="medium"
                      stretch
                      numberMask={{
                        prefix: `${amountInNok ? "NOK" : selectedCurrency?.code ?? "NOK"} `,
                        suffix: "",
                        allowDecimal: true,
                        decimalLimit: 2,
                        thousandsSeparatorSymbol: " ",
                        decimalSymbol: ",",
                      }}
                      placeholder={amountInNok ? "NOK" : selectedCurrency?.code ?? ""}
                      value={amount}
                      onChange={({ numberValue }) => setAmount(numberValue !== undefined && !isNaN(numberValue) ? String(numberValue) : "")}
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
                  {(() => {
                    const amountNum = parseFloat(amount.replace(",", ".")) || 0;
                    const rate = selectedCurrency ? exchangeRates[selectedCurrency.code] ?? 1 : 1;
                    const formatted = (v: number) => v > 0 ? fmtAmount(v) : "-,--";
                    if (amountInNok) {
                      const foreign = rate ? amountNum / rate : 0;
                      const recipientName = selectedRecipient?.name ?? "Mottaker";
                      const code = selectedCurrency?.code ?? "—";
                      return `${recipientName} mottar ca ${code} ${formatted(foreign)}. Korrekt kurs fastsettes når betalingen gjennomføres.`;
                    }
                    const nok = amountNum * rate;
                    return `Du blir belastet ca NOK ${formatted(nok)}. Korrekt kurs fastsettes når betalingen gjennomføres.`;
                  })()}
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
              <Accordion title="Tilleggstjenester" variant="outlined" iconPosition="right">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <H3>Avtalt valutakurs</H3>
                  <P>
                    For større beløp kan valutakurs avtales. Kontakt en av våre valutameglere på telefon +47 24 16 90 90.
                  </P>
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ flex: "1 0 0", minWidth: 0 }}>
                      <Input
                        label={`Avtalt kurs${selectedCurrency ? ` (${selectedCurrency.code})` : ""}`}
                        size="medium"
                        stretch
                        placeholder="Vekslingskurs"
                        value={agreedRate}
                        onChange={({ value }) => setAgreedRate(value)}
                      />
                    </div>
                    <div style={{ flex: "1 0 0", minWidth: 0 }}>
                      <Input
                        label="Avtalt med (referanse)"
                        size="medium"
                        stretch
                        placeholder="Initialer"
                        value={reference}
                        onChange={({ value }) => setReference(value)}
                      />
                    </div>
                  </div>
                </div>
              </Accordion>
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
              showPurpose={showPurpose}
              customInfoStyle={customInfoStyle}
              paymentType={paymentType}
              fullWidth={fullWidth}
              costOption={costOption}
              setCostOption={setCostOption}
              purpose={purpose}
              setPurpose={setPurpose}
              description={description}
              setDescription={setDescription}
              onBack={() => setCurrentStep(0)}
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
              For experimenting purposes only...
            </P>
          </div>

          {currentStep === 1 && (
            <>
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

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
                <P size="basis" style={{ margin: 0 }}>Show purpose</P>
                <Switch label="Show purpose" labelSrOnly checked={showPurpose} onChange={({ checked }) => setShowPurpose(checked)} />
              </div>
            </>
          )}

          {currentStep === 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
              <P size="basis" style={{ margin: 0 }}>New recipient</P>
              <div className="narrow-dropdown">
                <style>{`
                  .narrow-dropdown .dnb-dropdown { --dropdown-width: 10rem; }
                `}</style>
                <Dropdown
                  label="New recipient"
                  labelSrOnly
                  size="small"
                  value={recipientLayout}
                  data={[
                    { selectedKey: "none", content: "None" },
                    { selectedKey: "accordion", content: "Accordion" },
                    { selectedKey: "tabs", content: "Tabs" },
                  ]}
                  onChange={({ data }) =>
                    setRecipientLayout(
                      data?.selectedKey === "none" || data?.selectedKey === "tabs"
                        ? data.selectedKey
                        : "accordion"
                    )
                  }
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Full width</P>
            <Switch label="Full width" labelSrOnly checked={fullWidth} onChange={({ checked }) => setFullWidth(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Dark mode</P>
            <Switch label="Dark mode" labelSrOnly checked={darkMode} onChange={({ checked }) => setDarkMode(checked)} />
          </div>

          {currentStep === 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
              <P size="basis" style={{ margin: 0 }}>Info message filled</P>
              <Switch label="Info message filled" labelSrOnly checked={customInfoStyle} onChange={({ checked }) => setCustomInfoStyle(checked)} />
            </div>
          )}
        </div>
      )}
    </Theme>
  );
}

