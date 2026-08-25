"use client";

import { useState, useEffect } from "react";
import SubmitIndicator from "@dnb/eufemia/extensions/forms/Form/SubmitIndicator/SubmitIndicator";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Autocomplete, DatePicker, Switch, ToggleButton, Grid, Radio, List, Avatar, Badge, Icon, CountryFlag, FormStatus, Tabs, TermDefinition, Skeleton } from "@dnb/eufemia/components";
import { H1, Lead, P, Span } from "@dnb/eufemia/elements";
import { transfer, transfer_medium, pay_from, chevron_down, chevron_up, loan, loan_medium, trash, edit, filter, close, globe, office_buildings, refresh } from "@dnb/eufemia/icons";

const accounts = [
  { content: ["Alle kontoer"], value: "alle" },
  { content: ["Felleskonto", "1503 24 78612"], suffixValue: "42 500 kr" },
  { content: ["Lønnskonto", "6082 19 47531"], suffixValue: "789 kr" },
];

const accountDetails = {
  felleskonto: { name: "Felleskonto", number: "1503.24.78612", balance: 42500 },
  lonnskonto: { name: "Lønnskonto", number: "6082.19.47531", balance: 789 },
} as const;
type AccountKey = keyof typeof accountDetails;

// Syntetiske fødselsnummer etter Skatteetatens konvensjon for testdata: 80 er
// lagt til månedssifrene (07 → 87), slik at numrene ikke kan kollidere med et
// virkelig fødselsnummer. Startsettet er statiske literaler — ikke Math.random(),
// som ville gitt ulik verdi på server og klient og dermed hydration mismatch.
// Innehaveren selv står uten nummer — «Espen Langsrud (deg)» har ingen rad her,
// og labelen faller tilbake til rent navn når eieren mangler oppslag.
const invoiceOwnerSsn: Record<string, string> = {
  "Kari Nordmann": "248788 03918",
};

