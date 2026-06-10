# Transaksjonsdetaljer — design

**Dato:** 2026-06-10
**Status:** Godkjent design, klar for implementeringsplan

## Mål

Ny side i nettbanken som viser transaksjonsdetaljer for ulike betalingstyper.
Brukeren skal kunne bytte mellom visninger ved å velge betalingstype. Data hentes
fra et offentlig delt Google-regneark. Visuelt design tas i en senere iterasjon —
dette dokumentet dekker datakobling og funksjonelt stillas.

## Datakilde

Google Sheet (offentlig delt, lesetilgang via lenke):
`https://docs.google.com/spreadsheets/d/1gHIVpCGZWkxucVTy3N74m9AQxyDO8hm-MRAc9aJB_0s`

Hentes som CSV via gviz-endepunktet (bekreftet fungerende uten autentisering):
`.../gviz/tq?tqx=out:csv`

### Struktur i arket (transponert)

- **Kolonner = betalingstyper:** Bankaxept, Visa, Mastercard, Payment, Bus Payment
- **Rader = datafelt:** Date, Amount, To name, To account, From account, Melding, KID

Hver kolonne er altså én betaling; radene er detaljene for den betalingen.
Tomme celler forekommer (f.eks. KID er tom overalt, "Bus Payment" er helt tom).

## Tilnærming (valgt: A)

**A. Serverside-fetch av offentlig CSV.** Henter CSV-endepunktet i en Server
Component, parser og transponerer til betalingsobjekter. Ingen nøkler eller
Google Cloud-oppsett. Valgt fordi arket allerede er offentlig delt.

Avviste alternativer:
- **B. Google Sheets API** — krever Google Cloud-prosjekt og nøkkelhåndtering;
  overkill når arket er offentlig. Fallback hvis arket gjøres privat senere.
- **C. Client-side fetch** — gviz-endepunktet gir ofte CORS-trøbbel fra browser,
  og vi mister serverkontroll over caching.

## Arkitektur

### 1. Datalag — `lib/payments.ts`

- `SHEET_CSV_URL`: konstant med gviz CSV-endepunktet.
- `fetchPayments(): Promise<PaymentRecord[]>`: serverside `fetch` med
  `{ cache: 'no-store' }` (live ved hver visning). Parser CSV med en liten
  intern quoted-CSV-parser (ingen ny avhengighet), og transponerer kolonner til
  betalingsobjekter.
- Typer:
  - `PaymentField { label: string; value: string }`
  - `PaymentRecord { type: string; fields: PaymentField[] }`

### 2. Side — `app/transactionDetails/page.tsx` (Server Component)

- Kaller `fetchPayments()` og sender hele lista videre til client-komponenten.

### 3. View-switching — client-komponent

- Holder valgt betalingstype i state og viser feltene for valgt type.
- Foreløpig minimal, funksjonell UI (enkel velger + feltliste). Visuell polish
  med Eufemia kommer i designfasen.

## Datahåndtering (standardvalg, justerbart i designfasen)

- **Betalingstyper:** viser kun kolonner med minst ett utfylt felt → "Bus Payment"
  (helt tom) skjules automatisk.
- **Felt:** detaljvisningen viser kun rader med verdi for valgt type; tomme felt
  (f.eks. KID) skjules.

## Konvensjoner / risiko

- Følger camelCase-rutekonvensjon i repoet (`/transactionDetails`).
- `AGENTS.md`: denne Next.js-versjonen (16.2.4) har breaking changes — les
  relevante docs i `node_modules/next/dist/docs/` før koding.
- Hvis arket gjøres privat senere må vi bytte til plan B (Sheets API).
