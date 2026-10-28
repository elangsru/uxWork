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

/** Beløp uten valutaenhet, brukt på transaksjonsradene der «kr» er underforstått. */
export function fmtAmount(value: number): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtNok(value: number): string {
  return "kr " + fmtAmount(value);
}

function fmtKr(value: number): string {
  return "kr " + value.toLocaleString(LOCALE);
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

/** Innehaveren av nettbanken. Står alltid øverst blant fakturaeierne. */
export const SELF_OWNER = "Espen Langsrud (deg)";

/** Innehaveren først, deretter de andre alfabetisk på fornavn. Navnene lagres
 *  som «Fornavn Etternavn», så en vanlig strengsammenligning sorterer på
 *  fornavn — med norsk locale, så Æ, Ø og Å havner etter Z. */
export function compareOwners(a: string, b: string): number {
  if (a === SELF_OWNER) return b === SELF_OWNER ? 0 : -1;
  if (b === SELF_OWNER) return 1;
  return a.localeCompare(b, LOCALE);
}

// «Show on behalf of eInvoices» i verktøypanelet legger til personer du mottar eFaktura
// på vegne av: Erika med sin faste faktura, pluss så mange tilfeldige personer.
// Navnene trekkes fra listene under, og hver får én faktura fra en tilfeldig
// utsteder.
export const ON_BEHALF_RANDOM_COUNT = 4;

const FIRST_NAMES = [
  "Anders", "Astrid", "Bjørn", "Eirik", "Hanne", "Ida", "Jonas", "Kristin",
  "Magnus", "Marte", "Nora", "Ola", "Sigrid", "Thomas", "Tone", "Åse",
];
const LAST_NAMES = [
  "Andersen", "Berg", "Dahl", "Eriksen", "Haugen", "Johansen", "Larsen",
  "Lie", "Moen", "Nilsen", "Olsen", "Pedersen", "Solberg", "Strand",
];

const MORE_RECIPIENTS = [
  "Fjordkraft AS",
  "If Skadeforsikring",
  "Telia Norge AS",
  "Storebrand ASA",
  "Gjensidige Forsikring",
  "Elvia AS",
];

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

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

/** Fakturaen en person i poolen får. Dagene regnes fra i dag først når
 *  fakturaen lages, ikke på modulnivå. */
type PoolInvoiceSpec = {
  id: string;
  recipient: string;
  amountNok: number;
  accountKey: AccountKey;
  daysFromToday: number;
};

/** Fødselsnummeret vises under navnet i Fakturaeier-nedtrekket og i
 *  gruppeoverskriften. `invoice` gir personen en fast faktura i stedet for en
 *  tilfeldig. */
export type PoolPerson = { name: string; ssn: string; invoice?: PoolInvoiceSpec };

const ERIKA: PoolPerson = {
  name: "Erika Mogård Langsrud",
  ssn: "010276 88990",
  invoice: {
    id: "sector-alarm",
    recipient: "Sector Alarm AS",
    amountNok: 312,
    accountKey: "felleskonto",
    daysFromToday: 12,
  },
};

/** Erika pluss `randomCount` unike, tilfeldige personer. Samme regel som
 *  randomSyntheticSsn: kalles bare etter hydrering. */
export function onBehalfPeople(randomCount: number): PoolPerson[] {
  const taken = new Set([SELF_OWNER, ERIKA.name]);
  const people: PoolPerson[] = [ERIKA];
  while (people.length < randomCount + 1) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (taken.has(name)) continue;
    taken.add(name);
    people.push({ name, ssn: randomSyntheticSsn() });
  }
  return people;
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
  badge?: string;
  icon?: "transfer" | "loan" | "savings" | "investment" | "funds";
  /** Avgjør avatarens fallback. Eufemia: person → bokstavversjon, selskap → ikon.
      Bokstaven utledes av Avatar selv fra `recipient` — ikke lagre den her. */
  avatarKind?: "person" | "company";
  flagIso?: string;
  /** Personen fakturaen er adressert til. Brukes til gruppering på
      «Ubekreftede eFakturaer»-tabben, og går på tvers av konto. */
  invoiceOwner?: string;
}

export const transactions: Transaction[] = [
  { id: "kim-olsen", ...relativeDate(6), recipient: "Kim Olsen", amountNok: 500, accountKey: "felleskonto", type: "betaling", avatarKind: "person" },
  { id: "intro-aksel", ...relativeDate(9), recipient: "Sparing bryllup", amountNok: 300, accountKey: "felleskonto", type: "overforing", icon: "savings" },
  { id: "happybytes", ...relativeDate(9), recipient: "Happybytes", amountNok: 299, accountKey: "lonnskonto", type: "avtalegiro", avatarKind: "company", badge: "AvtaleGiro" },
  { id: "asker-kommune", ...relativeDate(15), recipient: "Asker Kommune", amountNok: 1545, accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: SELF_OWNER },
  { id: "fremtind", ...relativeDate(16), recipient: "Fremtind Forsikring AS", amountNok: 1129, accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: SELF_OWNER },
  { id: "boliglaanet", ...relativeDate(18), recipient: "Boliglånet", amountNok: 12345, accountKey: "felleskonto", type: "overforing", icon: "loan" },
  { id: "ask", ...relativeDate(20), recipient: "ASK", amountNok: 1500, accountKey: "lonnskonto", type: "overforing", icon: "investment" },
  { id: "dnb-global-index", ...relativeDate(22), recipient: "DNB Global index", amountNok: 2000, accountKey: "lonnskonto", type: "overforing", icon: "funds" },
  { id: "jose-martinez", ...relativeDate(24), recipient: "José Martinez", amountNok: 5234.98, amountDisplay: "EUR 500,00", accountKey: "felleskonto", type: "betaling", avatarKind: "person", flagIso: "ES" },
  { id: "tibber", ...relativeDate(29), recipient: "Tibber AS", amountNok: 2445, accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura" },
];

/** Demovarsler, slått på med «Show warnings» i verktøypanelet. Lå tidligere som
 *  en nøstet ternær inne i to ulike renderere, med samme tekst duplisert. */
export const DEMO_WARNINGS: Record<string, string> = {
  "intro-aksel": "Betaling stoppet, det var ikke nok penger på konto.",
  happybytes:
    "Betalingen ble stoppet fordi beløpet overstiger den månedlige beløpsgrensen for AvtaleGiro.",
  tibber: "Betalingen ble stoppet. Månedlig maksgrense er passert. Juster grensen under innstillinger.",
};

/** Fakturaen til person nr i poolen. Uten fast faktura utledes feltene av
 *  plassen, så samme person alltid får samme utsteder, konto og forfallsdato —
 *  uansett om hen kommer inn via «Hent flere» eller ved å bli valgt i
 *  nedtrekket. */
export function makePoolInvoice(person: PoolPerson, nr: number): Transaction {
  const spec = person.invoice ?? {
    id: `lastet-${nr}`,
    recipient: MORE_RECIPIENTS[nr % MORE_RECIPIENTS.length],
    amountNok: 200 + Math.floor(Math.random() * 4000),
    accountKey: nr % 2 === 0 ? "lonnskonto" : "felleskonto",
    daysFromToday: 17 + nr,
  };
  return {
    id: spec.id,
    ...relativeDate(spec.daysFromToday),
    recipient: spec.recipient,
    amountNok: spec.amountNok,
    accountKey: spec.accountKey,
    type: "efaktura",
    avatarKind: "company",
    badge: `eFaktura på vegne av ${person.name}`,
    unconfirmed: true,
    invoiceOwner: person.name,
  };
}
