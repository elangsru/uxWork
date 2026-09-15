"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Autocomplete, Button, DatePicker, List, Skeleton, Switch, Tabs, TermDefinition, ToggleButton } from "@dnb/eufemia/components";
import { H1, P } from "@dnb/eufemia/elements";
import { globe, pay_from, refresh, transfer } from "@dnb/eufemia/icons";

import "./paymentsOverview.css";
import FilterBox from "./FilterBox";
import GroupCard from "./GroupCard";
import GroupingRow from "./GroupingRow";
import ToolsPanel from "./ToolsPanel";
import {
  ALL_ACCOUNTS,
  DEMO_WARNINGS,
  LOCALE,
  MORE_OWNER_NAMES,
  accountDetails,
  accountKeys,
  accountOptions,
  fmtNok,
  invoiceOwnerSsn,
  isoLocalDate,
  makePoolInvoice,
  randomSyntheticSsn,
  transactions,
  type AccountKey,
  type Transaction,
} from "./data";

// «Er komponenten hydrert?» uten setState i en effect — det siste gir
// kaskaderender og er en lintfeil (react-hooks/set-state-in-effect).
// useSyncExternalStore returnerer getServerSnapshot (false) på serveren og
// gjennom hydreringen, og getSnapshot (true) etterpå; React håndterer
// overgangen selv. Kilden endrer seg aldri, så subscribe er en no-op.
// De tre må ligge på modulnivå: nye funksjoner per render ville fått React til
// å abonnere på nytt hver gang.
const subscribeNever = () => () => {};
const getHydrated = () => true;
const getHydratedOnServer = () => false;

// Egne nøkkel-namespace per tab og gruppering, ellers ville de delt
// åpne/lukket-tilstand for samme kontonavn.
const EFAKTURA_PREFIX = "ef:";
const EFAKTURA_EIER_PREFIX = "ef-eier:";

const NO_OWNER = "Uten eier";

// 2 sekunders skeleton før fakturaene kommer inn, og like mange plassholdere som
// fakturaer på vei. Docs: skeleton-animasjonen starter først etter 5 sekunder, så
// her vises den statiske plassholderen.
const SKELETON_COUNT = 3;
const LOAD_DELAY_MS = 2000;

