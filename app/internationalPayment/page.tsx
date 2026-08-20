"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, StepIndicator, Autocomplete, Icon, Avatar, Badge, CountryFlag, Input, InputMasked, Textarea, Switch, DatePicker, Anchor, List, FormLabel, FormStatus, Radio, Dropdown, Dialog, Tabs } from "@dnb/eufemia/components";
import { H1, H3, P, Hr } from "@dnb/eufemia/elements";
import { chevron_down, chevron_up, chevron_right, chevron_left, add, globe_medium, filter, close, bank_medium, location_medium } from "@dnb/eufemia/icons";

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
  // Strukturerte felter for «Rediger mottaker», der adressen fylles inn i
  // separate inputs. address[] brukes fortsatt til visning i popoveren.
  addressLine1: string;
  postalCode: string;
  city: string;
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
    addressLine1: "Streetname 123",
    postalCode: "12345",
    city: "Vienna",
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
    addressLine1: "12 Baker Street",
    postalCode: "W1U 6TT",
    city: "London",
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
    addressLine1: "Carrer de Mallorca 401",
    postalCode: "08013",
    city: "Barcelona",
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
    addressLine1: "Drottninggatan 15",
    postalCode: "111 51",
    city: "Stockholm",
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
  const costMessage = isSepa || isEuropa
    ? null
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

type BankCountry = { code: string; name: string; iso: string; usesIban: boolean };

// Felles landregister. Brukes i sin helhet som «Mottakers land», siden det
// bare er et adressefelt.
const countryList: BankCountry[] = [
  { code: "AR", name: "Argentina", iso: "AR", usesIban: false },
  { code: "AU", name: "Australia", iso: "AU", usesIban: false },
  { code: "DK", name: "Danmark", iso: "DK", usesIban: true },
  { code: "FR", name: "Frankrike", iso: "FR", usesIban: true },
  { code: "ES", name: "Spania", iso: "ES", usesIban: true },
  { code: "GB", name: "Storbritannia", iso: "GB", usesIban: true },
  { code: "SE", name: "Sverige", iso: "SE", usesIban: true },
  { code: "DE", name: "Tyskland", iso: "DE", usesIban: true },
  { code: "AT", name: "Østerrike", iso: "AT", usesIban: true },
  { code: "US", name: "USA", iso: "US", usesIban: false },
];

// «Bankens land» er foreløpig begrenset til disse to, siden kontonummer-
// logikken (lengde, prefiks, bankoppslag) kun er satt opp for dem.
const bankCountryCodes = new Set(["DK", "AR"]);
const bankCountryList = countryList.filter((c) => bankCountryCodes.has(c.code));

