// Demodata for utlandsbetaling, delt av «Betale til utlandet»
// (/internationalPayment) og «Rediger betaling»-modalen i /paymentsOverview.
// Ligger utenfor page.tsx fordi en Next-side bare kan eksportere default.
import { Anchor, Avatar, Badge, CountryFlag } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";

export const fromAccountList = [
  { content: ["Lønnskonto", "7001 19 60764"], suffixValue: "NOK 7 804,46" },
  { content: ["Brukskonto", "0539 52 33566"], suffixValue: "NOK 0,00" },
  { content: ["Sparekonto", "1234 56 78901"], suffixValue: "NOK 152 300,00" },
  { content: ["Felleskonto", "1503 24 78612"], suffixValue: "NOK 42 500,00" },
];

export const fromAccounts = fromAccountList.map((a, i) => ({
  ...a,
  selectedKey: String(i),
}));

export type Recipient = {
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

export const recipients: Recipient[] = [
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
    // Argentina bruker ikke IBAN. Kontonummeret er et CBU-lignende BBAN på 30
    // siffer (matcher accountNumberLengths.AR), og banken identifiseres av
    // SWIFT/BIC framfor et landprefiks. Bankdataene er de samme som
    // bankByCountry.AR, slik at rediger- og «Ny mottaker»-flyten stemmer.
    name: "Mateo Fernández",
    iban: "2850 5909 4009 0418 1352 0199 8877 21",
    iso: "AR",
    currencies: ["USD", "EUR"],
    defaultCurrency: "USD",
    bankName: "Banco de la Nación Argentina",
    bankAddress: ["Bartolomé Mitre 326", "C1036AAF Buenos Aires", "Argentina"],
    swift: "NACNARBAXXX",
    address: ["Avenida Corrientes 1234", "C1043AAZ Buenos Aires", "Argentina"],
    addressLine1: "Avenida Corrientes 1234",
    postalCode: "C1043AAZ",
    city: "Buenos Aires",
  },
];

export const toAccounts = recipients.map((r) => ({
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

export type Currency = { code: string; name: string; iso: string };

export const currencyList: Currency[] = [
  { code: "EUR", name: "Euro", iso: "EU" },
  { code: "USD", name: "US-dollar", iso: "US" },
  { code: "GBP", name: "Britisk pund", iso: "GB" },
  { code: "SEK", name: "Svenske kroner", iso: "SE" },
  { code: "DKK", name: "Danske kroner", iso: "DK" },
  { code: "CHF", name: "Sveitsiske franc", iso: "CH" },
  { code: "JPY", name: "Japanske yen", iso: "JP" },
  { code: "NOK", name: "Norske kroner", iso: "NO" },
];

export const exchangeRates: Record<string, number> = {
  EUR: 10.84,
  USD: 9.85,
  GBP: 12.85,
  SEK: 0.95,
  DKK: 1.46,
  CHF: 11.50,
  JPY: 0.064,
  NOK: 1,
};

export function fmtAmount(value: number): string {
  return value.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const currencies = currencyList.map((c) => ({
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

export const recipientRowStyles = `
  .ip-recipient-row .dnb-list__item__footer-separator {
    display: none;
  }
  .ip-recipient-row .dnb-list__item__footer {
    margin-top: 0;
  }
`;

// Hjelpetekstene bak «?»-knappene på steg 1.
export const messageMaxLength = 140;

export const amountHelp = {
  content:
    "Du kan alternativt taste beløp i norske kroner. Velg NOK under. Overføringsvalutaen forblir den samme.",
};

export const messageHelp = {
  // To avsnitt, ikke én lang blokk: første handler om språk, andre om
  // lagre-svitsjen ved siden av feltet. HelpButtonInlineContent pakker
  // `content` i en <P>, og Eufemias P degraderer til <span> når den
  // nøstes i en annen P — da faller avsnittsluften bort og teksten
  // limes sammen. element="div" tvinger blokk, så bottom virker.
  content: (
    <>
      <P element="div" bottom="small">
        Meldingen bør skrives på engelsk, da dette er standardspråket for utenlandsbetalinger.
      </P>
      <P element="div">
        Lagre melding dersom du ønsker å gjenbruke på fremtidige betalinger til denne mottakeren.
      </P>
    </>
  ),
};

export const currencyHelp = {
  content: (
    <>
      Dersom du har behov for en annen valuta enn de som vises i listen kan du gå til{" "}
      <Anchor href="#" target="_blank" rel="noopener noreferrer" noLaunchIcon>
        gammel løsning
      </Anchor>
      .
    </>
  ),
};

export const fromAccountHelp = {
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
