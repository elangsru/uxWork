// Data, typer og formatering for Betalingsoversikt.
//
// Alt her er syntetisk demodata. Skilt ut fra page.tsx slik at siden inneholder
// tilstand og komposisjon, ikke datasett.

/** Én locale for hele siden. Samme verdi som Eufemias egen `LOCALE` i
 *  `@dnb/eufemia/shared/defaults`, så tall og datoer følger komponentene.
 *  (Filen brukte tidligere «no-NO» for beløp og «nb-NO» for datoer — samme
 *  output, men to sannheter.) */
export const LOCALE = "nb-NO";

export const accountDetails = {
  felleskonto: { name: "Felleskonto", number: "1503.24.78612", balance: 42500 },
  lonnskonto: { name: "Lønnskonto", number: "6082.19.47531", balance: 789 },
} as const;

export type AccountKey = keyof typeof accountDetails;

export const accountKeys = Object.keys(accountDetails) as AccountKey[];

export function fmtNok(value: number): string {
  return (
    value.toLocaleString(LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " NOK"
  );
}

function fmtKr(value: number): string {
  return value.toLocaleString(LOCALE) + " kr";
}

/** Kontonummeret vises med punktum i gruppeoverskriftene og med mellomrom i
 *  nedtrekket. Én kilde, to visninger. */
function spacedNumber(number: string): string {
  return number.replace(/\./g, " ");
}

/** Sentinel for «Alle kontoer» i belastningskonto-nedtrekket. Ikke en AccountKey,
 *  så den kan ikke forveksles med en faktisk konto. */
export const ALL_ACCOUNTS = "alle";

/** Utledet av accountDetails, slik at saldo og kontonummer har én kilde.
 *  `selectedKey` gjør at onChange kan lese valget direkte i stedet for å
 *  strengmatche på content[0]. */
export const accountOptions = [
  { selectedKey: ALL_ACCOUNTS, content: ["Alle kontoer"] },
  ...accountKeys.map((key) => ({
    selectedKey: key,
    content: [accountDetails[key].name, spacedNumber(accountDetails[key].number)],
    suffixValue: fmtKr(accountDetails[key].balance),
  })),
];

// Syntetiske fødselsnummer etter Skatteetatens konvensjon for testdata: 80 er
// lagt til månedssifrene (07 → 87), slik at numrene ikke kan kollidere med et
// virkelig fødselsnummer. Startsettet er statiske literaler — ikke Math.random(),
// som ville gitt ulik verdi på server og klient og dermed hydration mismatch.
// Innehaveren selv står uten nummer — «Espen Langsrud (deg)» har ingen rad her,
// og labelen faller tilbake til rent navn når eieren mangler oppslag.
export const invoiceOwnerSsn: Record<string, string> = {
  "Kari Nordmann": "248788 03918",
};

// Pool for «Hent flere». Navnene er åpenbare plassholdere (Norges juridiske
// standardnavn), og hver eier får én faktura fra en tilfeldig utsteder.
export const MORE_OWNER_NAMES = [
  "Marte Kirkerud",
  "Peder Ås",
  "Ingrid Berg",
  "Lars Holm",
  "Sofie Lund",
  "Jonas Vik",
];

const MORE_RECIPIENTS = [
  "Fjordkraft AS",
  "If Skadeforsikring",
  "Telia Norge AS",
  "Storebrand ASA",
  "Gjensidige Forsikring",
  "Elvia AS",
];

// Kalles først etter hydrering — aldri på modulnivå eller under den første
// renderen. Math.random() der ville gitt ulik verdi på server og klient og
// dermed hydration mismatch.
export function randomSyntheticSsn(): string {
  const dag = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  const maaned = String(81 + Math.floor(Math.random() * 12)); // 81–92 = måned + 80
  const aar = String(55 + Math.floor(Math.random() * 45));
  const rest = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `${dag}${maaned}${aar} ${rest}`;
}

// toISOString() ville gitt UTC-datoen. Mellom midnatt og 02:00 norsk tid ligger
// den ett døgn bak datoen som vises i overline og i DatePickeren — velger man da
// datoen man ser, filtrerer datofilteret bort raden. Strengen bygges derfor av de
// lokale feltene, så dateValue og den viste datoen alltid er samme døgn.
export function isoLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function relativeDate(daysFromToday: number): {
  date: string;
  dateValue: string;
} {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return {
    dateValue: isoLocalDate(d),
    date: d.toLocaleDateString(LOCALE, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export interface Transaction {
  id: string;
  date: string;
  dateValue: string;
  recipient: string;
  amountNok: number;
  /** Settes bare når beløpet ikke kan utledes av amountNok — altså når
      betalingen er i en annen valuta. Ellers formateres amountNok med fmtNok,
      så tallet og teksten ikke kan drive fra hverandre. */
  amountDisplay?: string;
  accountKey: AccountKey;
  type: "overforing" | "betaling" | "avtalegiro" | "efaktura";
  unconfirmed?: boolean;
  badge?: "AvtaleGiro" | "eFaktura";
  icon?: "transfer" | "loan";
  /** Avgjør avatarens fallback. Eufemia: person → bokstavversjon, selskap → ikon.
      Bokstaven utledes av Avatar selv fra `recipient` — ikke lagre den her. */
  avatarKind?: "person" | "company";
  flagIso?: string;
  nokEquivalent?: string;
  /** Personen fakturaen er adressert til. Brukes til gruppering på
      «Ubekreftede eFakturaer»-tabben, og går på tvers av konto. */
  invoiceOwner?: string;
}

export const transactions: Transaction[] = [
  { id: "kim-olsen", ...relativeDate(6), recipient: "Kim Olsen", amountNok: 500, accountKey: "felleskonto", type: "betaling", avatarKind: "person" },
  { id: "intro-aksel", ...relativeDate(9), recipient: "Intro Aksel", amountNok: 300, accountKey: "felleskonto", type: "overforing", icon: "transfer" },
  { id: "happybytes", ...relativeDate(9), recipient: "Happybytes", amountNok: 299, accountKey: "lonnskonto", type: "avtalegiro", avatarKind: "company", badge: "AvtaleGiro" },
  { id: "sector-alarm", ...relativeDate(12), recipient: "Sector Alarm AS", amountNok: 312, accountKey: "felleskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: "Espen Langsrud (deg)" },
  { id: "asker-kommune", ...relativeDate(15), recipient: "Asker Kommune", amountNok: 1545, accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: "Espen Langsrud (deg)" },
  { id: "fremtind", ...relativeDate(16), recipient: "Fremtind Forsikring AS", amountNok: 1129, accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: "Kari Nordmann" },
  { id: "boliglaanet", ...relativeDate(18), recipient: "Boliglånet", amountNok: 12345, accountKey: "felleskonto", type: "overforing", icon: "loan" },
  { id: "jose-martinez", ...relativeDate(24), recipient: "José Martinez", amountNok: 5234.98, amountDisplay: "500,00 EUR", accountKey: "felleskonto", type: "betaling", avatarKind: "person", flagIso: "ES", nokEquivalent: "ca 5234,98 NOK" },
  { id: "tibber", ...relativeDate(29), recipient: "Tibber AS", amountNok: 2445, accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura" },
];

/** Demovarsler, slått på med «Show warnings» i verktøypanelet. Lå tidligere som
 *  en nøstet ternær inne i to ulike renderere, med samme tekst duplisert. */
export const DEMO_WARNINGS: Record<string, string> = {
  "intro-aksel": "Betaling stoppet, det var ikke nok penger på konto.",
  happybytes:
    "Betalingen ble stoppet fordi beløpet overstiger den månedlige beløpsgrensen for AvtaleGiro.",
};

/** Lager én faktura per navn. Feltene utledes av personens plass i poolen, så
 *  samme person alltid får samme utsteder, konto og forfallsdato — uansett om
 *  hen kommer inn via «Hent flere» eller ved å bli valgt i nedtrekket. */
export function makePoolInvoice(owner: string): Transaction {
  const nr = MORE_OWNER_NAMES.indexOf(owner);
  const belop = 200 + Math.floor(Math.random() * 4000);
  return {
    id: `lastet-${nr}`,
    ...relativeDate(17 + nr),
    recipient: MORE_RECIPIENTS[nr % MORE_RECIPIENTS.length],
    amountNok: belop,
    accountKey: nr % 2 === 0 ? "lonnskonto" : "felleskonto",
    type: "efaktura",
    avatarKind: "company",
    badge: "eFaktura",
    unconfirmed: true,
    invoiceOwner: owner,
  };
}