const toAutocompleteData = (list: BankCountry[]) =>
  list.map((c) => ({
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

const bankCountries = toAutocompleteData(bankCountryList);
const recipientCountries = toAutocompleteData(countryList);

type BankDetails = { swift: string; name: string; address: string };

const prefixValidatedCountries = new Set(["DK", "ES", "SE", "DE", "FR"]);

// Eksempelkontonummer per land, gruppert i firere som i IBAN-notasjon.
// Lengden matcher accountNumberLengths, slik at eksempel og teller stemmer.
// IBAN-landene følger iban.com/structure; AR er et konstruert CBU-lignende
// nummer tilpasset de 30 tegnene som er satt for Argentina.
const accountNumberExamples: Record<string, string> = {
  DK: "DK50 0040 0440 1162 43",
  ES: "ES91 2100 0418 4502 0005 1332",
  SE: "SE45 5000 0000 0583 9825 7466",
  DE: "DE89 3704 0044 0532 0130 00",
  FR: "FR14 2004 1010 0505 0001 3M02 606",
  AR: "2850 5909 4009 0418 1352 0199 1234 56",
};

// Antall tegn i kontonummeret per land, eksklusiv mellomrom. For IBAN-land
// er dette IBAN-lengden (iban.com/structure), og den brukes da også som
// kriterium for bankoppslaget. Argentina bruker CBU, ikke IBAN.
const accountNumberLengths: Record<string, number> = {
  DK: 18,
  ES: 24,
  SE: 24,
  DE: 22,
  FR: 27,
  AR: 30,
};

const bankByCountry: Record<string, BankDetails> = {
  DK: {
    swift: "DABADKKK",
    name: "Danske Bank",
    address: "Holmens Kanal 2-12\n1092 København K\nDanmark",
  },
  ES: {
    swift: "BSCHESMMXXX",
    name: "Banco Santander",
    address: "Paseo de Pereda 9-12\n39004 Santander\nSpania",
  },
  SE: {
    swift: "SWEDSESS",
    name: "Swedbank",
    address: "Landsvägen 40\n172 63 Sundbyberg\nSverige",
  },
  DE: {
    swift: "DEUTDEFF",
    name: "Deutsche Bank",
    address: "Taunusanlage 12\n60325 Frankfurt am Main\nTyskland",
  },
  FR: {
    swift: "BNPAFRPP",
    name: "BNP Paribas",
    address: "16 Boulevard des Italiens\n75009 Paris\nFrankrike",
  },
  // Argentina bruker ikke IBAN. Banken identifiseres av SWIFT/BIC, så bare
  // adressen brukes her — swift/name fylles aldri inn av oppslaget.
  AR: {
    swift: "NACNARBAXXX",
    name: "Banco de la Nación Argentina",
    address: "Bartolomé Mitre 326\nC1036AAF Buenos Aires\nArgentina",
  },
};

// Snarvei for demoing: "DK12345" fyller banken uten et fullstendig IBAN.
const bankLookup: Record<string, BankDetails> = Object.fromEntries(
  Object.entries(bankByCountry).map(([code, details]) => [`${code}12345`, details])
);

// Banken fylles ut når kontonummeret er et komplett IBAN for valgt land:
// riktig antall tegn (accountNumberLengths) og riktig landprefiks.
function resolveBank(accountNumber: string, country: BankCountry | null): BankDetails | null {
  const value = accountNumber.replace(/\s/g, "").toUpperCase();
  if (bankLookup[value]) return bankLookup[value];
  if (!country || !country.usesIban) return null;
  const expectedLength = accountNumberLengths[country.code];
  if (expectedLength === undefined || value.length !== expectedLength) return null;
  if (prefixValidatedCountries.has(country.code) && !value.startsWith(country.code)) return null;
  return bankByCountry[country.code] ?? null;
}

// Delt av «Ny mottaker» og «Rediger mottaker», som bruker samme kortoppsett.
const recipientCardStyles = `
  .ip-recipient-cards .dnb-list__container {
    padding-right: 0;
  }
  .ip-recipient-cards .dnb-list__item::after {
    border-color: var(--token-color-background-neutral-alternative);
  }
  .ip-recipient-cards .dnb-list__item .dnb-list__item__icon .dnb-icon {
    color: var(--token-color-icon-action);
  }
  .ip-recipient-cards .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-icon {
    color: var(--token-color-icon-action);
  }
  .ip-recipient-cards .dnb-list__item__accordion--open {
    --item-background-color: var(--token-color-background-neutral-subtle);
  }
  .ip-recipient-cards .dnb-list__item__accordion__content {
    background-color: var(--token-color-background-neutral);
  }
  .ip-recipient-cards .ip-row-divider {
    margin: 0 -1rem;
    width: auto;
  }
  .ip-recipient-cards .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__chevron.dnb-list__item__chevron {
    place-self: center;
    display: flex;
  }
  .ip-recipient-cards .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__icon.dnb-list__item__icon {
    place-self: center;
  }
  .ip-recipient-cards .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__title.dnb-list__item__title {
    align-self: center;
  }
  .ip-recipient-cards .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__end.dnb-list__item__end {
    align-self: center;
  }
`;

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
  const [recipientLayout, setRecipientLayout] = useState<"current" | "tabs" | "accordion">("accordion");
  const [costOption, setCostOption] = useState("delt");
  const [agreedRate, setAgreedRate] = useState("");
  const [reference, setReference] = useState("");
  const [purpose, setPurpose] = useState("");
  const [extraServicesOpen, setExtraServicesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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

  // Avtalt kurs: kun tall med komma som desimalskilletegn. Komma uten desimaler
  // tillates mens man skriver, slik at feilmeldingen ikke blinker på "10,".
  const agreedRateError =
    agreedRate.trim() !== "" && !/^\d+(,\d*)?$/.test(agreedRate.trim())
      ? "Bruk kun tall"
      : undefined;
  const referenceError =
    reference.trim() !== "" && !/^[A-Za-zÆØÅæøå]+$/.test(reference.trim())
      ? "Bruk kun bokstaver"
      : undefined;

  function handleNext() {
    setSubmitted(true);
    if (selectedRecipient && message.trim()) {
      setCurrentStep(1);
    }
  }

  // Kalles både når kontonummeret og når landet endres, slik at banken
  // ikke blir stående med treff fra et tidligere valgt land.
  function applyBankLookup(nextAccountNumber: string, country: BankCountry | null) {    const bank = resolveBank(nextAccountNumber, country);
    setSwiftBic(bank?.swift ?? "");
    setBankName(bank?.name ?? "");
    setBankAddress(bank?.address ?? "");
  }

  // For land uten IBAN fylles SWIFT/BIC inn manuelt, så oppslaget må ikke
  // overskrive det brukeren skriver. Ved landbytte kjøres applyBankLookup
  // uansett, slik at treff fra forrige land nullstilles.
  function handleAccountNumberChange(value: string) {
    setAccountNumber(value);
    if (selectedBankCountry && !selectedBankCountry.usesIban) return;
    applyBankLookup(value, selectedBankCountry);
  }

  // «Endre» i popoveren åpner samme kortoppsett som «Ny mottaker», men med
  // bankinfo som read-only og mottakerfeltene forhåndsutfylt.
  function openEditRecipient() {
    if (!selectedRecipient) return;
    setRecipientName(selectedRecipient.name);
    setRecipientCountry(countryList.find((c) => c.code === selectedRecipient.iso) ?? null);
    setAddressLine1(selectedRecipient.addressLine1);
    setAddressLine2("");
    setPostalCode(selectedRecipient.postalCode);
    setCity(selectedRecipient.city);
    setEditOpen(true);
  }

  if (!hydrated) {
    return <div style={{ minHeight: "100vh", background: "var(--token-color-background-neutral-subtle)" }} />;
  }

  // SWIFT/BIC vises kun når den er utledet fra IBAN. For land uten IBAN
  // fylles den inn manuelt, og feltet må derfor alltid være synlig.
  const showSwiftBic = Boolean(
    selectedBankCountry && (!selectedBankCountry.usesIban || swiftBic)
  );

  const swiftBicLength = 11;

  // IBAN-land får bankens adresse fra kontonummer-oppslaget. For land uten
  // IBAN identifiseres banken av SWIFT/BIC, og en komplett kode på 11 tegn
  // avdekker adressen.
  function resolveShownBankAddress() {
    if (!selectedBankCountry) return "";
    if (selectedBankCountry.usesIban) return bankAddress;
    if (swiftBic.replace(/\s/g, "").length !== swiftBicLength) return "";
    return bankByCountry[selectedBankCountry.code]?.address ?? "";
  }
  const shownBankAddress = resolveShownBankAddress();

  // Utfylte, ikke-redigerbare bankfelter vises som label + grå verdi
  // (Figma «Edit»-tilstand), ikke som disablede inputs.
  // FormLabel har 8px margin-bottom fra Eufemia. Den nulles her, slik at
  // avstanden styres av gap alene — ellers ville de summert seg.
  const readOnlyField = (label: string, lines: string[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xx-small)" }}>
      <FormLabel style={{ marginBottom: 0 }}>{label}</FormLabel>
      <div style={{ color: "var(--token-color-text-neutral-alternative)" }}>
        {lines.map((line) => (
          <P key={line} style={{ color: "inherit" }}>
            {line}
          </P>
        ))}
      </div>
    </div>
  );

  // Skillelinje mellom de read-only bankradene. Går kant til kant, så den
  // må bryte ut av de 16px paddingen i accordion-innholdet.
  const rowDivider = <Hr className="ip-row-divider" />;

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
            applyBankLookup(accountNumber, country);
          } else {
            setSelectedBankCountry(null);
            applyBankLookup(accountNumber, null);
          }
        }}
      />
      {selectedBankCountry && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Input
            label={selectedBankCountry.usesIban ? "Kontonummer (IBAN)" : "Kontonummer"}
            size="medium"
            stretch
            placeholder={
              accountNumberExamples[selectedBankCountry.code]
                ? `e.g. ${accountNumberExamples[selectedBankCountry.code]}`
                : undefined
            }
            value={accountNumber}
            status={
              prefixValidatedCountries.has(selectedBankCountry.code) &&
              accountNumber.trim().length >= 2 &&
              !accountNumber.trim().toUpperCase().startsWith(selectedBankCountry.code)
                ? `Kontonummer for ${selectedBankCountry.name} må starte med ${selectedBankCountry.code}.`
                : undefined
            }
            onChange={({ value }) => handleAccountNumberChange(value)}
          />
          {accountNumberLengths[selectedBankCountry.code] && (
            <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
              {Math.max(
                accountNumberLengths[selectedBankCountry.code] - accountNumber.replace(/\s/g, "").length,
                0
              )}{" "}
              av {accountNumberLengths[selectedBankCountry.code]} tegn gjenstår.
            </P>
          )}
        </div>
      )}
      {showSwiftBic &&
        (selectedBankCountry?.usesIban ? (
          readOnlyField("SWIFT/BIC-kode", [swiftBic])
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Input
              label="SWIFT/BIC"
              size="medium"
              stretch
              maxLength={swiftBicLength}
              placeholder="e.g. DK9UIZZKQDK"
              value={swiftBic}
              onChange={({ value }) => setSwiftBic(value)}
            />
            <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
              {Math.max(swiftBicLength - swiftBic.replace(/\s/g, "").length, 0)} av{" "}
              {swiftBicLength} tegn gjenstår.
            </P>
          </div>
        ))}
      {selectedBankCountry && (
        <>
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
            value={shownBankAddress}
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
        data={recipientCountries}
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
          if (typeof selectedItem === "number" && recipientCountries[selectedItem]) {
            const code = String(recipientCountries[selectedItem].selectedKey);
            setRecipientCountry(countryList.find((x) => x.code === code) ?? null);
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

  const optionalSuffix = (
    <span style={{ fontWeight: 400, marginLeft: "0.5rem", color: "var(--token-color-text-neutral-alternative)" }}>
      Valgfritt felt
    </span>
  );

  const bankFieldsCard = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-medium)", width: "100%" }}>
      <Autocomplete
        label="Bankens land"
        size="medium"
        data={bankCountries}
        placeholder="Velg land"
        stretch
        showSubmitButton
        icon={selectedBankCountry ? <CountryFlag iso={selectedBankCountry.iso} size="small" /> : undefined}
        value={selectedBankCountry?.code ?? undefined}
        onChange={({ selectedItem }) => {
          if (typeof selectedItem === "number" && bankCountries[selectedItem]) {
            const code = String(bankCountries[selectedItem].selectedKey);
            const country = bankCountryList.find((x) => x.code === code) ?? null;
            setSelectedBankCountry(country);
            setRecipientCountry(country);
            applyBankLookup(accountNumber, country);
          } else {
            setSelectedBankCountry(null);
            applyBankLookup(accountNumber, null);
          }
        }}
      />
      {selectedBankCountry && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Input
            label={selectedBankCountry.usesIban ? "Kontonummer (IBAN)" : "Kontonummer"}
            size="medium"
            stretch
            placeholder={
              accountNumberExamples[selectedBankCountry.code]
                ? `e.g. ${accountNumberExamples[selectedBankCountry.code]}`
                : undefined
            }
            value={accountNumber}
            status={
              prefixValidatedCountries.has(selectedBankCountry.code) &&
              accountNumber.trim().length >= 2 &&
              !accountNumber.trim().toUpperCase().startsWith(selectedBankCountry.code)
                ? `Kontonummer for ${selectedBankCountry.name} må starte med ${selectedBankCountry.code}.`
                : undefined
            }
            onChange={({ value }) => handleAccountNumberChange(value)}
          />
          {accountNumberLengths[selectedBankCountry.code] && (
            <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
              {Math.max(
                accountNumberLengths[selectedBankCountry.code] - accountNumber.replace(/\s/g, "").length,
                0
              )}{" "}
              av {accountNumberLengths[selectedBankCountry.code]} tegn gjenstår.
            </P>
          )}
        </div>
      )}
      {showSwiftBic &&
        (selectedBankCountry?.usesIban ? (
          <>
            {rowDivider}
            {readOnlyField("SWIFT/BIC-kode", [swiftBic])}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Input
              label="SWIFT/BIC-KODE"
              size="medium"
              stretch
              maxLength={swiftBicLength}
              placeholder="e.g. DK9UIZZKQDK"
              value={swiftBic}
              onChange={({ value }) => setSwiftBic(value)}
            />
            <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
              {Math.max(swiftBicLength - swiftBic.replace(/\s/g, "").length, 0)} av{" "}
              {swiftBicLength} tegn gjenstår.
            </P>
          </div>
        ))}
      {shownBankAddress && (
        <>
          {rowDivider}
          {readOnlyField("Bankens adresse", shownBankAddress.split("\n"))}
        </>
      )}
    </div>
  );

  const recipientFieldsCard = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-medium)", width: "100%" }}>
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
        data={recipientCountries}
        placeholder="Velg land"
        stretch
        showSubmitButton
        icon={recipientCountry ? <CountryFlag iso={recipientCountry.iso} size="small" /> : undefined}
        value={recipientCountry?.code ?? undefined}
        onChange={({ selectedItem }) => {
          if (typeof selectedItem === "number" && recipientCountries[selectedItem]) {
            const code = String(recipientCountries[selectedItem].selectedKey);
            setRecipientCountry(countryList.find((x) => x.code === code) ?? null);
          } else {
            setRecipientCountry(null);
          }
        }}
      />
      <Input
        label={<>Adresselinje 1{optionalSuffix}</>}
        size="medium"
        stretch
        placeholder="F.eks. Storgata 10"
        value={addressLine1}
        onChange={({ value }) => setAddressLine1(value)}
      />
      <Input
        label={<>Adresselinje 2{optionalSuffix}</>}
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

  // «Rediger mottaker»: bankinfo hentes fra mottakeren og er read-only,
  // mottakerens adresse gjenbruker de redigerbare feltene fra «Ny mottaker».
  const editRecipientContent = selectedRecipient && (
    <div className="ip-recipient-cards" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <style>{recipientCardStyles}</style>
      <List.Container>
        <List.Item.Accordion icon={bank_medium} title="Mottakers bank" open>
          <List.Item.Accordion.Content>
            <List.Cell.Start innerSpace>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                {readOnlyField("Kontonummer (IBAN)", [selectedRecipient.iban])}
                {rowDivider}
                {readOnlyField("SWIFT/BIC-kode", [selectedRecipient.swift])}
                {rowDivider}
                {readOnlyField("Bankens adresse", selectedRecipient.bankAddress)}
              </div>
            </List.Cell.Start>
          </List.Item.Accordion.Content>
        </List.Item.Accordion>
      </List.Container>
      <List.Container>
        <List.Item.Accordion icon={location_medium} title="Mottakers adresse" open>
          <List.Item.Accordion.Content>
            <List.Cell.Start innerSpace>{recipientFieldsCard}</List.Cell.Start>
          </List.Item.Accordion.Content>
        </List.Item.Accordion>
      </List.Container>
      {saveButton}
    </div>
  );

  const recipientModalContent =
    recipientLayout === "current" ? (
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
      <div className="ip-recipient-cards" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        <style>{recipientCardStyles}</style>
        <List.Container>
          <List.Item.Accordion icon={bank_medium} title="Mottakers bank" open>
            <List.Item.Accordion.Content>
              <List.Cell.Start innerSpace>{bankFieldsCard}</List.Cell.Start>
            </List.Item.Accordion.Content>
          </List.Item.Accordion>
        </List.Container>
        <List.Container>
          <List.Item.Accordion icon={location_medium} title="Mottakers adresse" open>
            <List.Item.Accordion.Content>
              <List.Cell.Start innerSpace>{recipientFieldsCard}</List.Cell.Start>
            </List.Item.Accordion.Content>
          </List.Item.Accordion>
        </List.Container>
        {saveButton}
      </div>
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
                  <Button
                    variant="tertiary"
                    text={selectedRecipient.name}
                    icon={chevron_right}
                    iconPosition="right"
                    onClick={openEditRecipient}
                  />
                </div>
              )}
              {/* Monteres først når den skal åpnes: Eufemias Modal åpner ikke
                  på en false→true-overgang med mindre props-identiteten også
                  endres, men åpner korrekt når den monteres med open={true}. */}
              {editOpen && (
                <Dialog
                  title="Rediger mottaker"
                  open
                  omitTriggerButton
                  onClose={() => setEditOpen(false)}
                >
                  {editRecipientContent}
                </Dialog>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-start" }}>
                <Button
                  variant="tertiary"
                  text="Valgfrie tilleggstjenester"
                  icon={extraServicesOpen ? chevron_up : chevron_down}
                  iconPosition="right"
                  aria-expanded={extraServicesOpen}
                  aria-controls="valgfrie-tilleggstjenester"
                  onClick={() => setExtraServicesOpen(!extraServicesOpen)}
                />
                {extraServicesOpen && (
                <div
                  id="valgfrie-tilleggstjenester"
                  style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}
                >
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
                        status={agreedRateError}
                        onChange={({ value }) => setAgreedRate(value)}
                      />
                    </div>
                    <div style={{ flex: "1 0 0", minWidth: 0 }}>
                      <Input
                        label="Din referanse hos DNB"
                        size="medium"
                        stretch
                        placeholder="Initialer"
                        value={reference}
                        status={referenceError}
                        onChange={({ value }) => setReference(value)}
                      />
                    </div>
                  </div>
                </div>
                )}
              </div>
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
      <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 100 }}>
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
            bottom: "92px",
            right: "32px",
            maxHeight: "calc(100vh - 124px)",
            overflowY: "auto",
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
              <P size="basis" style={{ margin: 0 }}>New/edit recipient</P>
              <div className="narrow-dropdown">
                <style>{`
                  .narrow-dropdown .dnb-dropdown { --dropdown-width: 10rem; }
                `}</style>
                <Dropdown
                  label="New/edit recipient"
                  labelSrOnly
                  size="small"
                  value={recipientLayout}
                  data={[
                    { selectedKey: "accordion", content: "Accordion" },
                    { selectedKey: "tabs", content: "Tabs" },
                    { selectedKey: "current", content: "Current" },
                  ]}
                  onChange={({ data }) =>
                    setRecipientLayout(
                      data?.selectedKey === "current" || data?.selectedKey === "tabs"
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

