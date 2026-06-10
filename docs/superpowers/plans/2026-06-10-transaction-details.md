# Transaksjonsdetaljer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg en `/transactionDetails`-side som henter betalingsdata fra et offentlig Google Sheet (CSV), transponerer kolonner til betalinger, og lar brukeren bytte visning ved å velge betalingstype.

**Architecture:** Et serverside datalag (`lib/payments.ts`) henter CSV med `cache: 'no-store'`, parser og transponerer til `PaymentRecord[]`. En Server Component-side henter dataene og sender dem til en client-komponent som holder valgt betalingstype i state og viser feltene.

**Tech Stack:** Next.js 16 (App Router, React Server Components), React 19, TypeScript. Ingen nye avhengigheter — egen liten CSV-parser.

> **Verifisering:** Repoet har ingen test-runner (ingen vitest/jest), i tråd med de andre sandkasse-prosjektene. Vi legger ikke til ett (YAGNI). Parser-/transponeringslogikken verifiseres med en midlertidig `tsx`-snutt; siden verifiseres med `npm run build` og manuell browsersjekk.

> **Next-versjon:** `AGENTS.md` advarer om breaking changes i Next 16. Den refererte stien `node_modules/next/dist/docs/` finnes ikke i denne installasjonen. Følg App Router-konvensjon: `async` Server Component, `fetch(..., { cache: 'no-store' })` for live data, `"use client"` kun på den interaktive komponenten.

---

## File Structure

- **Create** `lib/payments.ts` — datalag: typer, CSV-URL, `parseCsv`, `transpose`, `fetchPayments`. Eneste ansvar: hente og forme regneark-data.
- **Create** `app/transactionDetails/page.tsx` — Server Component: henter data, rendrer client-komponenten.
- **Create** `app/transactionDetails/PaymentDetailsView.tsx` — client-komponent: betalingstype-velger + feltvisning.

---

## Task 1: Datalag (`lib/payments.ts`)

**Files:**
- Create: `lib/payments.ts`

- [ ] **Step 1: Skriv typer, URL og CSV-parser**

Create `lib/payments.ts`:

```typescript
export interface PaymentField {
  label: string;
  value: string;
}

export interface PaymentRecord {
  type: string;
  fields: PaymentField[];
}

const SHEET_ID = "1gHIVpCGZWkxucVTy3N74m9AQxyDO8hm-MRAc9aJB_0s";
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// Minimal CSV-parser: håndterer dobbeltfnuttede felt, komma inni felt,
// og escapede fnutter ("").
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignorer CR
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
```

- [ ] **Step 2: Legg til transponering + fetch i samme fil**

Append to `lib/payments.ts`:

```typescript
// Transponerer regnearket: kolonner = betalingstyper, rader = datafelt.
// Første rad er headerrad (første celle tom, resten er betalingstyper).
// Første celle i hver påfølgende rad er feltnavnet.
export function transpose(rows: string[][]): PaymentRecord[] {
  if (rows.length === 0) return [];

  const header = rows[0];
  const paymentTypes = header.slice(1).map((t) => t.trim());

  const records: PaymentRecord[] = paymentTypes.map((type, colIndex) => {
    const fields: PaymentField[] = [];
    for (let r = 1; r < rows.length; r++) {
      const label = (rows[r][0] ?? "").trim();
      const value = (rows[r][colIndex + 1] ?? "").trim();
      if (label && value) {
        fields.push({ label, value });
      }
    }
    return { type, fields };
  });

  // Skjul betalingstyper uten utfylte felt (f.eks. tom "Bus Payment"-kolonne).
  return records.filter((r) => r.type && r.fields.length > 0);
}

export async function fetchPayments(): Promise<PaymentRecord[]> {
  const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Klarte ikke hente regneark: ${res.status}`);
  }
  const text = await res.text();
  return transpose(parseCsv(text));
}
```

- [ ] **Step 3: Verifiser parser + transponering**

Run:
```bash
cd ~/github/uxwork && cat > lib/_check.mts <<'EOF'
import { parseCsv, transpose, fetchPayments } from "./payments.ts";

const sample = `"","Bankaxept","Bus Payment"
"Date","12.09.2025",""
"Amount","100",""
"To name","Rema 1000",""`;

console.log("parsed/transposed sample:");
console.log(JSON.stringify(transpose(parseCsv(sample)), null, 2));

