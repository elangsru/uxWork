# agenticCommerse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page proof-of-concept (`app/agenticCommerse/page.tsx`) where a customer authorizes an AI shopping agent (merchant-initiated) and then manages it from a bank dashboard with per-agent guard rails — first use case: recurring padel booking.

**Architecture:** One `"use client"` page with an internal `screen` state machine (`dashboard → merchant → approve → dashboard`). Booking config is collected on the merchant screen, the mandate + budget rails are set/authorized on the bank screen, and the resulting `AgentMandate` is persisted to `sessionStorage` and rendered as an agent card on the dashboard. Mock data only — no backend, no auth. Mirrors the existing `paymentsOverview` / `internationalPayment` sandbox pattern (Eufemia components with camelCase props, inline styles with `var(--token-*)` tokens).

**Tech Stack:** Next.js 16.2.4 (App Router), React 19, TypeScript strict, @dnb/eufemia 11.0.2.

---

## Verification model (read first)

This repo has **no test framework or test scripts** (`package.json` has only `dev`/`build`/`start`/`lint`). Do NOT introduce one. Each task is verified by:

1. **Type/build check:** `npx tsc --noEmit` (must pass clean — strict mode; snake_case Eufemia props or stray type annotations break the Railway build).
2. **Browser check:** with `npm run dev` running, load `http://localhost:3000/agenticCommerse` and confirm the described behavior. Use Playwright MCP if available.

Always verify the actual installed Eufemia API in `node_modules/@dnb/eufemia/components/**/*.d.ts` before using a prop — never assume from training data.

## File structure

- **Create:** `app/agenticCommerse/page.tsx` — the entire feature (state machine + 3 screens + mandate model). Single file matches the repo convention (`internationalPayment/page.tsx` is one 1365-line file).
- **Modify:** `app/page.tsx` — add `agenticCommerse` to the `projects` array so it is reachable from the landing page.

---

## Task 1: Scaffold page, types, state machine, and landing-page link

**Files:**
- Create: `app/agenticCommerse/page.tsx`
- Modify: `app/page.tsx` (the `projects` array, lines 7-23)

- [ ] **Step 1: Create the page skeleton with the mandate type and screen state machine**

Create `app/agenticCommerse/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button } from "@dnb/eufemia/components";
import { H1, P } from "@dnb/eufemia/elements";

type Screen = "dashboard" | "merchant" | "approve";

type Activity = {
  date: string;
  description: string;
  amount: number;
  status: "booket" | "avvist";
};

type AgentMandate = {
  id: string;
  merchant: { name: string; iso: string };
  agentName: string;
  status: "active" | "paused";
  schedule: { weekday: string; from: string; to: string; recurrence: string };
  caps: { perPurchase: number; perMonth: number };
  spentThisMonth: number;
  expiry: string;
  createdAt: string;
  activity: Activity[];
};

const MERCHANT = { name: "Oslo Padelklubb", iso: "NO" };

export default function AgenticCommerse() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [mandate, setMandate] = useState<AgentMandate | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("agenticCommerse.mandate");
    if (raw) {
      try {
        setMandate(JSON.parse(raw) as AgentMandate);
      } catch {
        /* ignore malformed state */
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (mandate) {
      sessionStorage.setItem("agenticCommerse.mandate", JSON.stringify(mandate));
    } else {
      sessionStorage.removeItem("agenticCommerse.mandate");
    }
  }, [mandate, hydrated]);

  return (
    <Theme name="ui" mode={darkMode ? "dark" : "light"}>
      <main
        style={{
          minHeight: "100vh",
          background: "var(--token-color-background-default, #fff)",
          padding: "32px 24px",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          {screen === "dashboard" && (
            <div>
              <H1 size="large" suppressHydrationWarning>
                Mine handleagenter
              </H1>
              <P top="small">Skjerm: dashboard (bygges i Task 2 & 5)</P>
            </div>
          )}
          {screen === "merchant" && <P>Skjerm: merchant (bygges i Task 3)</P>}
          {screen === "approve" && <P>Skjerm: approve (bygges i Task 4)</P>}

          <Button
            variant="tertiary"
            text="↻ Nullstill demo"
            top="medium"
            onClick={() => {
              setMandate(null);
              setScreen("dashboard");
            }}
          />
        </div>
      </main>
    </Theme>
  );
}
```