// Pool for «Hent flere». Navnene er åpenbare plassholdere (Norges juridiske
// standardnavn), og hver eier får én faktura fra en tilfeldig utsteder.
const MORE_OWNER_NAMES = [
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

// Kalles først etter mount — aldri på modulnivå eller under den første
// renderen. Math.random() der ville gitt ulik verdi på server og klient og
// dermed hydration mismatch; etter mount finnes ingen serverrender å avvike fra.
function randomSyntheticSsn(): string {
  const dag = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  const maaned = String(81 + Math.floor(Math.random() * 12)); // 81–92 = måned + 80
  const aar = String(55 + Math.floor(Math.random() * 45));
  const rest = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `${dag}${maaned}${aar} ${rest}`;
}

// Rammen rundt en gruppe. Delt av begge grupperingene og av skeleton-varianten,
// så en endring av kant eller radius ikke må gjøres på fire steder.
const groupOutlineStyle: React.CSSProperties = {
  outline: "1px solid var(--token-color-stroke-neutral-alternative)",
  borderRadius: "var(--token-radius-md)",
  overflow: "hidden",
};

// Delt av begge tom-tilstandene på eFaktura-tabben: ingen ubekreftede i det hele
// tatt, og ingen som matcher filteret.
const efakturaEmptyBoxStyle: React.CSSProperties = {
  background: "var(--token-color-background-neutral-subtle)",
  border: "1px solid var(--token-color-stroke-neutral-alternative)",
  borderRadius: "var(--token-radius-md)",
  padding: "32px",
  textAlign: "center",
};

interface Transaction {
  id: string;
  date: string;
  dateValue: string;
  recipient: string;
  amountNok: number;
  amountDisplay: string;
  accountKey: AccountKey;
  type: "overforing" | "betaling" | "avtalegiro" | "efaktura";
  unconfirmed?: boolean;
  badge?: "AvtaleGiro" | "eFaktura";
  icon?: "transfer" | "loan";
  /** Avgjør avatarens fallback. Eufemia: person → bokstavversjon, selskap → ikon.
      Bokstaven utledes av Avatar selv fra `recipient` — ikke lagre den her. */
  avatarKind?: "person" | "company";
  flagIso?: string;
  foreignAmount?: string;
  nokEquivalent?: string;
  /** Personen fakturaen er adressert til. Brukes til gruppering på
      «Ubekreftede eFakturaer»-tabben, og går på tvers av konto. */
  invoiceOwner?: string;
}

// Hvordan én kontogruppe skal rendres. «Til forfall» og «Ubekreftede eFakturaer»
// deler samme renderer, men viser ulike deler av den: eFaktura-tabben har ingen
// sum-rad, siden ubekreftede beløp ikke trekkes fra saldo.
type GroupOptions = {
  keyPrefix?: string;
  showBalance: boolean;
  showSum: boolean;
  rowBalance: boolean;
  warnings: boolean;
};

function relativeDate(daysFromToday: number): { date: string; dateValue: string } {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const dateValue = d.toISOString().slice(0, 10);
  const date = d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  return { date, dateValue };
}

const transactions: Transaction[] = [
  { id: "kim-olsen", ...relativeDate(6), recipient: "Kim Olsen", amountNok: 500, amountDisplay: "500,00 NOK", accountKey: "felleskonto", type: "betaling", avatarKind: "person" },
  { id: "intro-aksel", ...relativeDate(9), recipient: "Intro Aksel", amountNok: 300, amountDisplay: "300,00 NOK", accountKey: "felleskonto", type: "overforing", icon: "transfer" },
  { id: "happybytes", ...relativeDate(9), recipient: "Happybytes", amountNok: 299, amountDisplay: "299,00 NOK", accountKey: "lonnskonto", type: "avtalegiro", avatarKind: "company", badge: "AvtaleGiro" },
  { id: "sector-alarm", ...relativeDate(12), recipient: "Sector Alarm AS", amountNok: 312, amountDisplay: "312,00 NOK", accountKey: "felleskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: "Espen Langsrud (deg)" },
  { id: "asker-kommune", ...relativeDate(15), recipient: "Asker Kommune", amountNok: 1545, amountDisplay: "1 545,00 NOK", accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: "Espen Langsrud (deg)" },
  { id: "fremtind", ...relativeDate(16), recipient: "Fremtind Forsikring AS", amountNok: 1129, amountDisplay: "1 129,00 NOK", accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura", unconfirmed: true, invoiceOwner: "Kari Nordmann" },
  { id: "boliglaanet", ...relativeDate(18), recipient: "Boliglånet", amountNok: 12345, amountDisplay: "12 345,00 NOK", accountKey: "felleskonto", type: "overforing", icon: "loan" },
  { id: "jose-martinez", ...relativeDate(24), recipient: "José Martinez", amountNok: 5234.98, amountDisplay: "500,00 EUR", accountKey: "felleskonto", type: "betaling", avatarKind: "person", flagIso: "ES", foreignAmount: "500,00 EUR", nokEquivalent: "ca 5234,98 NOK" },
  { id: "tibber", ...relativeDate(29), recipient: "Tibber AS", amountNok: 2445, amountDisplay: "2 445,00 NOK", accountKey: "lonnskonto", type: "efaktura", avatarKind: "company", badge: "eFaktura" },
];

function fmtNok(value: number): string {
  return value.toLocaleString("no-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " NOK";
}

function TransactionRow({ tx, overline, balanceAfter, warning, isConfirmed, onConfirm }: { tx: Transaction; overline: string; balanceAfter?: number; warning?: string; isConfirmed?: boolean; onConfirm?: () => void }) {
  const [approving, setApproving] = useState(false);
  const negativeBalance = balanceAfter !== undefined && balanceAfter < 0;
  const balanceClass = balanceAfter !== undefined ? (negativeBalance ? "row-balance-negative" : "row-balance-positive") : "";
  const itemStyle = { "--item-rounded-corner": "0" } as React.CSSProperties;
  const effectivelyUnconfirmed = tx.unconfirmed && !isConfirmed;
  const unconfirmedStyle = effectivelyUnconfirmed
    ? { ...itemStyle, backgroundImage: "repeating-linear-gradient(-45deg, var(--token-color-stroke-neutral-subtle) 1px 2px, transparent 0 6px)" }
    : itemStyle;

  // Eufemia: person får bokstavversjonen, selskap får ikonversjonen. Bokstaven
  // sendes IKKE inn ferdig utregnet — Avatar tar charAt(0).toUpperCase() av
  // children selv, og legger hele strengen i en .dnb-sr-only. Sender vi bare «K»
  // blir skjermlesertekst «K» i stedet for «Kim Olsen».
  // aria-hidden fordi radens tittel alt viser mottakernavnet: avataren er
  // dekorativ her, og duplisert opplesing ville vært støy. hasLabel forteller
  // Eufemia at merkingen er håndtert utenfor komponenten — kilden sjekker
  // `if (!avatarGroupContext && !hasLabel)`, så aria-hidden alene demper ikke
  // «Avatar group required». Docs peker på nettopp aria-hidden som gyldig grunn
  // til å sette hasLabel i stedet for å pakke hver rad i en Avatar.Group.
  const avatarNode = tx.avatarKind === "company" ? (
    <Avatar size="small" variant="primary" icon={office_buildings} hasLabel aria-hidden />
  ) : tx.avatarKind === "person" ? (
    <Avatar size="small" variant="primary" hasLabel aria-hidden>{tx.recipient}</Avatar>
  ) : null;

  let startNode: React.ReactNode;
  if (tx.flagIso && avatarNode) {
    startNode = (
      <Badge content={<CountryFlag iso={tx.flagIso} size="xx-small" />} vertical="bottom" horizontal="right" variant="content">
        {avatarNode}
      </Badge>
    );
  } else if (avatarNode) {
    startNode = avatarNode;
  } else if (tx.icon) {
    startNode = <Icon icon={tx.icon === "transfer" ? transfer_medium : loan_medium} />;
  }

  const endNode = tx.nokEquivalent ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <Span size="x-small" weight="medium">{tx.nokEquivalent}</Span>
      <span>{tx.amountDisplay}</span>
    </div>
  ) : tx.amountDisplay;

  return (
    <List.Item.Action
      className={balanceClass}
      chevronPosition="right"
      style={unconfirmedStyle}
    >
      <List.Cell.Start>{startNode}</List.Cell.Start>
      <List.Cell.Title>
        <List.Cell.Title.Overline>{overline}</List.Cell.Title.Overline>
        {tx.recipient}
        {tx.badge && (
          <List.Cell.Title.Subline>
            <Badge status="neutral" subtle content={tx.badge} />
          </List.Cell.Title.Subline>
        )}
      </List.Cell.Title>
      <List.Cell.End>{endNode}</List.Cell.End>
      {effectivelyUnconfirmed && (
        <List.Cell.Footer>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <Button variant="tertiary" text="Rediger" icon={edit} iconPosition="left" />
            <Button
                variant="secondary"
                disabled={approving}
                onClick={() => {
                  setApproving(true);
                  setTimeout(() => {
                    setApproving(false);
                    onConfirm?.();
                  }, 5000);
                }}
              >
                Godkjenn
                <SubmitIndicator state={approving ? "pending" : "complete"} />
              </Button>
          </div>
        </List.Cell.Footer>
      )}
      {warning && (
        <List.Cell.Footer className="warning-footer">
          <FormStatus state="warning" text={warning} stretch />
        </List.Cell.Footer>
      )}
    </List.Item.Action>
  );
}

export default function PaymentsOverview() {
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);
  const inOneYear = new Date(today);
  inOneYear.setFullYear(today.getFullYear() + 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const monthName = today.toLocaleDateString("nb-NO", { month: "long" });
  const currentMonthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [showSaldo, setShowSaldo] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showUnconfirmed, setShowUnconfirmed] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [accountOpen, setAccountOpen] = useState(false);
  const [startDate, setStartDate] = useState(fmt(today));
  const [endDate, setEndDate] = useState(fmt(in30Days));
  const [groupBy, setGroupBy] = useState("konto");
  const [efakturaGroupBy, setEfakturaGroupBy] = useState("fakturaeier");
  const [efakturaOwnerFilter, setEfakturaOwnerFilter] = useState<string | null>(null);
  const [efakturaOwnerOpen, setEfakturaOwnerOpen] = useState(false);
  const [efakturaAccountFilter, setEfakturaAccountFilter] = useState<AccountKey | null>(null);
  const [efakturaAccountOpen, setEfakturaAccountOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [selectedAccountKey, setSelectedAccountKey] = useState<AccountKey | null>(null);
  const [mounted, setMounted] = useState(false);
  // Hele poolen får sitt syntetiske fødselsnummer én gang etter mount, ikke ved
  // innlasting. Da viser nedtrekket og gruppeoverskriften samme identitet for en
  // person som ennå ikke er lastet inn.
  const [poolSsn, setPoolSsn] = useState<Record<string, string>>({});
  useEffect(() => {
    setMounted(true);
    setPoolSsn(Object.fromEntries(MORE_OWNER_NAMES.map(n => [n, randomSyntheticSsn()])));
  }, []);

  // Innlastede eiere legges til i stedet for å mutere basislisten, så startdataen
  // blir stående som én kilde og tilleggene er lette å nullstille.
  const [extraTransactions, setExtraTransactions] = useState<Transaction[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const allTransactions = [...transactions, ...extraTransactions];

  const ownerSsnMap = { ...invoiceOwnerSsn, ...poolSsn };
  function ownerLabel(owner: string): string {
    const ssn = ownerSsnMap[owner];
    return ssn ? `${owner} (${ssn})` : owner;
  }

  const usedOwners = new Set(
    allTransactions.map(t => t.invoiceOwner).filter((o): o is string => Boolean(o))
  );
  const remainingOwnerNames = MORE_OWNER_NAMES.filter(n => !usedOwners.has(n));

  // Lager én faktura per navn. Feltene utledes av personens plass i poolen, så
  // samme person alltid får samme utsteder, konto og forfallsdato — uansett om
  // hen kommer inn via «Hent flere» eller ved å bli valgt i nedtrekket.
  function loadOwners(names: string[]) {
    const nye = names
      .filter(owner => !usedOwners.has(owner))
      .map<Transaction>(owner => {
        const nr = MORE_OWNER_NAMES.indexOf(owner);
        const belop = 200 + Math.floor(Math.random() * 4000);
        return {
          id: `lastet-${nr}`,
          ...relativeDate(17 + nr),
          recipient: MORE_RECIPIENTS[nr % MORE_RECIPIENTS.length],
          amountNok: belop,
          amountDisplay: fmtNok(belop),
          accountKey: nr % 2 === 0 ? "lonnskonto" : "felleskonto",
          type: "efaktura",
          avatarKind: "company",
          badge: "eFaktura",
          unconfirmed: true,
          invoiceOwner: owner,
        };
      });
    if (nye.length === 0) return;
    // Dedupliseres på id inne i oppdateringen, ikke bare mot usedOwners over.
    // «Hent flere» venter 2 sekunder før den kaller hit, og i mellomtiden kan
    // samme person ha blitt hentet inn via nedtrekket — da ville den ytre
    // sjekken vært utdatert og gitt to rader med samme id.
    setExtraTransactions(prev => {
      const finnes = new Set(prev.map(t => t.id));
      const ufiltrert = nye.filter(t => !finnes.has(t.id));
      return ufiltrert.length === 0 ? prev : [...prev, ...ufiltrert];
    });
  }

  // 2 sekunders skeleton før fakturaene kommer inn. Docs: animasjonen starter
  // først etter 5 sekunder, så her vises den statiske plassholderen.
  const SKELETON_COUNT = 3;
  function loadMoreOwners() {
    if (loadingMore) return;
    const picked = remainingOwnerNames.slice(0, SKELETON_COUNT);
    if (picked.length === 0) return;
    setLoadingMore(true);
    setTimeout(() => {
      loadOwners(picked);
      setLoadingMore(false);
    }, 2000);
  }

  // Velges en person som ennå ikke er lastet, hentes hen inn først — deretter
  // filtreres visningen til den personen, slik at gruppen faktisk vises.
  function selectEfakturaOwner(owner: string | null) {
    if (owner !== null && !usedOwners.has(owner)) {
      loadOwners([owner]);
    }
    setEfakturaOwnerFilter(owner);
  }

  const visibleTransactions = allTransactions.filter(t =>
    (selectedAccountKey === null || t.accountKey === selectedAccountKey) &&
    (paymentTypes.length === 0 || paymentTypes.includes(t.type)) &&
    t.dateValue >= startDate &&
    t.dateValue <= endDate &&
    (showUnconfirmed || !t.unconfirmed || confirmedIds.has(t.id))
  );

  // Ubekreftede eFakturaer har sin egen tab og er derfor uavhengige av «Til
  // forfall»-filterboksen og «Show unconfirmed eInvoices»-switchen.
  const unconfirmedEfakturas = allTransactions.filter(
    t => t.unconfirmed && !confirmedIds.has(t.id) && t.type === "efaktura"
  );
  // Telleren i tab-tittelen viser alt som venter, uavhengig av eierfilteret —
  // filteret er en visning, ikke en endring i hvor mange som trenger handling.
  const unconfirmedEfakturaCount = unconfirmedEfakturas.length;
  const efakturaLabel = unconfirmedEfakturaCount > 0 && showUnconfirmed
    ? `eFaktura (${unconfirmedEfakturaCount} ny)`
    : "eFaktura";

  // Alternativene utledes av den UFILTRERTE listen, ellers ville nedtrekket
  // krympe til det ene valget så snart man filtrerte. I tillegg listes personer
  // som ennå ikke er lastet inn — de ser like ut som de øvrige, og et valg der
  // henter inn fakturaen først og filtrerer deretter til personen.
  const efakturaOwnerOptions = [
    ...[...new Set(unconfirmedEfakturas.map(t => t.invoiceOwner ?? "Uten eier"))]
      .map(owner => ({ selectedKey: owner, content: ownerLabel(owner) })),
    ...remainingOwnerNames.map(owner => ({
      selectedKey: owner,
      content: ownerLabel(owner),
    })),
  ];

  const efakturaAccountOptions = (Object.keys(accountDetails) as AccountKey[])
    .filter(k => unconfirmedEfakturas.some(t => t.accountKey === k))
    .map(k => ({ selectedKey: k, content: [accountDetails[k].name, accountDetails[k].number] }));

  const visibleEfakturas = unconfirmedEfakturas.filter(t =>
    (efakturaOwnerFilter === null || (t.invoiceOwner ?? "Uten eier") === efakturaOwnerFilter) &&
    (efakturaAccountFilter === null || t.accountKey === efakturaAccountFilter)
  );

  function isGroupOpen(key: string) {
    return key in openGroups ? openGroups[key] : true;
  }

  function toggleGroup(key: string) {
    setOpenGroups(prev => ({ ...prev, [key]: !isGroupOpen(key) }));
  }

  const kontoKeys = (Object.keys(accountDetails) as AccountKey[]).filter(
    k => visibleTransactions.some(t => t.accountKey === k)
  );
  const dateKeys = [...new Set(visibleTransactions.map(t => t.dateValue))].sort();
  const currentGroupKeys = groupBy === "konto" ? kontoKeys : dateKeys;
  const allOpen = currentGroupKeys.every(k => isGroupOpen(k));

  // Egen nøkkel-namespace for eFaktura-tabben, ellers deler de to tabbene
  // åpne/lukket-tilstand for samme konto.
  // Egne nøkkel-namespace per gruppering, ellers deler tabbene (og de to
  // grupperingene) åpne/lukket-tilstand for samme navn.
  const EFAKTURA_PREFIX = "ef:";
  const EFAKTURA_EIER_PREFIX = "ef-eier:";
  // Gruppene følger den filtrerte listen, ellers ville «Åpne alle» operert på
  // nøkler for grupper som ikke er på skjermen.
  const efakturaOwners = [...new Set(visibleEfakturas.map(t => t.invoiceOwner ?? "Uten eier"))];
  const efakturaGroupKeys = efakturaGroupBy === "konto"
    ? (Object.keys(accountDetails) as AccountKey[])
        .filter(k => visibleEfakturas.some(t => t.accountKey === k))
        .map(k => `${EFAKTURA_PREFIX}${k}`)
    : efakturaOwners.map(o => `${EFAKTURA_EIER_PREFIX}${o}`);
  const efakturaAllOpen = efakturaGroupKeys.every(k => isGroupOpen(k));

  const runningBalanceMap = (() => {
    const map: Record<string, number> = {};
    (Object.keys(accountDetails) as AccountKey[]).forEach(accountKey => {
      const acct = accountDetails[accountKey];
      let running = acct.balance;
      visibleTransactions.filter(t => t.accountKey === accountKey && (!t.unconfirmed || confirmedIds.has(t.id))).forEach(tx => {
        running -= tx.amountNok;
        map[tx.id] = running;
      });
    });
    return map;
  })();

  // Slår sammen med forrige tilstand i stedet for å erstatte hele mappet, slik
  // at «Åpne alle» i én tab ikke nullstiller den andre tabben.
  function toggleAllFor(keys: string[]) {
    const newState = !keys.every(k => isGroupOpen(k));
    setOpenGroups(prev => {
      const updates: Record<string, boolean> = { ...prev };
      keys.forEach(k => { updates[k] = newState; });
      return updates;
    });
  }

  function renderKontoGroups(source: Transaction[], opts: GroupOptions) {
    const { keyPrefix = "", showBalance, showSum, rowBalance, warnings } = opts;
    const keys = (Object.keys(accountDetails) as AccountKey[]).filter(
      k => source.some(t => t.accountKey === k)
    );

    return keys.map(accountKey => {
      const acct = accountDetails[accountKey];
      const groupKey = `${keyPrefix}${accountKey}`;
      const txs = source.filter(t => t.accountKey === accountKey);
      const confirmedTxs = txs.filter(t => !t.unconfirmed || confirmedIds.has(t.id));
      const totalNok = confirmedTxs.reduce((s, t) => s + t.amountNok, 0);
      const fremtidigSaldo = acct.balance - totalNok;
      const unconfirmedCount = txs.filter(t => t.unconfirmed && !confirmedIds.has(t.id)).length;
      const sumLabel = `Sum ${confirmedTxs.length} transaksjon${confirmedTxs.length !== 1 ? "er" : ""}${unconfirmedCount > 0 ? ` (${unconfirmedCount} ubekreftet)` : ""}`;
      const open = isGroupOpen(groupKey);

      const lastPaymentDate = txs.reduce((max, t) => t.dateValue > max.dateValue ? t : max, txs[0]).date;

      return (
        <div key={groupKey} style={groupOutlineStyle}>
          <List.Container>
            <List.Item.Accordion
              open={open}
              chevronPosition="right"
              style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderTopLeftRadius: "var(--token-radius-md)", borderTopRightRadius: "var(--token-radius-md)", ...(!showSum ? { borderBottomLeftRadius: "var(--token-radius-md)", borderBottomRightRadius: "var(--token-radius-md)" } : {}) } as React.CSSProperties}
            >
              <List.Item.Accordion.Header onClick={() => toggleGroup(groupKey)}>
                <List.Cell.Title style={{ fontWeight: 500 }}>{acct.name} {acct.number}</List.Cell.Title>
                {showBalance && <List.Cell.End><span style={{ fontWeight: 400 }}>{fmtNok(acct.balance)}</span></List.Cell.End>}
              </List.Item.Accordion.Header>
              <List.Item.Accordion.Content>
                <List.Container>
                  {txs.map(tx => (
                    <TransactionRow key={tx.id} tx={tx} overline={tx.date} balanceAfter={rowBalance ? runningBalanceMap[tx.id] : undefined} warning={warnings && tx.id === "intro-aksel" ? "Betaling stoppet, det var ikke nok penger på konto." : warnings && tx.id === "happybytes" ? "Betalingen ble stoppet fordi beløpet overstiger den månedlige beløpsgrensen for AvtaleGiro." : undefined} isConfirmed={confirmedIds.has(tx.id)} onConfirm={() => setConfirmedIds(prev => new Set([...prev, tx.id]))} />
                  ))}
                </List.Container>
              </List.Item.Accordion.Content>
            </List.Item.Accordion>
            {showSum && <List.Item.Basic style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderBottomLeftRadius: "var(--token-radius-md)", borderBottomRightRadius: "var(--token-radius-md)" } as React.CSSProperties}>
              <List.Cell.Title>
                {sumLabel}
                <List.Cell.Title.Subline fontSize="basis" style={fremtidigSaldo < 0 ? { color: "var(--token-color-text-destructive)" } : undefined}>Penger til overs {lastPaymentDate.replace(/\s+\d{4}$/, '')}</List.Cell.Title.Subline>
              </List.Cell.Title>
              <List.Cell.End>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontWeight: "400" }}>
                  <span className="dnb-t__size--basis">{fmtNok(totalNok)}</span>
                  <span className="dnb-t__size--basis" style={fremtidigSaldo < 0 ? { color: "var(--token-color-text-destructive)" } : undefined}>{fmtNok(fremtidigSaldo)}</span>
                </div>
              </List.Cell.End>
            </List.Item.Basic>}
          </List.Container>
        </div>
      );
    });
  }

  // Gruppering på fakturaeier for eFaktura-tabben. Speiler renderDatoGroups:
  // ingen sum-rad og ingen saldo i headeren, siden en eier ikke har en saldo.
  // Kontoen flyttes til overline på hver rad, ettersom den ikke lenger er
  // gruppenøkkel — datoen beholdes der også, begge er relevante for en faktura.
  function renderEierGroups(source: Transaction[]) {
    return efakturaOwners.map(owner => {
      const txs = source.filter(t => (t.invoiceOwner ?? "Uten eier") === owner);
      if (txs.length === 0) return null;
      const groupKey = `${EFAKTURA_EIER_PREFIX}${owner}`;
      const open = isGroupOpen(groupKey);

      return (
        <div key={groupKey} style={groupOutlineStyle}>
          <List.Container>
            <List.Item.Accordion
              open={open}
              chevronPosition="right"
              style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderRadius: "var(--token-radius-md)" } as React.CSSProperties}
            >
              <List.Item.Accordion.Header onClick={() => toggleGroup(groupKey)}>
                <List.Cell.Title style={{ fontWeight: 500 }}>{ownerLabel(owner)}</List.Cell.Title>
              </List.Item.Accordion.Header>
              <List.Item.Accordion.Content>
                <List.Container>
                  {txs.map(tx => {
                    const acct = accountDetails[tx.accountKey];
                    return (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        overline={`${tx.date} · ${acct.name} ${acct.number}`}
                        isConfirmed={confirmedIds.has(tx.id)}
                        onConfirm={() => setConfirmedIds(prev => new Set([...prev, tx.id]))}
                      />
                    );
                  })}
                </List.Container>
              </List.Item.Accordion.Content>
            </List.Item.Accordion>
          </List.Container>
        </div>
      );
    });
  }

  function renderDatoGroups() {
    return dateKeys.map(dateValue => {
      const txs = visibleTransactions.filter(t => t.dateValue === dateValue);
      const confirmedTxs = txs.filter(t => !t.unconfirmed || confirmedIds.has(t.id));
      const totalNok = confirmedTxs.reduce((s, t) => s + t.amountNok, 0);
      const dateLabel = txs[0].date;
      const open = isGroupOpen(dateValue);
      const unconfirmedCount = txs.filter(t => t.unconfirmed && !confirmedIds.has(t.id)).length;
      const sumLabel = `Sum ${confirmedTxs.length} transaksjon${confirmedTxs.length !== 1 ? "er" : ""}${unconfirmedCount > 0 ? ` (${unconfirmedCount} ubekreftet)` : ""}`;

      return (
        <div key={dateValue} style={groupOutlineStyle}>
          <List.Container>
            <List.Item.Accordion
              open={open}
              chevronPosition="right"
              style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderTopLeftRadius: "var(--token-radius-md)", borderTopRightRadius: "var(--token-radius-md)", ...(!showSaldo ? { borderBottomLeftRadius: "var(--token-radius-md)", borderBottomRightRadius: "var(--token-radius-md)" } : {}) } as React.CSSProperties}
            >
              <List.Item.Accordion.Header onClick={() => toggleGroup(dateValue)}>
                <List.Cell.Title style={{ fontWeight: 500 }}>{dateLabel}</List.Cell.Title>
              </List.Item.Accordion.Header>
              <List.Item.Accordion.Content>
                <List.Container>
                  {txs.map(tx => {
                    const acct = accountDetails[tx.accountKey];
                    const overline = `${acct.name} ${acct.number}`;
                    return <TransactionRow key={tx.id} tx={tx} overline={overline} balanceAfter={showSaldo ? runningBalanceMap[tx.id] : undefined} warning={showWarnings && tx.id === "intro-aksel" ? "Betaling stoppet, det var ikke nok penger på konto." : showWarnings && tx.id === "happybytes" ? "Betalingen ble stoppet fordi beløpet overstiger den månedlige beløpsgrensen for AvtaleGiro." : undefined} isConfirmed={confirmedIds.has(tx.id)} onConfirm={() => setConfirmedIds(prev => new Set([...prev, tx.id]))} />;
                  })}
                </List.Container>
              </List.Item.Accordion.Content>
            </List.Item.Accordion>
            {showSaldo && <List.Item.Basic style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderBottomLeftRadius: "var(--token-radius-md)", borderBottomRightRadius: "var(--token-radius-md)" } as React.CSSProperties}>
              <List.Cell.Title>{sumLabel}</List.Cell.Title>
              <List.Cell.End>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontWeight: "400" }}>
                  <span className="dnb-t__size--basis">{fmtNok(totalNok)}</span>
                </div>
              </List.Cell.End>
            </List.Item.Basic>}
          </List.Container>
        </div>
      );
    });
  }

  if (!mounted) {
    return (
      <Theme colorScheme="light">
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <P>Laster …</P>
        </main>
      </Theme>
    );
  }

  return (
    <Theme colorScheme={darkMode ? 'dark' : 'light'}>
    <>
    <style>{`
      /* Divider-linjen er ::before på .dnb-tabs__tabs. Eufemia strekker den
         to veier: --breakout gir left/width 100vw mot venstre, og
         :not(.dnb-section) gir box-shadow 100vw mot høyre. breakout={false}
         fjerner bare den første, så box-shadowen må nulles eksplisitt.
         Deretter strekkes linjen ut til kortets kanter — kortet har 96px
         horisontal padding, som linjen ellers ville stoppet innenfor. */
      .po-tabs .dnb-tabs__tabs::before {
        box-shadow: none;
        left: -96px;
        width: calc(100% + 192px);
      }
      /* Ikon inne i en Avatar skal ha samme farge som bokstavversjonen. Lists egen
         regel .dnb-list__item__action .dnb-icon setter color til var(--item-icon-color).
         Den er ment for ikoner som ligger direkte i raden (transfer/loan), men slår
         også inn på ikonet inne i avataren og gjør det grønt på mørkegrønn bunn.
         inherit henter avatarens egen tekstfarge, så den følger variant automatisk
         i stedet for å hardkodes. Selektoren er ett nivå mer spesifikk enn Lists,
         så den vinner uavhengig av rekkefølgen på stilark. */
      .dnb-list__item__action .dnb-avatar .dnb-icon {
        color: inherit;
      }
      /* 16px luft mellom flere ubekreftede fakturaer i samme accordion. Radene er
         ikke søsken — hver ligger i sin egen div.dnb-space — så :not(:last-child)
         på raden treffer ingenting. Løsningen settes derfor på UL.dnb-list__container,
         som allerede er en flex-kolonne med row-gap: 0. Wrapperne har
         space__top/bottom--zero, så gapet blir nøyaktig 16px uten margin i tillegg.
         Scopet til .po-efaktura fordi renderKontoGroups deles med «Til forfall».
         Bakgrunnen: UL er transparent, så accordionens grå (#f2f2f5) lyste gjennom
         i gapet. Radene har allerede egen hvit backgroundColor med skravuren malt
         over, så en hvit UL endrer bare gapet — ikke radenes utseende. */
      .po-efaktura .dnb-list__item__accordion__content .dnb-list__container {
        row-gap: 1rem;
        background-color: var(--token-color-background-neutral);
      }
      /* Avstanden label → knapper inne i ToggleButton.Group er margin-top: 16px
         fra Eufemias .dnb-space__top--small på shell-wrapperen. Ingen prop styrer
         den, så den settes ned til 8px her. Scopet til gruppen. */
      .dnb-toggle-button-group__fieldset .dnb-space__top--small {
        margin-top: 0.5rem;
      }
      .dnb-list__item__action .dnb-list__item__chevron .dnb-icon { transform: none !important; transition: none !important; }
      .dnb-list__item__accordion__header { padding-bottom: calc(var(--item-padding)) !important; }
      .dnb-list__item__accordion__header .dnb-list__item__chevron { place-self: center !important; }
      .dnb-list__item__accordion__header .dnb-list__item__title { align-self: center !important; justify-self: stretch !important; }
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__overline) .dnb-list__item__chevron,
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__overline) .dnb-list__item__icon { place-self: end !important; }
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__overline):not(:has(> .dnb-list__item__action__button .dnb-list__item__subline)) .dnb-list__item__start { align-self: end !important; justify-self: center !important; }
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__subline) .dnb-list__item__chevron,
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__subline) .dnb-list__item__icon { place-self: center !important; }
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__subline) .dnb-list__item__title { align-self: start !important; }
      @media screen and (min-width: 40.00625em) {
        .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__overline) .dnb-list__item__end { place-self: end !important; }
        .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__subline) .dnb-list__item__end { align-self: center !important; }
      }
      .dnb-list__item__accordion--open:has(.dnb-list__item__accordion__header:hover)::after,
      .dnb-list__item__accordion--open:has(.dnb-list__item__accordion__header:focus-visible)::after {
        bottom: auto;
        height: var(--item-height);
        border-radius: inherit;
      }
      .dnb-list__item__accordion:has(.dnb-list__item__action:hover) {
        z-index: 3;
      }
      .dnb-list__item__footer-separator:has(+ .dnb-list__item__footer.warning-footer) {
        display: none;
      }
      .row-balance-positive::before,
      .row-balance-negative::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 5px;
        z-index: 1;
        pointer-events: none;
      }
      .row-balance-positive::before {
        background-color: var(--token-color-stroke-positive);
      }
      .row-balance-negative::before {
        background-color: var(--token-color-stroke-error);
      }      .eufemia-theme__color-scheme--dark .dnb-date-picker__container {
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
            <H1 size="x-large" suppressHydrationWarning>
              Betalingsoversikt
            </H1>
            <Lead style={{ display: "none" }}>Lead</Lead>
            <P>Betalinger du har til forfall frem i tid. Oppdatert kl 11:35</P>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <Button variant="primary" text="Overfør" icon={transfer} iconPosition="left" />
            <Button variant="secondary" text="Betal" icon={pay_from} iconPosition="left" />
            <Button variant="secondary" text="Betal utland" icon={globe} iconPosition="left" />
          </div>
        </div>

        {/* Tabs: eksisterende oversikt under «Til forfall». Render-funksjonen
            får TabsSelectedKey (string | number) — ikke annotér den. */}
        <Tabs
          className="po-tabs"
          breakout={false}
          data={[
            { title: "Til forfall", key: "forfall" },
            {
              title: unconfirmedEfakturaCount > 0
                ? `Ubekreftede eFakturaer (${unconfirmedEfakturaCount})`
                : "Ubekreftede eFakturaer",
              key: "efakturaer",
            },
          ]}
        >
          {(key) =>
            key === "forfall" ? (
              <>
        {/* Filter + View mode */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Filter */}
        <div
          style={{
            background: "var(--token-color-background-neutral-subtle)",
            border: "1px solid var(--token-color-stroke-neutral-alternative)",
            borderRadius: "var(--token-radius-md)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Grid.Container columns={{ small: 1, medium: 1, large: 2 }} columnGap="medium" rowGap="medium">
            <Grid.Item span={{ small: "full", medium: "full", large: [1, 1] }}>
              <Autocomplete
                label="Belastningskonto"
                size="medium"
                data={accounts}
                placeholder="Alle"
                stretch
                showSubmitButton
                submitButtonTitle=""
                submitButtonIcon={<Icon icon={accountOpen ? chevron_up : chevron_down} />}
                onOpen={() => setAccountOpen(true)}
                onClose={() => setAccountOpen(false)}
                onChange={(event) => {
                  const data = typeof event.data === 'object' ? event.data : null;
                  const name = Array.isArray(data?.content) ? String(data.content[0]) : null;
                  if (name === "Felleskonto") setSelectedAccountKey("felleskonto");
                  else if (name === "Lønnskonto") setSelectedAccountKey("lonnskonto");
                  else setSelectedAccountKey(null);
                }}
              />
            </Grid.Item>
            <Grid.Item span={{ small: "full", medium: "full", large: [2, 2] }}>
              <DatePicker
                  label="Forfallsdato"
                  range
                  showInput
                  size="medium"
                  startDate={startDate}
                  endDate={endDate}
                  minDate={fmt(today)}
                  maxDate={fmt(inOneYear)}
                  stretch
                  submitButtonText="OK"
                  onChange={({ startDate: s, endDate: e }) => {
                    if (s) setStartDate(s);
                    if (e) setEndDate(e);
                  }}
                  shortcuts={[
                  {
                    title: "Neste 30 dg",
                    startDate: () => new Date(),
                    endDate: () => { const d = new Date(); d.setDate(d.getDate() + 30); return d; },
                    closeOnSelect: false,
                  },
                  {
                    title: currentMonthLabel,
                    startDate: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); },
                    endDate: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0); },
                    closeOnSelect: false,
                  },
                  {
                    title: "Neste 7 dg",
                    startDate: () => new Date(),
                    endDate: () => { const d = new Date(); d.setDate(d.getDate() + 7); return d; },
                    closeOnSelect: false,
                  },
                  {
                    title: "Denne uken",
                    startDate: () => {
                      const d = new Date();
                      const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
                      d.setDate(d.getDate() + diff);
                      return d;
                    },
                    endDate: () => {
                      const d = new Date();
                      const diff = d.getDay() === 0 ? 0 : 7 - d.getDay();
                      d.setDate(d.getDate() + diff);
                      return d;
                    },
                    closeOnSelect: false,
                  },
                  ]}
              />
            </Grid.Item>
          </Grid.Container>

          {/* Labelen ligger på ToggleButton.Group, ikke som en løs <P> ved siden av,
              slik at gruppen får et programmatisk navn (role="group" + aria-labelledby).
              Gruppen er da høyere enn switchen (label + knapper), så alignItems: center
              ville løftet switchen 16px over knappene. Løsning: flex-end justerer
              bunnene, og switch-wrapperen får knapperadens høyde (2.5rem) med sentrert
              innhold — da havner switchen på knappenes senterlinje.
              Merk: .dnb-toggle-button-group har flex-grow: 1 fra Eufemia, så på smale
              skjermer bryter switchen til egen linje under knappene. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
            <ToggleButton.Group
              label="Betalingstype"
              multiselect
              values={paymentTypes}
              onChange={({ values }) => setPaymentTypes(values as string[])}
            >
              <ToggleButton text="Overføring" value="overforing" />
              <ToggleButton text="Betaling" value="betaling" />
              <ToggleButton text="AvtaleGiro" value="avtalegiro" />
              <ToggleButton text={efakturaLabel} value="efaktura" />
            </ToggleButton.Group>
            {/* TermDefinition ligger som søsken til Switch, ikke inne i labelen.
                Grunnen: HTML-spesifikasjonen lar hover over en <label> slå inn på
                kontrollen den hører til, så en ordforklaring inne i labelen ville
                trigget switchens hover. Nå har de hver sin: switchen reagerer på
                sin egen grafikk, teksten på sin Anchor-hover. Switchen beholder
                labelen som skjult tekst så den fortsatt har tilgjengelig navn.
                gap: 0.5rem gjenskaper labelens tidligere padding-left på 8px. */}
            <div style={{ flexShrink: 0, minHeight: "2.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Switch
                label="Penger til overs"
                labelSrOnly
                checked={showSaldo}
                onChange={({ checked }) => setShowSaldo(checked)}
              />
              <TermDefinition content="Når aktiv vises forventet fremtidig saldo etter at betalinger til forfall er trukket fra.">
                Penger til overs
              </TermDefinition>
            </div>
          </div>
        </div>

        {/* View mode */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "-24px" }}>
          {/* labelDirection="horizontal" gir samme side-ved-side-oppsett som den
              tidligere flex-wrapperen, men med labelen koblet til gruppen. */}
          <Radio.Group
            label="Gruppering:"
            labelDirection="horizontal"
            layoutDirection="row"
            value={groupBy}
            onChange={({ value }) => setGroupBy(value)}
          >
            <Radio label="Konto" value="konto" />
            <Radio label="Dato" value="dato" />
          </Radio.Group>
          <Button
              variant="tertiary"
              text={allOpen ? "Lukk alle" : "Åpne alle"}
              icon={allOpen ? chevron_up : chevron_down}
              iconPosition="right"
              onClick={() => toggleAllFor(currentGroupKeys)}
            />
        </div>

        {groupBy === "konto"
          ? renderKontoGroups(visibleTransactions, {
              showBalance: showSaldo,
              showSum: showSaldo,
              rowBalance: showSaldo,
              warnings: showWarnings,
            })
          : renderDatoGroups()}

        </div>
              </>
            ) : (
              <div className="po-efaktura" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {unconfirmedEfakturaCount === 0 ? (
                  <div style={efakturaEmptyBoxStyle}>
                    <P>Du har ingen ubekreftede eFakturaer.</P>
                  </div>
                ) : (
                  <>
                    {/* Filter — speiler boksen på «Til forfall». Data bruker
                        selectedKey, så onChange kan lese valget direkte i stedet
                        for å strengmatche på content[0] slik kontofilteret der
                        gjør. Boksen rendres også når filteret gir null treff,
                        ellers ville brukeren ikke hatt noen vei tilbake. */}
                    <div
                      style={{
                        background: "var(--token-color-background-neutral-subtle)",
                        border: "1px solid var(--token-color-stroke-neutral-alternative)",
                        borderRadius: "var(--token-radius-md)",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <Grid.Container columns={{ small: 1, medium: 1, large: 2 }} columnGap="medium" rowGap="medium">
                        <Grid.Item span={{ small: "full", medium: "full", large: [1, 1] }}>
                          <Autocomplete
                            label="Fakturaeier"
                            size="medium"
                            data={efakturaOwnerOptions}
                            placeholder="Alle"
                            stretch
                            showSubmitButton
                            submitButtonTitle=""
                            submitButtonIcon={<Icon icon={efakturaOwnerOpen ? chevron_up : chevron_down} />}
                            showClearButton
                            onOpen={() => setEfakturaOwnerOpen(true)}
                            onClose={() => setEfakturaOwnerOpen(false)}
                            onChange={({ data }) => {
                              const key = data && typeof data === "object" && "selectedKey" in data
                                ? String(data.selectedKey)
                                : null;
                              selectEfakturaOwner(key);
                            }}
                            onClear={() => setEfakturaOwnerFilter(null)}
                          />
                        </Grid.Item>
                        <Grid.Item span={{ small: "full", medium: "full", large: [2, 2] }}>
                          <Autocomplete
                            label="Belastningskonto"
                            size="medium"
                            data={efakturaAccountOptions}
                            placeholder="Alle"
                            stretch
                            showSubmitButton
                            submitButtonTitle=""
                            submitButtonIcon={<Icon icon={efakturaAccountOpen ? chevron_up : chevron_down} />}
                            showClearButton
                            onOpen={() => setEfakturaAccountOpen(true)}
                            onClose={() => setEfakturaAccountOpen(false)}
                            onChange={({ data }) => {
                              const key = data && typeof data === "object" && "selectedKey" in data
                                ? (String(data.selectedKey) as AccountKey)
                                : null;
                              setEfakturaAccountFilter(key);
                            }}
                            onClear={() => setEfakturaAccountFilter(null)}
                          />
                        </Grid.Item>
                      </Grid.Container>
                    </div>

                    {visibleEfakturas.length === 0 ? (
                      <div style={efakturaEmptyBoxStyle}>
                        <P>Ingen ubekreftede eFakturaer matcher filteret.</P>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "-24px" }}>
                          <Radio.Group
                            label="Gruppering:"
                            labelDirection="horizontal"
                            layoutDirection="row"
                            value={efakturaGroupBy}
                            onChange={({ value }) => setEfakturaGroupBy(value)}
                          >
                            <Radio label="Fakturaeier" value="fakturaeier" />
                            <Radio label="Konto (foreslått)" value="konto" />
                          </Radio.Group>
                          <Button
                            variant="tertiary"
                            text={efakturaAllOpen ? "Lukk alle" : "Åpne alle"}
                            icon={efakturaAllOpen ? chevron_up : chevron_down}
                            iconPosition="right"
                            onClick={() => toggleAllFor(efakturaGroupKeys)}
                          />
                        </div>

                        {efakturaGroupBy === "konto"
                          ? renderKontoGroups(visibleEfakturas, {
                              keyPrefix: EFAKTURA_PREFIX,
                              showBalance: true,
                              showSum: false,
                              rowBalance: false,
                              warnings: false,
                            })
                          : renderEierGroups(visibleEfakturas)}

                        {/* Plassholdergrupper mens «Hent flere» henter. Én per
                            faktura som er på vei, med samme ramme og oppbygning
                            som de virkelige gruppene, så layouten ikke hopper når
                            innholdet kommer. Teksten er bare bredde-referanse for
                            Eufemias skeleton og leses ikke opp — Skeleton setter
                            aria-busy på wrapperen.
                            Merk: docs foreslår element={false} for å droppe
                            wrapperen, men i 11.0.2 kaster det «Element type is
                            invalid … got: boolean» fra SpaceElement. Standard
                            div-wrapper brukes derfor, og den blir flex-barn av
                            .po-efaktura — så avstanden mellom plassholderne settes
                            med marginBottom i stedet for containerens gap. */}
                        {loadingMore && (
                          <Skeleton show>
                            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                              <div key={`skeleton-${i}`} style={{ ...groupOutlineStyle, marginBottom: i < SKELETON_COUNT - 1 ? "32px" : 0 }}>
                                <List.Container>
                                  <List.Item.Basic
                                    skeleton
                                    style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0" } as React.CSSProperties}
                                  >
                                    <List.Cell.Title style={{ fontWeight: 500 }}>Henter fakturaeier</List.Cell.Title>
                                  </List.Item.Basic>
                                  <List.Item.Basic skeleton style={{ "--item-rounded-corner": "0" } as React.CSSProperties}>
                                    <List.Cell.Title>
                                      <List.Cell.Title.Overline>0. måned 0000</List.Cell.Title.Overline>
                                      Henter faktura
                                    </List.Cell.Title>
                                    <List.Cell.End>0 000,00 NOK</List.Cell.End>
                                  </List.Item.Basic>
                                </List.Container>
                              </div>
                            ))}
                          </Skeleton>
                        )}

                        {/* «Hent flere» er en handling, ikke navigasjon, så det er en
                            tertiær Button — den har lenkestilen i Eufemia, men
                            riktig semantikk (button, ikke anchor uten mål).
                            De 32px kommer fra gap på .po-efaktura-containeren:
                            fragmentet lager ingen flex-item, så denne diven er
                            søsken til gruppene og får containerens gap. */}
                        {remainingOwnerNames.length > 0 && (
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <Button
                              variant="tertiary"
                              text="Hent flere"
                              icon={refresh}
                              iconPosition="left"
                              disabled={loadingMore}
                              onClick={loadMoreOwners}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )
          }
        </Tabs>
      </div>
    </div>

    {/* Tools button */}
    <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 100 }}>
      <Button
        variant="secondary"
        icon={filter}
        aria-label="Tools menu"
        onClick={() => setToolsOpen(o => !o)}
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
        {/* Header + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <P size="basis" style={{ fontWeight: 500, margin: 0 }}>Configurations</P>
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

        {/* Show warnings row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
          <P size="basis" style={{ margin: 0 }}>Show warnings</P>
          <Switch label="Show warnings" labelSrOnly checked={showWarnings} onChange={({ checked }) => setShowWarnings(checked)} />
        </div>

        {/* Show unconfirmed eInvoices row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
          <P size="basis" style={{ margin: 0 }}>Show unconfirmed eInvoices</P>
          <Switch label="Show unconfirmed eInvoices" labelSrOnly checked={showUnconfirmed} onChange={({ checked }) => setShowUnconfirmed(checked)} />
        </div>

        {/* Dark mode row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
          <P size="basis" style={{ margin: 0 }}>Dark mode</P>
          <Switch label="Dark mode" labelSrOnly checked={darkMode} onChange={({ checked }) => setDarkMode(checked)} />
        </div>
      </div>
    )}
</>
    </Theme>
  );
}