export default function PaymentsOverview() {
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);
  const inOneYear = new Date(today);
  inOneYear.setFullYear(today.getFullYear() + 1);
  const monthName = today.toLocaleDateString(LOCALE, { month: "long" });
  const currentMonthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [showSaldo, setShowSaldo] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showUnconfirmed, setShowUnconfirmed] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(isoLocalDate(today));
  const [endDate, setEndDate] = useState(isoLocalDate(in30Days));
  const [groupBy, setGroupBy] = useState("konto");
  const [efakturaGroupBy, setEfakturaGroupBy] = useState("fakturaeier");
  const [efakturaOwnerFilter, setEfakturaOwnerFilter] = useState<string | null>(null);
  const [efakturaAccountFilter, setEfakturaAccountFilter] = useState<AccountKey | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [selectedAccountKey, setSelectedAccountKey] = useState<AccountKey | null>(null);

  const mounted = useSyncExternalStore(subscribeNever, getHydrated, getHydratedOnServer);

  // Hele poolen får sitt syntetiske fødselsnummer én gang, ikke ved innlasting.
  // Da viser nedtrekket og gruppeoverskriften samme identitet for en person som
  // ennå ikke er lastet inn.
  // Verdien lages i state-initialisereren, ikke i en effect: den settes én gang og
  // står stabilt resten av komponentens liv. Serveren regner også ut et sett, men
  // det rendres aldri — første render viser «Laster …» — så Math.random() her kan
  // ikke gi hydration mismatch.
  const [poolSsn] = useState<Record<string, string>>(() =>
    Object.fromEntries(MORE_OWNER_NAMES.map((n) => [n, randomSyntheticSsn()])),
  );

  // Innlastede eiere legges til i stedet for å mutere basislisten, så startdataen
  // blir stående som én kilde og tilleggene er lette å nullstille.
  const [extraTransactions, setExtraTransactions] = useState<Transaction[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Samme grunn som i TransactionRow: forlater man siden midt i hentingen, skal
  // ikke timeren kalle setState etterpå.
  const loadMoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (loadMoreTimer.current !== null) clearTimeout(loadMoreTimer.current);
    },
    [],
  );

  // Sortert kronologisk, ikke i innsettingsrekkefølge: «Hent flere» legger
  // fakturaene bakerst, men de forfaller midt inne i basislisten. Både
  // radrekkefølgen og runningBalanceMap leser denne rekkefølgen, så uten
  // sorteringen fikk en godkjent slik faktura laveste saldo mens radene over den
  // viste en saldo som ikke hadde trukket den fra.
  const allTransactions = [...transactions, ...extraTransactions].sort((a, b) =>
    a.dateValue.localeCompare(b.dateValue),
  );

  /** En transaksjon som faktisk trekkes fra saldo: bekreftet, eller aldri
   *  ubekreftet til å begynne med. */
  const isSettled = (t: Transaction) => !t.unconfirmed || confirmedIds.has(t.id);

  const confirm = (id: string) => setConfirmedIds((prev) => new Set([...prev, id]));

  const ownerSsnMap = { ...invoiceOwnerSsn, ...poolSsn };
  const ownerLabel = (owner: string) => {
    const ssn = ownerSsnMap[owner];
    return ssn ? `${owner} (${ssn})` : owner;
  };

  const usedOwners = new Set(
    allTransactions.map((t) => t.invoiceOwner).filter((o): o is string => Boolean(o)),
  );
  const remainingOwnerNames = MORE_OWNER_NAMES.filter((n) => !usedOwners.has(n));

  function loadOwners(names: string[]) {
    const nye = names.filter((owner) => !usedOwners.has(owner)).map(makePoolInvoice);
    if (nye.length === 0) return;
    // Dedupliseres på id inne i oppdateringen, ikke bare mot usedOwners over.
    // «Hent flere» venter 2 sekunder før den kaller hit, og i mellomtiden kan
    // samme person ha blitt hentet inn via nedtrekket — da ville den ytre
    // sjekken vært utdatert og gitt to rader med samme id.
    setExtraTransactions((prev) => {
      const finnes = new Set(prev.map((t) => t.id));
      const ufiltrert = nye.filter((t) => !finnes.has(t.id));
      return ufiltrert.length === 0 ? prev : [...prev, ...ufiltrert];
    });
  }

  function loadMoreOwners() {
    if (loadingMore) return;
    const picked = remainingOwnerNames.slice(0, SKELETON_COUNT);
    if (picked.length === 0) return;
    setLoadingMore(true);
    loadMoreTimer.current = setTimeout(() => {
      loadMoreTimer.current = null;
      loadOwners(picked);
      setLoadingMore(false);
    }, LOAD_DELAY_MS);
  }

  // Velges en person som ennå ikke er lastet, hentes hen inn først — deretter
  // filtreres visningen til den personen, slik at gruppen faktisk vises.
  function selectEfakturaOwner(owner: string | null) {
    if (owner !== null && !usedOwners.has(owner)) loadOwners([owner]);
    setEfakturaOwnerFilter(owner);
  }

  const visibleTransactions = allTransactions.filter(
    (t) =>
      (selectedAccountKey === null || t.accountKey === selectedAccountKey) &&
      (paymentTypes.length === 0 || paymentTypes.includes(t.type)) &&
      t.dateValue >= startDate &&
      t.dateValue <= endDate &&
      (showUnconfirmed || isSettled(t)),
  );

  // Ubekreftede eFakturaer har sin egen tab og er derfor uavhengige av «Til
  // forfall»-filterboksen og «Show unconfirmed eInvoices»-switchen.
  const unconfirmedEfakturas = allTransactions.filter(
    (t) => t.unconfirmed && !confirmedIds.has(t.id) && t.type === "efaktura",
  );
  // Telleren i tab-tittelen viser alt som venter, uavhengig av eierfilteret —
  // filteret er en visning, ikke en endring i hvor mange som trenger handling.
  const unconfirmedEfakturaCount = unconfirmedEfakturas.length;
  const efakturaLabel =
    unconfirmedEfakturaCount > 0 && showUnconfirmed
      ? `eFaktura (${unconfirmedEfakturaCount} ny)`
      : "eFaktura";

  // Alternativene utledes av den UFILTRERTE listen, ellers ville nedtrekket
  // krympe til det ene valget så snart man filtrerte. I tillegg listes personer
  // som ennå ikke er lastet inn — de ser like ut som de øvrige, og et valg der
  // henter inn fakturaen først og filtrerer deretter til personen.
  // content som array gir navn på én linje og fødselsnummer på neste, samme
  // oppbygning som Belastningskonto bruker for kontonummeret. Eiere uten nummer
  // («Espen Langsrud (deg)») får bare navnet, altså én linje.
  const ownerOption = (owner: string) => {
    const ssn = ownerSsnMap[owner];
    return { selectedKey: owner, content: ssn ? [owner, ssn] : owner };
  };

  const efakturaOwnerOptions = [
    ...[...new Set(unconfirmedEfakturas.map((t) => t.invoiceOwner ?? NO_OWNER))].map(ownerOption),
    ...remainingOwnerNames.map(ownerOption),
  ];

  const efakturaAccountOptions = accountKeys
    .filter((k) => unconfirmedEfakturas.some((t) => t.accountKey === k))
    .map((k) => ({
      selectedKey: k,
      content: [accountDetails[k].name, accountDetails[k].number],
    }));

  const visibleEfakturas = unconfirmedEfakturas.filter(
    (t) =>
      (efakturaOwnerFilter === null || (t.invoiceOwner ?? NO_OWNER) === efakturaOwnerFilter) &&
      (efakturaAccountFilter === null || t.accountKey === efakturaAccountFilter),
  );

  const isGroupOpen = (key: string) => (key in openGroups ? openGroups[key] : true);
  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !isGroupOpen(key) }));

  // Slår sammen med forrige tilstand i stedet for å erstatte hele mappet, slik
  // at «Åpne alle» i én tab ikke nullstiller den andre tabben.
  function toggleAllFor(keys: string[]) {
    const newState = !keys.every((k) => isGroupOpen(k));
    setOpenGroups((prev) => {
      const updates: Record<string, boolean> = { ...prev };
      keys.forEach((k) => {
        updates[k] = newState;
      });
      return updates;
    });
  }

  const forfallKontoKeys = accountKeys.filter((k) =>
    visibleTransactions.some((t) => t.accountKey === k),
  );
  const dateKeys = [...new Set(visibleTransactions.map((t) => t.dateValue))].sort();
  const currentGroupKeys = groupBy === "konto" ? forfallKontoKeys : dateKeys;

  // Gruppene følger den filtrerte listen, ellers ville «Åpne alle» operert på
  // nøkler for grupper som ikke er på skjermen.
  const efakturaOwners = [...new Set(visibleEfakturas.map((t) => t.invoiceOwner ?? NO_OWNER))];
  const efakturaGroupKeys =
    efakturaGroupBy === "konto"
      ? accountKeys
          .filter((k) => visibleEfakturas.some((t) => t.accountKey === k))
          .map((k) => `${EFAKTURA_PREFIX}${k}`)
      : efakturaOwners.map((o) => `${EFAKTURA_EIER_PREFIX}${o}`);

  const runningBalanceMap = (() => {
    const map: Record<string, number> = {};
    accountKeys.forEach((accountKey) => {
      let running = accountDetails[accountKey].balance;
      visibleTransactions
        .filter((t) => t.accountKey === accountKey && isSettled(t))
        .forEach((tx) => {
          running -= tx.amountNok;
          map[tx.id] = running;
        });
    });
    return map;
  })();

  const sumLabel = (txs: Transaction[]) => {
    const settled = txs.filter(isSettled).length;
    const unconfirmed = txs.length - settled;
    return `Sum ${settled} transaksjon${settled !== 1 ? "er" : ""}${
      unconfirmed > 0 ? ` (${unconfirmed} ubekreftet)` : ""
    }`;
  };

  const accountOverline = (tx: Transaction) =>
    `${accountDetails[tx.accountKey].name} ${accountDetails[tx.accountKey].number}`;

  const rowBalance = showSaldo ? (tx: Transaction) => runningBalanceMap[tx.id] : undefined;
  const rowWarning = showWarnings ? (tx: Transaction) => DEMO_WARNINGS[tx.id] : undefined;

  // «Til forfall», gruppert på konto. Eneste gruppering med sum-rad: den viser
  // hva som er igjen på kontoen etter at betalingene er trukket fra.
  const forfallKontoGroups = forfallKontoKeys.map((accountKey) => {
    const acct = accountDetails[accountKey];
    const txs = visibleTransactions.filter((t) => t.accountKey === accountKey);
    const total = txs.filter(isSettled).reduce((s, t) => s + t.amountNok, 0);
    const remaining = acct.balance - total;
    const lastDate = txs.reduce((max, t) => (t.dateValue > max.dateValue ? t : max), txs[0]).date;

    return (
      <GroupCard
        key={accountKey}
        open={isGroupOpen(accountKey)}
        onToggle={() => toggleGroup(accountKey)}
        header={`${acct.name} ${acct.number}`}
        headerEnd={showSaldo ? fmtNok(acct.balance) : undefined}
        rows={txs}
        overlineFor={(tx) => tx.date}
        balanceFor={rowBalance}
        warningFor={rowWarning}
        sum={
          showSaldo
            ? {
                label: sumLabel(txs),
                subline: {
                  // Året strippes: gruppen dekker uker, ikke år.
                  text: `Penger til overs ${lastDate.replace(/\s+\d{4}$/, "")}`,
                  negative: remaining < 0,
                },
                amounts: [
                  { text: fmtNok(total) },
                  { text: fmtNok(remaining), negative: remaining < 0 },
                ],
              }
            : undefined
        }
        confirmedIds={confirmedIds}
        onConfirm={confirm}
      />
    );
  });

  // «Til forfall», gruppert på dato. Ingen saldo i headeren — en dato har ingen
  // saldo — og sum-raden viser bare summen.
  const forfallDatoGroups = dateKeys.map((dateValue) => {
    const txs = visibleTransactions.filter((t) => t.dateValue === dateValue);
    const total = txs.filter(isSettled).reduce((s, t) => s + t.amountNok, 0);

    return (
      <GroupCard
        key={dateValue}
        open={isGroupOpen(dateValue)}
        onToggle={() => toggleGroup(dateValue)}
        header={txs[0].date}
        rows={txs}
        overlineFor={accountOverline}
        balanceFor={rowBalance}
        warningFor={rowWarning}
        sum={showSaldo ? { label: sumLabel(txs), amounts: [{ text: fmtNok(total) }] } : undefined}
        confirmedIds={confirmedIds}
        onConfirm={confirm}
      />
    );
  });

  // eFaktura, gruppert på kontoforslag. Saldo vises, men ingen sum-rad:
  // ubekreftede beløp er ikke trukket fra ennå.
  const efakturaKontoGroups = accountKeys
    .filter((k) => visibleEfakturas.some((t) => t.accountKey === k))
    .map((accountKey) => {
      const acct = accountDetails[accountKey];
      const groupKey = `${EFAKTURA_PREFIX}${accountKey}`;

      return (
        <GroupCard
          key={groupKey}
          open={isGroupOpen(groupKey)}
          onToggle={() => toggleGroup(groupKey)}
          header={`${acct.name} ${acct.number}`}
          headerEnd={fmtNok(acct.balance)}
          rows={visibleEfakturas.filter((t) => t.accountKey === accountKey)}
          overlineFor={(tx) => tx.date}
          confirmedIds={confirmedIds}
          onConfirm={confirm}
        />
      );
    });

  // eFaktura, gruppert på fakturaeier. Kontoen flyttes til overline på hver rad,
  // ettersom den ikke lenger er gruppenøkkel — datoen beholdes der også, begge
  // er relevante for en faktura.
  const efakturaEierGroups = efakturaOwners.map((owner) => {
    const groupKey = `${EFAKTURA_EIER_PREFIX}${owner}`;

    return (
      <GroupCard
        key={groupKey}
        open={isGroupOpen(groupKey)}
        onToggle={() => toggleGroup(groupKey)}
        header={ownerLabel(owner)}
        rows={visibleEfakturas.filter((t) => (t.invoiceOwner ?? NO_OWNER) === owner)}
        overlineFor={(tx) => `${tx.date} · ${accountOverline(tx)}`}
        confirmedIds={confirmedIds}
        onConfirm={confirm}
      />
    );
  });

  if (!mounted) {
    return (
      <Theme colorScheme="light">
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <P>Laster …</P>
        </main>
      </Theme>
    );
  }

  const forfallPanel = (
    <div className="po-tabpanel">
      <FilterBox
        fields={[
          <Autocomplete
            key="konto"
            label="Belastningskonto"
            size="medium"
            data={accountOptions}
            placeholder="Alle"
            stretch
            showSubmitButton
            submitButtonTitle=""
            onChange={({ data }) => {
              const key =
                data && typeof data === "object" && "selectedKey" in data
                  ? String(data.selectedKey)
                  : null;
              setSelectedAccountKey(
                key === null || key === ALL_ACCOUNTS ? null : (key as AccountKey),
              );
            }}
          />,
          <DatePicker
            key="dato"
            label="Forfallsdato"
            range
            showInput
            size="medium"
            startDate={startDate}
            endDate={endDate}
            minDate={isoLocalDate(today)}
            maxDate={isoLocalDate(inOneYear)}
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
                endDate: () => {
                  const d = new Date();
                  d.setDate(d.getDate() + 30);
                  return d;
                },
                closeOnSelect: false,
              },
              {
                title: currentMonthLabel,
                startDate: () => {
                  const d = new Date();
                  return new Date(d.getFullYear(), d.getMonth(), 1);
                },
                endDate: () => {
                  const d = new Date();
                  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
                },
                closeOnSelect: false,
              },
              {
                title: "Neste 7 dg",
                startDate: () => new Date(),
                endDate: () => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  return d;
                },
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
          />,
        ]}
      >
        <div className="po-typefilter">
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
          <div className="po-saldoswitch">
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
      </FilterBox>

      <GroupingRow
        value={groupBy}
        onChange={setGroupBy}
        options={[
          { label: "Konto", value: "konto" },
          { label: "Dato", value: "dato" },
        ]}
        allOpen={currentGroupKeys.every((k) => isGroupOpen(k))}
        onToggleAll={() => toggleAllFor(currentGroupKeys)}
      />

      {groupBy === "konto" ? forfallKontoGroups : forfallDatoGroups}
    </div>
  );

  const efakturaPanel = (
    <div className="po-efaktura po-tabpanel">
      {unconfirmedEfakturaCount === 0 ? (
        <div className="po-empty">
          <P>Du har ingen ubekreftede eFakturaer.</P>
        </div>
      ) : (
        <>
          {/* Filteret rendres også når det gir null treff, ellers ville brukeren
              ikke hatt noen vei tilbake. */}
          <FilterBox
            fields={[
              <Autocomplete
                key="eier"
                label="Fakturaeier"
                size="medium"
                data={efakturaOwnerOptions}
                placeholder="Alle"
                stretch
                showSubmitButton
                submitButtonTitle=""
                showClearButton
                onChange={({ data }) => {
                  const key =
                    data && typeof data === "object" && "selectedKey" in data
                      ? String(data.selectedKey)
                      : null;
                  selectEfakturaOwner(key);
                }}
                onClear={() => setEfakturaOwnerFilter(null)}
              />,
              <Autocomplete
                key="konto"
                label="Belastningskonto"
                size="medium"
                data={efakturaAccountOptions}
                placeholder="Alle"
                stretch
                showSubmitButton
                submitButtonTitle=""
                showClearButton
                onChange={({ data }) => {
                  const key =
                    data && typeof data === "object" && "selectedKey" in data
                      ? (String(data.selectedKey) as AccountKey)
                      : null;
                  setEfakturaAccountFilter(key);
                }}
                onClear={() => setEfakturaAccountFilter(null)}
              />,
            ]}
          />

          {visibleEfakturas.length === 0 ? (
            <div className="po-empty">
              <P>Ingen ubekreftede eFakturaer matcher filteret.</P>
            </div>
          ) : (
            <>
              <GroupingRow
                value={efakturaGroupBy}
                onChange={setEfakturaGroupBy}
                options={[
                  { label: "Fakturaeier", value: "fakturaeier" },
                  { label: "Kontoforslag", value: "konto" },
                ]}
                allOpen={efakturaGroupKeys.every((k) => isGroupOpen(k))}
                onToggleAll={() => toggleAllFor(efakturaGroupKeys)}
              />

              {efakturaGroupBy === "konto" ? efakturaKontoGroups : efakturaEierGroups}

              {/* Plassholdergrupper mens «Hent flere» henter. Én per faktura som
                  er på vei, med samme ramme og oppbygning som de virkelige
                  gruppene, så layouten ikke hopper når innholdet kommer. Teksten
                  er bare bredde-referanse for Eufemias skeleton og leses ikke opp
                  — Skeleton setter aria-busy på wrapperen.
                  Merk: docs foreslår element={false} for å droppe wrapperen, men i
                  11.0.2 kaster det «Element type is invalid … got: boolean» fra
                  SpaceElement. Standard div-wrapper brukes derfor, og den blir
                  flex-barn av .po-efaktura — så avstanden mellom plassholderne
                  settes med marginBottom i stedet for containerens gap. */}
              {loadingMore && (
                <Skeleton show>
                  {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="po-group"
                      style={{
                        marginBottom: i < SKELETON_COUNT - 1 ? "var(--spacing-large)" : 0,
                      }}
                    >
                      <List.Container>
                        <List.Item.Basic skeleton className="po-group__skeleton-head">
                          <List.Cell.Title className="po-group__title">
                            Henter fakturaeier
                          </List.Cell.Title>
                        </List.Item.Basic>
                        <List.Item.Basic skeleton className="po-row">
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

              {/* De 32px kommer fra gap på .po-tabpanel: fragmentet lager ingen
                  flex-item, så denne diven er søsken til gruppene. */}
              {remainingOwnerNames.length > 0 && (
                <div className="po-loadmore">
                  <Button
                    variant="secondary"
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
  );

  return (
    <Theme colorScheme={darkMode ? "dark" : "light"}>
      <>
        <div className="po-page">
          <div className="po-card">
            <div className="po-hero">
              <div className="po-hero__head">
                <H1 size="x-large">Betalingsoversikt</H1>
                <P>Betalinger du har til forfall frem i tid. Oppdatert kl 11:35</P>
              </div>
              <div className="po-actions">
                <Button variant="primary" text="Overfør" icon={transfer} iconPosition="left" />
                <Button variant="secondary" text="Betal" icon={pay_from} iconPosition="left" />
                <Button variant="secondary" text="Betal utland" icon={globe} iconPosition="left" />
              </div>
            </div>

            {/* Render-funksjonen får TabsSelectedKey (string | number) — ikke
                annotér den. */}
            <Tabs
              className="po-tabs"
              breakout={false}
              data={[
                { title: "Til forfall", key: "forfall" },
                {
                  // «+» så lenge det finnes flere eiere å hente — telleren viser
                  // da «minst så mange», ikke et endelig antall. Når poolen er
                  // tømt stemmer tallet eksakt, og plusstegnet faller bort.
                  title:
                    unconfirmedEfakturaCount > 0
                      ? `Ubekreftede eFakturaer (${unconfirmedEfakturaCount}${
                          remainingOwnerNames.length > 0 ? "+" : ""
                        })`
                      : "Ubekreftede eFakturaer",
                  key: "efakturaer",
                },
              ]}
            >
              {(key) => (key === "forfall" ? forfallPanel : efakturaPanel)}
            </Tabs>
          </div>
        </div>

        <ToolsPanel
          open={toolsOpen}
          onOpenChange={setToolsOpen}
          toggles={[
            { label: "Show warnings", checked: showWarnings, onChange: setShowWarnings },
            {
              label: "Show unconfirmed eInvoices",
              checked: showUnconfirmed,
              onChange: setShowUnconfirmed,
            },
            { label: "Dark mode", checked: darkMode, onChange: setDarkMode },
          ]}
        />
      </>
    </Theme>
  );
}
