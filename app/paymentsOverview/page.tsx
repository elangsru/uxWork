"use client";

import { useState, useRef } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Autocomplete, DatePicker, Switch, Checkbox, ToggleButton, Grid, Radio, List, Avatar, Badge, Icon, CountryFlag, FormStatus, Tooltip } from "@dnb/eufemia/components";
import { H1, Lead, P, Span } from "@dnb/eufemia/elements";
import { transfer, pay_from, chevron_down, chevron_up, loan, trash, edit, filter, close } from "@dnb/eufemia/icons";

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
  avatarLetter?: string;
  flagIso?: string;
  foreignAmount?: string;
  nokEquivalent?: string;
}

const transactions: Transaction[] = [
  { id: "kim-olsen", date: "14. mai 2026", dateValue: "2026-05-14", recipient: "Kim Olsen", amountNok: 500, amountDisplay: "500,00 NOK", accountKey: "felleskonto", type: "betaling", avatarLetter: "K" },
  { id: "intro-aksel", date: "17. mai 2026", dateValue: "2026-05-17", recipient: "Intro Aksel", amountNok: 300, amountDisplay: "300,00 NOK", accountKey: "felleskonto", type: "overforing", icon: "transfer" },
  { id: "happybytes", date: "17. mai 2026", dateValue: "2026-05-17", recipient: "Happybytes", amountNok: 299, amountDisplay: "299,00 NOK", accountKey: "lonnskonto", type: "avtalegiro", avatarLetter: "H", badge: "AvtaleGiro" },
  { id: "asker-kommune", date: "23. mai 2026", dateValue: "2026-05-23", recipient: "Asker Kommune", amountNok: 1545, amountDisplay: "1 545,00 NOK", accountKey: "lonnskonto", type: "efaktura", avatarLetter: "A", badge: "eFaktura", unconfirmed: true },
  { id: "boliglaanet", date: "26. mai 2026", dateValue: "2026-05-26", recipient: "Boliglånet", amountNok: 12345, amountDisplay: "12 345,00 NOK", accountKey: "felleskonto", type: "overforing", icon: "loan" },
  { id: "jose-martinez", date: "1. juni 2026", dateValue: "2026-06-01", recipient: "José Martinez", amountNok: 5234.98, amountDisplay: "500,00 EUR", accountKey: "felleskonto", type: "betaling", avatarLetter: "J", flagIso: "ES", foreignAmount: "500,00 EUR", nokEquivalent: "ca 5234,98 NOK" },
  { id: "tibber", date: "6. juni 2026", dateValue: "2026-06-06", recipient: "Tibber AS", amountNok: 2445, amountDisplay: "2 445,00 NOK", accountKey: "lonnskonto", type: "efaktura", avatarLetter: "T", badge: "eFaktura" },
];