console.log("--- live fetch ---");
const live = await fetchPayments();
console.log(live.map((r) => `${r.type}: ${r.fields.length} felt`).join("\n"));
EOF
npx --yes tsx lib/_check.mts; rm lib/_check.mts
```

Expected: sample viser kun `Bankaxept` med 3 felt (tom `Bus Payment` filtrert bort). Live fetch lister `Bankaxept`, `Visa`, `Mastercard`, `Payment` med feltantall > 0, og IKKE `Bus Payment`.

- [ ] **Step 4: Commit**

```bash
cd ~/github/uxwork && git add lib/payments.ts && git commit -m "feat(transactionDetails): add Google Sheet payment data layer"
```

---

## Task 2: Client-komponent (betalingstype-velger + feltvisning)

**Files:**
- Create: `app/transactionDetails/PaymentDetailsView.tsx`

- [ ] **Step 1: Skriv client-komponenten**

Create `app/transactionDetails/PaymentDetailsView.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { PaymentRecord } from "@/lib/payments";

export default function PaymentDetailsView({
  payments,
}: {
  payments: PaymentRecord[];
}) {
  const [selectedType, setSelectedType] = useState(
    payments[0]?.type ?? ""
  );

  const selected = payments.find((p) => p.type === selectedType);

  if (payments.length === 0) {
    return <p>Ingen betalinger funnet i regnearket.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {payments.map((p) => (
          <button
            key={p.type}
            type="button"
            onClick={() => setSelectedType(p.type)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: p.type === selectedType ? "#0a3d62" : "#fff",
              color: p.type === selectedType ? "#fff" : "#000",
              cursor: "pointer",
            }}
          >
            {p.type}
          </button>
        ))}
      </div>

      {selected && (
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 24px" }}>
          {selected.fields.map((f) => (
            <div key={f.label} style={{ display: "contents" }}>
              <dt style={{ fontWeight: 600 }}>{f.label}</dt>
              <dd style={{ margin: 0 }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
```

> Foreløpig minimal/funksjonell UI med inline-stiler. Visuell polish med Eufemia kommer i designfasen.

- [ ] **Step 2: Commit**

```bash
cd ~/github/uxwork && git add app/transactionDetails/PaymentDetailsView.tsx && git commit -m "feat(transactionDetails): add payment type switcher view"
```

---

## Task 3: Side (Server Component) + verifisering

**Files:**
- Create: `app/transactionDetails/page.tsx`

- [ ] **Step 1: Skriv Server Component-siden**

Create `app/transactionDetails/page.tsx`:

```tsx
import { fetchPayments } from "@/lib/payments";
import PaymentDetailsView from "./PaymentDetailsView";

export default async function TransactionDetailsPage() {
  const payments = await fetchPayments();

  return (
    <main style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem" }}>
      <h1>Transaksjonsdetaljer</h1>
      <PaymentDetailsView payments={payments} />
    </main>
  );
}
```

> `@/lib/payments` forutsetter at `@/*`-alias finnes i `tsconfig.json` (standard i dette Next-oppsettet). Hvis bygg klager på aliaset, bruk relativ import `../../lib/payments`.

- [ ] **Step 2: Bygg prosjektet**

Run:
```bash
cd ~/github/uxwork && npm run build
```
Expected: bygg fullfører uten type-/lint-feil; `/transactionDetails` dukker opp i rute-oversikten.

- [ ] **Step 3: Manuell browsersjekk**

Run:
```bash
cd ~/github/uxwork && npm run dev
```
Åpne `http://localhost:3000/transactionDetails`. Verifiser:
- Knapper vises for `Bankaxept`, `Visa`, `Mastercard`, `Payment` (ikke `Bus Payment`).
- Klikk på en betalingstype bytter feltvisningen.
- Kun utfylte felt vises (tomme rader som KID skjules).
- Rediger en celle i regnearket, last siden på nytt → endringen vises (live).

- [ ] **Step 4: Commit**

```bash
cd ~/github/uxwork && git add app/transactionDetails/page.tsx && git commit -m "feat(transactionDetails): add server-rendered page"
```

---

## Self-Review

- **Spec coverage:** Datakilde/gviz-CSV → Task 1. Live `no-store` → Task 1 Step 2. Transponering kolonne→betaling → Task 1 Step 2. Skjul tomme typer/felt → Task 1 `transpose` filter + label/value-sjekk. View-switching → Task 2. Server Component-side + camelCase-rute → Task 3. Alle spec-punkter dekket.
- **Placeholder scan:** Ingen TBD/TODO; all kode er fullstendig.
- **Type consistency:** `PaymentField`/`PaymentRecord` definert i Task 1 og brukt uendret i Task 2/3. `fetchPayments` returnerer `PaymentRecord[]`, konsumert i Task 3.