- [ ] **Step 2: Verify `Theme` accepts `name="ui"` and `mode` in installed version**

Run: `grep -iE "name|mode|'dark'|\"dark\"" node_modules/@dnb/eufemia/shared/Theme.d.ts | head`
Expected: shows a `mode` prop accepting `'light' | 'dark'` (or similar). If the API differs, match the dark-mode pattern used in `app/internationalPayment/page.tsx` (search it for `Theme` / `darkMode`) instead.

- [ ] **Step 3: Add the page to the landing-page `projects` array**

In `app/page.tsx`, add this entry to the `projects` array (after the existing entries, before the closing `]`):

```tsx
  {
    label: "Agentic commerce (concept)",
    href: "/agenticCommerse",
  },
```

(The `jiraUrl` field is optional — the existing render already guards with `p.jiraUrl &&`.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 5: Browser check**

With `npm run dev` running, open `http://localhost:3000` → click "Agentic commerce (concept)" → confirm route `/agenticCommerse` loads showing "Mine handleagenter" and the reset button.

- [ ] **Step 6: Commit**

```bash
git add app/agenticCommerse/page.tsx app/page.tsx
git commit -m "feat(agenticCommerse): scaffold page, mandate model, screen state machine"
```

---

## Task 2: Dashboard empty state

**Files:**
- Modify: `app/agenticCommerse/page.tsx` (the `screen === "dashboard"` block)

- [ ] **Step 1: Replace the dashboard placeholder with the empty state**

Replace the `screen === "dashboard"` block from Task 1 with this. When `mandate` is null, show the empty state with the demo entry point that simulates arriving from the merchant:

```tsx
{screen === "dashboard" && (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}
    >
      <H1 size="large" suppressHydrationWarning>
        Mine handleagenter
      </H1>
      {mandate && (
        <Button
          variant="secondary"
          text="Stopp alle agenter"
          icon={power}
          iconPosition="left"
          onClick={() =>
            setMandate((m) => (m ? { ...m, status: "paused" } : m))
          }
        />
      )}
    </div>

    {!mandate && (
      <Card filled stack>
        <P>Du har ingen aktive handleagenter ennå.</P>
        <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
          En handleagent kan utføre faste kjøp for deg innenfor rammer du
          bestemmer — og du kan stoppe den når som helst.
        </P>
        <Button
          variant="primary"
          text="Simuler: book padel hos Oslo Padelklubb"
          top="small"
          onClick={() => setScreen("merchant")}
        />
      </Card>
    )}

    {/* Filled state (agent card) is added in Task 5 */}
  </div>
)}
```

- [ ] **Step 2: Add the new imports**

Update the imports at the top of the file:

```tsx
import { Button, Card } from "@dnb/eufemia/components";
import { power } from "@dnb/eufemia/icons";
```

Run: `grep -i "power" node_modules/@dnb/eufemia/icons/index.d.ts | head`
Expected: confirms a `power` icon export. If absent, pick an existing icon (e.g. `close`) — run `ls node_modules/@dnb/eufemia/icons/ | grep -iE "power|stop|close"` and use what exists.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Browser check**

Reload `/agenticCommerse`. Confirm: empty-state card with explanatory text and the "Simuler: book padel…" primary button. Clicking it switches to the (still placeholder) merchant screen.

- [ ] **Step 5: Commit**

```bash
git add app/agenticCommerse/page.tsx
git commit -m "feat(agenticCommerse): dashboard empty state with demo entry point"
```

---

## Task 3: Merchant screen with editable booking config

**Files:**
- Modify: `app/agenticCommerse/page.tsx`

- [ ] **Step 1: Add booking-config state**

Add these state hooks inside the component, after the existing `useState` calls:

```tsx
const [weekday, setWeekday] = useState("torsdag");
const [fromTime, setFromTime] = useState("18:00");
const [toTime, setToTime] = useState("20:00");
const [recurrence, setRecurrence] = useState("ukentlig");
const [pricePerBooking, setPricePerBooking] = useState(400);
```

- [ ] **Step 2: Add Dropdown data constants at module scope**

Above the component (after the `MERCHANT` const), add:

```tsx
const weekdayOptions = [
  "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag",
].map((d) => ({ selectedKey: d, content: d.charAt(0).toUpperCase() + d.slice(1) }));

const timeOptions = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].map(
  (t) => ({ selectedKey: t, content: t }),
);

const recurrenceOptions = [
  { selectedKey: "ukentlig", content: "Hver uke" },
  { selectedKey: "annenhver", content: "Annenhver uke" },
];
```

- [ ] **Step 3: Replace the merchant placeholder with the editable form**

Replace the `screen === "merchant"` block with:

```tsx
{screen === "merchant" && (
  <Card stack>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <Avatar size="medium" variant="primary">🎾</Avatar>
      <H2 size="medium">Oslo Padelklubb</H2>
    </div>
    <P>
      Sett opp en AI-agent som booker bane for deg fast. Du bestemmer når og
      hvor ofte — banken din godkjenner og setter budsjettrammene.
    </P>

    <Dropdown
      label="Ukedag"
      data={weekdayOptions}
      value={weekday}
      on_change={({ data }) => setWeekday(String(data.selectedKey))}
      stretch
      top="small"
    />
    <div style={{ display: "flex", gap: "12px" }}>
      <Dropdown
        label="Fra"
        data={timeOptions}
        value={fromTime}
        on_change={({ data }) => setFromTime(String(data.selectedKey))}
        stretch
        top="small"
      />
      <Dropdown
        label="Til"
        data={timeOptions}
        value={toTime}
        on_change={({ data }) => setToTime(String(data.selectedKey))}
        stretch
        top="small"
      />
    </div>
    <Dropdown
      label="Gjentakelse"
      data={recurrenceOptions}
      value={recurrence}
      on_change={({ data }) => setRecurrence(String(data.selectedKey))}
      stretch
      top="small"
    />
    <Input
      label="Pris per booking (maks)"
      type="number"
      value={String(pricePerBooking)}
      on_change={({ value }) => setPricePerBooking(Number(value) || 0)}
      suffix="kr"
      stretch
      top="small"
    />

    <Button
      variant="primary"
      text="La AI-agenten min booke fast"
      icon={chevron_right}
      iconPosition="right"
      top="medium"
      onClick={() => setScreen("approve")}
    />
    <Button
      variant="tertiary"
      text="Avbryt"
      top="x-small"
      onClick={() => setScreen("dashboard")}
    />
  </Card>
)}
```

- [ ] **Step 4: Update imports**

```tsx
import { Button, Card, Avatar, Dropdown, Input } from "@dnb/eufemia/components";
import { H1, H2, P } from "@dnb/eufemia/elements";
import { power, chevron_right } from "@dnb/eufemia/icons";
```

Run: `grep -iE "on_change|selectedKey|value\?|data\?" node_modules/@dnb/eufemia/components/dropdown/Dropdown.d.ts | head`
Expected: confirms `data`, `value`, and `on_change` props. The existing `internationalPayment/page.tsx` already uses `Dropdown` — cross-check its usage if signatures differ.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. (If `on_change` event typing complains, do NOT add a `: string` annotation to the handler param — that broke a Railway build before; let it infer.)

- [ ] **Step 6: Browser check**

From the dashboard empty state, click "Simuler…". Confirm the merchant card renders with editable Ukedag/Fra/Til/Gjentakelse dropdowns (default Torsdag/18:00/20:00/Hver uke) and a numeric price input (400 kr). Change a value and confirm it updates. "La AI-agenten min booke fast" advances to the approve placeholder.

- [ ] **Step 7: Commit**

```bash
git add app/agenticCommerse/page.tsx
git commit -m "feat(agenticCommerse): merchant screen with editable booking config"
```

---

## Task 4: Bank approval screen (creates the mandate)

**Files:**
- Modify: `app/agenticCommerse/page.tsx`

- [ ] **Step 1: Add budget-rail state**

Add after the booking-config state from Task 3:

```tsx
const [capPerPurchase, setCapPerPurchase] = useState(400);
const [capPerMonth, setCapPerMonth] = useState(1600);
const [expiry, setExpiry] = useState("2026-12-31");
```

- [ ] **Step 2: Add a `createMandate` handler**

Add this function inside the component, before the `return`:

```tsx
const createMandate = () => {
  const now = new Date();
  setMandate({
    id: `mandate-${now.getTime()}`,
    merchant: MERCHANT,
    agentName: "Padel-agent",
    status: "active",
    schedule: { weekday, from: fromTime, to: toTime, recurrence },
    caps: { perPurchase: capPerPurchase, perMonth: capPerMonth },
    spentThisMonth: 0,
    expiry,
    createdAt: now.toISOString(),
    activity: [],
  });
  setScreen("dashboard");
};
```

- [ ] **Step 3: Replace the approve placeholder**

Replace the `screen === "approve"` block with:

```tsx
{screen === "approve" && (
  <Card stack>
    <div style={{ textAlign: "center" }}>
      <Avatar size="large" variant="primary">🛡️</Avatar>
      <H2 size="medium" top="small">Autoriser handleagent</H2>
      <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
        {MERCHANT.name} ber om å booke fast på dine vegne
      </P>
    </div>

    <P size="small" bottom="x-small" top="medium" style={{ fontWeight: 600 }}>
      AGENTEN FÅR LOV TIL
    </P>
    <List>
      <Li>
        Kun hos <strong>{MERCHANT.name}</strong>{" "}
        <Badge variant="information" content="Låst" />
      </Li>
      <Li>
        Hver {weekday} {fromTime}–{toTime} ({recurrence})
      </Li>
      <Li>
        Per booking: <NumberFormat currency="NOK">{pricePerBooking}</NumberFormat>
      </Li>
    </List>

    <P size="small" bottom="x-small" top="medium" style={{ fontWeight: 600 }}>
      DINE BUDSJETTRAMMER
    </P>
    <Input
      label="Maks per kjøp"
      type="number"
      value={String(capPerPurchase)}
      on_change={({ value }) => setCapPerPurchase(Number(value) || 0)}
      suffix="kr"
      stretch
    />
    <Input
      label="Maks per måned"
      type="number"
      value={String(capPerMonth)}
      on_change={({ value }) => setCapPerMonth(Number(value) || 0)}
      suffix="kr"
      stretch
      top="small"
    />
    <Input
      label="Mandat utløper"
      type="date"
      value={expiry}
      on_change={({ value }) => setExpiry(String(value))}
      stretch
      top="small"
    />

    <InfoCard
      top="medium"
      text={`${MERCHANT.name} ser kun at betalingen er dekket — ikke kontonummer eller saldo.`}
    />

    <Button variant="primary" text="Godkjenn med BankID" top="medium" onClick={createMandate} />
    <Button variant="secondary" text="Avvis" top="x-small" onClick={() => setScreen("merchant")} />
  </Card>
)}
```

- [ ] **Step 4: Update imports**

```tsx
import { Button, Card, Avatar, Dropdown, Input, List, Badge, InfoCard, NumberFormat } from "@dnb/eufemia/components";
import { H1, H2, P } from "@dnb/eufemia/elements";
```

For the list item element, check how `List` exposes items:
Run: `grep -iE "Li|ListItem|export" node_modules/@dnb/eufemia/components/list/List.d.ts | head`
Expected: confirms the child item component name. If it is not `Li`, import the correct one (commonly `Li` from `@dnb/eufemia/elements`: run `grep -i "Li" node_modules/@dnb/eufemia/elements/index.d.ts | head`) and adjust the JSX. Verify `InfoCard` accepts a `text` prop: `grep -iE "text|variant" node_modules/@dnb/eufemia/components/info-card/InfoCard.d.ts | head`.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Browser check**

Walk merchant → "La AI-agenten min booke fast". Confirm the approval card shows the two blocks ("Agenten får lov til" reflecting the values chosen on the merchant screen; "Dine budsjettrammer" with editable caps + expiry), the selective-disclosure InfoCard, and Godkjenn/Avvis. "Avvis" returns to merchant. "Godkjenn med BankID" returns to the dashboard (card appears once Task 5 is done; for now confirm no crash and `sessionStorage` key `agenticCommerse.mandate` is set via devtools).

- [ ] **Step 7: Commit**

```bash
git add app/agenticCommerse/page.tsx
git commit -m "feat(agenticCommerse): bank approval screen creates the mandate"
```

---

## Task 5: Dashboard filled state (agent card)

**Files:**
- Modify: `app/agenticCommerse/page.tsx`

- [ ] **Step 1: Add a currency formatter helper at module scope**

Above the component:

```tsx
const fmtNok = (n: number) =>
  new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(n);
```

- [ ] **Step 2: Add the agent card after the empty-state block**

Inside the `screen === "dashboard"` block, replace the `{/* Filled state ... */}` comment with:

```tsx
{mandate && (
  <Card stack>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <Avatar size="medium" variant="primary">P</Avatar>
      <div style={{ flex: 1 }}>
        <P style={{ fontWeight: 600 }}>{mandate.agentName}</P>
        <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
          {mandate.merchant.name}
        </P>
      </div>
      <Badge
        variant={mandate.status === "active" ? "information" : "neutral"}
        content={mandate.status === "active" ? "Aktiv" : "Pauset"}
      />
    </div>

    <P top="small">
      Booker fast <strong>hver {mandate.schedule.weekday} {mandate.schedule.from}–{mandate.schedule.to}</strong> · {mandate.schedule.recurrence}
    </P>

    <div style={{ marginTop: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <P size="small">Denne måneden</P>
        <P size="small">
          {fmtNok(mandate.spentThisMonth)} av {fmtNok(mandate.caps.perMonth)}
        </P>
      </div>
      <ProgressIndicator
        type="linear"
        progress={Math.min(100, (mandate.spentThisMonth / mandate.caps.perMonth) * 100)}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        <P size="small">Maks per booking</P>
        <P size="small">{fmtNok(mandate.caps.perPurchase)}</P>
      </div>
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "16px",
      }}
    >
      <P>Pause agent (kill switch)</P>
      <Switch
        checked={mandate.status === "active"}
        on_change={({ checked }) =>
          setMandate((m) => (m ? { ...m, status: checked ? "active" : "paused" } : m))
        }
        labelSrOnly
      />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
        Mandat utløper
      </P>
      <P size="small">{mandate.expiry}</P>
    </div>

    <P top="medium" style={{ fontWeight: 600 }}>Aktivitet</P>
    {mandate.activity.length === 0 ? (
      <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
        Ingen bookinger ennå.
      </P>
    ) : (
      <List>
        {mandate.activity.map((a, i) => (
          <Li key={i}>
            {a.status === "booket" ? "✅" : "⛔"} {a.description}
            {a.status === "booket" ? ` · ${fmtNok(a.amount)}` : ""}
          </Li>
        ))}
      </List>
    )}
  </Card>
)}
```

- [ ] **Step 3: Update imports**

```tsx
import { Button, Card, Avatar, Dropdown, Input, List, Badge, InfoCard, NumberFormat, Switch, ProgressIndicator } from "@dnb/eufemia/components";
```

Verify Badge variants:
Run: `grep -iE "variant|'information'|'neutral'|content" node_modules/@dnb/eufemia/components/badge/Badge.d.ts | head`
Expected: confirms available `variant` values. If `"neutral"`/`"information"` are not valid, use the closest existing variants and keep the active/paused distinction.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Browser check (golden path)**

Full walk: dashboard (empty) → Simuler → merchant (edit nothing) → La AI-agenten… → Godkjenn med BankID → dashboard now shows the Padel-agent card with "Aktiv" badge, schedule line, budget meter at 0%, kill-switch on, expiry 2026-12-31, and "Ingen bookinger ennå." Toggle the kill switch → badge flips to "Pauset". The top-right "Stopp alle agenter" also sets it to paused.

- [ ] **Step 6: Commit**

```bash
git add app/agenticCommerse/page.tsx
git commit -m "feat(agenticCommerse): dashboard agent card with budget meter, kill switch, activity log"
```

---

## Task 6: Seed demo activity + budget/edge-case behavior + final verification

**Files:**
- Modify: `app/agenticCommerse/page.tsx`

- [ ] **Step 1: Seed realistic activity on mandate creation**

In `createMandate` (Task 4), replace `spentThisMonth: 0` and `activity: []` with seeded demo data so the dashboard tells a story, including one over-cap rejection:

```tsx
    spentThisMonth: capPerPurchase * 2,
    expiry,
    createdAt: now.toISOString(),
    activity: [
      { date: "2026-05-28", description: `Booket bane · ${weekday} 28. mai ${fromTime}`, amount: capPerPurchase, status: "booket" },
      { date: "2026-05-21", description: `Booket bane · ${weekday} 21. mai ${fromTime}`, amount: capPerPurchase, status: "booket" },
      { date: "2026-05-14", description: "Avvist · over månedsramme", amount: 0, status: "avvist" },
    ],
```

- [ ] **Step 2: Show a FormStatus warning when the kill switch is off**

In the agent card (Task 5), directly after the `Switch` row's closing `</div>`, add a paused-state notice so the guard-rail effect is visible:

```tsx
{mandate.status === "paused" && (
  <FormStatus state="warning" top="x-small">
    Agenten er satt på pause og vil ikke booke nye baner.
  </FormStatus>
)}
```

Add `FormStatus` to the imports:

```tsx
import { Button, Card, Avatar, Dropdown, Input, List, Badge, InfoCard, NumberFormat, Switch, ProgressIndicator, FormStatus } from "@dnb/eufemia/components";
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Full browser verification (golden path + edges)**

With `npm run dev`:
1. Empty dashboard → Simuler → merchant → change Ukedag to "tirsdag" → approve → Godkjenn. Card shows "hver tirsdag", budget meter at 50% (2×400 of 1600), three activity rows incl. the red "Avvist · over månedsramme".
2. Toggle kill switch off → badge "Pauset" + warning FormStatus appears.
3. "Stopp alle agenter" → also pauses.
4. "↻ Nullstill demo" → back to empty state; reload page → still empty (sessionStorage cleared).
5. Reload after creating a mandate (before reset) → mandate persists (sessionStorage rehydration).
6. Confirm no console errors and no hydration warnings.

- [ ] **Step 5: Commit**

```bash
git add app/agenticCommerse/page.tsx
git commit -m "feat(agenticCommerse): seed demo activity and paused-state guard-rail notice"
```

---

## Self-review notes (spec coverage)

- Hovedflate "dashboard som hjem" → Task 2/5. ✓
- Merchant-initiert, redigerbare felter → Task 3. ✓
- Bank-godkjenning med budsjettrammer + merchant-lås + selektiv deling → Task 4. ✓
- Guard rails (fast tidspunkt, per-kjøp + per-måned, merchant-lås, kill switch, utløp, aktivitetslogg) → Tasks 4–6. ✓
- `AgentMandate` datamodell + sessionStorage → Task 1. ✓
- Edge cases (pause, over ramme, avvist godkjenning) → Tasks 4 & 6. ✓
- Eufemia-komponenter, camelCase/no stray annotations, verify-against-.d.ts → enforced in every task. ✓
- Registrert i landingssiden → Task 1. ✓
- No test framework introduced; build + browser verification only. ✓
```