function fmtNok(value: number): string {
  return value.toLocaleString("no-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " NOK";
}

function TransactionRow({ tx, overline, balanceAfter, warning }: { tx: Transaction; overline: string; balanceAfter?: number; warning?: string }) {
  const negativeBalance = balanceAfter !== undefined && balanceAfter < 0;
  const balanceClass = balanceAfter !== undefined ? (negativeBalance ? "row-balance-negative" : "row-balance-positive") : "";
  const itemStyle = { "--item-rounded-corner": "0" } as React.CSSProperties;
  const unconfirmedStyle = tx.unconfirmed
    ? { ...itemStyle, backgroundImage: "repeating-linear-gradient(-45deg, var(--token-color-stroke-neutral-subtle) 1px 2px, transparent 0 6px)" }
    : itemStyle;

  let startNode: React.ReactNode;
  if (tx.flagIso && tx.avatarLetter) {
    startNode = (
      <Badge content={<CountryFlag iso={tx.flagIso} size="x-small" />} vertical="bottom" horizontal="right" variant="content">
        <Avatar.Group label={tx.recipient}>
          <Avatar size="small" backgroundColor="ocean-green" color="white">{tx.avatarLetter}</Avatar>
        </Avatar.Group>
      </Badge>
    );
  } else if (tx.avatarLetter) {
    startNode = <Avatar size="small" hasLabel backgroundColor="ocean-green" color="white">{tx.avatarLetter}</Avatar>;
  } else if (tx.icon) {
    startNode = <Icon icon={tx.icon === "transfer" ? transfer : loan} size="medium" />;
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
            <Badge variant="information" subtle content={tx.badge} />
          </List.Cell.Title.Subline>
        )}
      </List.Cell.Title>
      <List.Cell.End>{endNode}</List.Cell.End>
      {tx.unconfirmed && (
        <List.Cell.Footer>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <Button variant="tertiary" text="Rediger" icon={edit} iconPosition="left" />
            <Button variant="secondary" text="Godkjenn" />
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

  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [showSaldo, setShowSaldo] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [startDate, setStartDate] = useState(fmt(today));
  const [endDate, setEndDate] = useState(fmt(in30Days));
  const [groupBy, setGroupBy] = useState("konto");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const visSaldoRef = useRef<HTMLDivElement>(null);
  const huskValgRef = useRef<HTMLDivElement>(null);
  const [selectedAccountKey, setSelectedAccountKey] = useState<AccountKey | null>(null);

  const visibleTransactions = transactions.filter(t =>
    (selectedAccountKey === null || t.accountKey === selectedAccountKey) &&
    (paymentTypes.length === 0 || paymentTypes.includes(t.type)) &&
    t.dateValue >= startDate &&
    t.dateValue <= endDate
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

  const runningBalanceMap = (() => {
    const map: Record<string, number> = {};
    (Object.keys(accountDetails) as AccountKey[]).forEach(accountKey => {
      const acct = accountDetails[accountKey];
      let running = acct.balance;
      visibleTransactions.filter(t => t.accountKey === accountKey).forEach(tx => {
        running -= tx.amountNok;
        map[tx.id] = running;
      });
    });
    return map;
  })();

  function toggleAll() {
    const newState = !allOpen;
    const updates: Record<string, boolean> = {};
    currentGroupKeys.forEach(k => { updates[k] = newState; });
    setOpenGroups(updates);
  }

  function renderKontoGroups() {
    return kontoKeys.map(accountKey => {
      const acct = accountDetails[accountKey];
      const txs = visibleTransactions.filter(t => t.accountKey === accountKey);
      const totalNok = txs.reduce((s, t) => s + t.amountNok, 0);
      const fremtidigSaldo = acct.balance - totalNok;
      const unconfirmedCount = txs.filter(t => t.unconfirmed).length;
      const sumLabel = `Sum ${txs.length} transaksjon${txs.length !== 1 ? "er" : ""}${unconfirmedCount > 0 ? ` (${unconfirmedCount} ubekreftet)` : ""}`;
      const open = isGroupOpen(accountKey);

      const lastPaymentDate = txs.reduce((max, t) => t.dateValue > max.dateValue ? t : max, txs[0]).date;

      return (
        <div key={accountKey} style={{ outline: "1px solid var(--token-color-stroke-neutral-alternative)", borderRadius: "var(--token-radius-md)", overflow: "hidden" }}>
          <List.Container>
            <List.Item.Accordion
              open={open}
              chevronPosition="right"
              style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderTopLeftRadius: "var(--token-radius-md)", borderTopRightRadius: "var(--token-radius-md)", ...(!showSaldo ? { borderBottomLeftRadius: "var(--token-radius-md)", borderBottomRightRadius: "var(--token-radius-md)" } : {}) } as React.CSSProperties}
            >
              <List.Item.Accordion.Header onClick={() => toggleGroup(accountKey)}>
                <List.Cell.Title fontWeight="medium">{acct.name} {acct.number}{showSaldo ? ` (${acct.balance.toLocaleString("no-NO", { minimumFractionDigits: 2 })} kr)` : ""}</List.Cell.Title>
              </List.Item.Accordion.Header>
              <List.Item.Accordion.Content>
                <List.Container>
                  {txs.map(tx => (
                    <TransactionRow key={tx.id} tx={tx} overline={tx.date} balanceAfter={showSaldo ? runningBalanceMap[tx.id] : undefined} warning={showWarnings && tx.id === "intro-aksel" ? "Betaling stoppet, det var ikke nok penger på konto." : undefined} />
                  ))}
                </List.Container>
              </List.Item.Accordion.Content>
            </List.Item.Accordion>
            {showSaldo && <List.Item.Basic style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderBottomLeftRadius: "var(--token-radius-md)", borderBottomRightRadius: "var(--token-radius-md)" } as React.CSSProperties}>
              <List.Cell.Title>
                {sumLabel}
                <List.Cell.Title.Subline fontSize="basis" style={fremtidigSaldo < 0 ? { color: "var(--token-color-text-error)" } : undefined}>Fremtidig saldo {lastPaymentDate}</List.Cell.Title.Subline>
              </List.Cell.Title>
              <List.Cell.End>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontWeight: "400" }}>
                  <span className="dnb-t__size--basis">{fmtNok(totalNok)}</span>
                  <span className="dnb-t__size--basis" style={fremtidigSaldo < 0 ? { color: "var(--token-color-text-error)" } : undefined}>{fmtNok(fremtidigSaldo)}</span>
                </div>
              </List.Cell.End>
            </List.Item.Basic>}
          </List.Container>
        </div>
      );
    });
  }

  function renderDatoGroups() {
    return dateKeys.map(dateValue => {
      const txs = visibleTransactions.filter(t => t.dateValue === dateValue);
      const totalNok = txs.reduce((s, t) => s + t.amountNok, 0);
      const dateLabel = txs[0].date;
      const open = isGroupOpen(dateValue);
      const unconfirmedCount = txs.filter(t => t.unconfirmed).length;
      const sumLabel = `Sum ${txs.length} transaksjon${txs.length !== 1 ? "er" : ""}${unconfirmedCount > 0 ? ` (${unconfirmedCount} ubekreftet)` : ""}`;

      return (
        <div key={dateValue} style={{ outline: "1px solid var(--token-color-stroke-neutral-alternative)", borderRadius: "var(--token-radius-md)", overflow: "hidden" }}>
          <List.Container>
            <List.Item.Accordion
              open={open}
              chevronPosition="right"
              style={{ background: "var(--token-color-background-neutral-alternative)", "--item-rounded-corner": "0", borderTopLeftRadius: "var(--token-radius-md)", borderTopRightRadius: "var(--token-radius-md)", ...(!showSaldo ? { borderBottomLeftRadius: "var(--token-radius-md)", borderBottomRightRadius: "var(--token-radius-md)" } : {}) } as React.CSSProperties}
            >
              <List.Item.Accordion.Header onClick={() => toggleGroup(dateValue)}>
                <List.Cell.Title fontWeight="medium">{dateLabel}</List.Cell.Title>
              </List.Item.Accordion.Header>
              <List.Item.Accordion.Content>
                <List.Container>
                  {txs.map(tx => {
                    const acct = accountDetails[tx.accountKey];
                    const overline = `${acct.name} ${acct.number}`;
                    return <TransactionRow key={tx.id} tx={tx} overline={overline} balanceAfter={showSaldo ? runningBalanceMap[tx.id] : undefined} warning={showWarnings && tx.id === "intro-aksel" ? "Betaling stoppet, det var ikke nok penger på konto." : undefined} />;
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

  return (
    <Theme colorScheme={darkMode ? 'dark' : 'light'}>
    <>
    <style>{`
      .dnb-list__item__action .dnb-list__item__chevron .dnb-icon { transform: none !important; transition: none !important; }
      .dnb-list__item__accordion__header { padding-bottom: calc(var(--item-padding)) !important; }
      .dnb-list__item__accordion__header .dnb-list__item__chevron { place-self: center !important; }
      .dnb-list__item__accordion__header .dnb-list__item__title { align-self: center !important; justify-self: stretch !important; }
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__overline) .dnb-list__item__chevron,
      .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__overline) .dnb-list__item__icon { place-self: end !important; }
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
            <Button variant="primary" text="Betal" icon={pay_from} iconPosition="left" />
          </div>
        </div>

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
                    title: "Mai",
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

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <P>Betalingstype</P>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "flex-end" }}>
              <div style={{ flex: "1 0 0", minWidth: "200px" }}>
                <ToggleButton.Group
                  multiselect
                  values={paymentTypes}
                  onChange={({ values }) => setPaymentTypes(values as string[])}
                >
                  <ToggleButton variant="checkbox" text="Overføring" value="overforing" />
                  <ToggleButton variant="checkbox" text="Betaling" value="betaling" />
                  <ToggleButton variant="checkbox" text="AvtaleGiro" value="avtalegiro" />
                  <ToggleButton variant="checkbox" text="eFaktura (1 ny)" value="efaktura" />
                </ToggleButton.Group>
              </div>
              <div ref={huskValgRef} style={{ flexShrink: 0 }}>
                <Switch label="Husk valg" disabled />
                <Tooltip targetElement={huskValgRef}>
                  Lagrer filtervalgene dine til neste innlogging
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* View mode */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "-24px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <P>Gruppering:</P>
            <Radio.Group
              layoutDirection="row"
              value={groupBy}
              onChange={({ value }) => setGroupBy(value)}
            >
              <Radio label="Konto" value="konto" />
              <Radio label="Dato" value="dato" />
            </Radio.Group>
            <div ref={visSaldoRef} style={{ flexShrink: 0 }}>
              <Checkbox
                label="Vis saldo"
                labelPosition="right"
                checked={showSaldo}
                onChange={({ checked }) => setShowSaldo(checked)}
              />
              <Tooltip targetElement={visSaldoRef}>
                Viser saldo og estimering av fremtidig saldo
              </Tooltip>
            </div>
          </div>
          <Button
              variant="tertiary"
              text={allOpen ? "Lukk alle" : "Åpne alle"}
              icon={allOpen ? chevron_up : chevron_down}
              iconPosition="left"
              onClick={toggleAll}
            />
        </div>

        {groupBy === "konto" ? renderKontoGroups() : renderDatoGroups()}

        </div>
      </div>
    </div>

    {/* Tools button */}
    <div style={{ position: "fixed", top: "32px", right: "32px", zIndex: 100 }}>
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
          top: "92px",
          right: "32px",
          background: "var(--token-color-background-neutral)",
          border: "1px solid var(--token-color-stroke-neutral-subtle, #ebebeb)",
          filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.08))",
          borderRadius: "var(--token-radius-md, 8px)",
          minWidth: "340px",
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
            For experimening purposes only...
          </P>
        </div>

        {/* Dark mode row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
          <P size="basis" style={{ margin: 0 }}>Dark mode</P>
          <Switch label="Dark mode" labelSrOnly checked={darkMode} onChange={({ checked }) => setDarkMode(checked)} />
        </div>

        {/* Show warnings row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
          <P size="basis" style={{ margin: 0 }}>Show warnings</P>
          <Switch label="Show warnings" labelSrOnly checked={showWarnings} onChange={({ checked }) => setShowWarnings(checked)} />
        </div>
      </div>
    )}
</>
    </Theme>
  );
}
