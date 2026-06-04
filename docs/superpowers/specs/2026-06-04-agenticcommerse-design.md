# agenticCommerse — designspesifikasjon

**Dato:** 2026-06-04
**Status:** Godkjent design, klar for implementeringsplan
**Eier:** Espen Langsrud

## Bakgrunn og formål

`agenticCommerse` er en ny proof-of-concept-side i uxwork-sandkassen. Den demonstrerer hvordan en bank / kortutsteder kan gi kunden et administrativt dashboard for å kontrollere hvordan AI-agenter handler på kundens vegne, med guard rails per agent. Konseptet bygger på Mastercard Verifiable Intent (identitet / intent / handling; mandater/intent-credentials; selektiv deling; ansvarsforskyvning; autonominivåer).

Denne første iterasjonen bygger ett use case komplett — **booking av padelbane fast hver torsdag 18:00–20:00 hos Oslo Padelklubb** — og legger rammen for å utvide med flere use cases senere.

Siden er en frittstående UX-sandkasse på linje med `paymentsOverview` og `internationalPayment`: `"use client"`, kun Eufemia-komponenter (camelCase props), inline-styling med `var(--token-*)`-tokens og px-verdier, mock-data + `sessionStorage`. Ingen ekte backend/auth. Registreres i `projects`-arrayen i `app/page.tsx`.

## Hovedramme

- **Hovedflate:** Dashboard som hjem. Siden åpner på et oversiktsdashboard over aktive agenter.
- **Oppsett-modell:** Merchant-initiert. Kunden starter hos merchant (padelklubben), konfigurerer bookingen, og sendes til banken for å godkjenne mandatet og sette budsjettrammer (3DS/BankID-aktig).

## Skjermflyt

Én side (`app/agenticCommerse/page.tsx`) med intern `screen`-tilstand:

```
dashboard (tom) → merchant → approve → dashboard (fylt)
```

1. **Dashboard (hjem, tom tilstand)** — «Ingen aktive agenter ennå» + demo-inngang «Simuler: book padel hos Oslo Padelklubb» (står inn for at kunden egentlig kommer fra merchant).
2. **Merchant (Oslo Padelklubb)** — padelklubbens side med **redigerbare** felter: ukedag, fra/til-tid, gjentakelse, pris per booking (maks). Kunden eller agenten som bestiller på vegne av kunden justerer disse selv. CTA «La AI-agenten min booke fast →» sender til banken.
3. **Bank-godkjenning (DNB)** — to blokker:
   - *Agenten får lov til* (hentet fra merchant, merchant-lås): kun Oslo Padelklubb 🔒, tidspunkt, pris per booking.
   - *Dine budsjettrammer* (kunden setter): maks per kjøp, maks per måned, utløpsdato.
   - Selektiv deling-notis: merchant ser kun at betalingen er dekket, ikke kontonummer/saldo.
   - «Godkjenn med BankID» / «Avvis». Avvis → tilbake til merchant.
4. **Dashboard (fylt)** — agent-kortet vises med statusbadge, fast tidsplan, budsjettmåler (forbruk denne måneden + maks per booking), kill switch-toggle, utløpsdato og aktivitetslogg (booket + avviste). Øverst global «Stopp alle agenter».

## Guard rails (padel-caset)

- **Fast tidspunkt** — 1x/uke på angitt tid (torsdag 18:00–20:00), auto-booking innenfor vinduet.
- **Maks ramme per kjøp + per måned** — vist som budsjettmåler på dashboardet.
- **Merchant-lås** — agenten kan kun handle hos Oslo Padelklubb.
- **Kill switch** — kunden kan pause/stoppe agenten når som helst.
- **Utløpsdato** — mandatet utløper på satt dato.
- **Aktivitetslogg / kvitteringer** — hva agenten har gjort (gjennomført + avvist).

## Datamodell

Mock, lagres i `sessionStorage` under `agenticCommerse.mandate` (og `agenticCommerse.screen` for gjeldende skjerm):

```ts
type AgentMandate = {
  id: string;
  merchant: { name: "Oslo Padelklubb"; iso: "NO" };
  agentName: string;            // f.eks. "Padel-agent"
  status: "active" | "paused";
  schedule: { weekday: string; from: string; to: string; recurrence: "ukentlig" };
  caps: { perPurchase: number; perMonth: number };
  spentThisMonth: number;       // mater budsjettmåleren
  expiry: string;               // ISO-dato
  createdAt: string;
  activity: {
    date: string;
    description: string;
    amount: number;
    status: "booket" | "avvist";
  }[];
};
```

## Edge cases (POC-nivå)

- **Kill switch** → `status: "paused"`, agenten booker ikke; dashboardet reflekterer pauset tilstand.
- **Over ramme** → simulert booking over per-kjøp- eller månedsrammen logges som «avvist: over ramme».
- **Utløpt mandat** → agenten er inaktiv.
- **Avvist godkjenning** → tilbake til merchant uten å opprette mandat.

## Eufemia-komponentkartlegging

- **Layout/struktur:** `Theme` (dark mode), `H1/H2/P` fra elements, inline-styling med design-tokens.
- **Merchant-skjerm:** `Dropdown` (ukedag, gjentakelse, tid), `Input`/stepper for pris, `Button` (CTA).
- **Bank-godkjenning:** `Card`/`Section`-aktig container, `Dropdown`/`Input` for budsjettrammer, `Badge` for merchant-lås, `FormStatus`/info-panel for selektiv deling, `Button` (Godkjenn/Avvis).
- **Dashboard:** `Avatar` + `Badge` (agent + status), `ProgressIndicator`/egendefinert måler for budsjett, `Switch` (kill switch), `List` for aktivitetslogg, `Button` (Stopp alle agenter).

(Endelig komponentvalg verifiseres mot installert Eufemia-versjon via .d.ts under implementering — aldri anta API fra treningsdata.)

## Verifisering

Manuell i nettleser (Playwright), som de andre sandkasse-sidene. Ingen testsuite i repoet. Golden path: dashboard (tom) → merchant → godkjenn → dashboard (fylt). Edge cases klikkes gjennom: pause via kill switch, avvis godkjenning, vis avvist-booking i logg.

## Utenfor scope (senere iterasjoner)

- Flere use cases / merchants (utvides etter padel).
- Autonominivå-toggle (auto vs. spør-først) — padel auto-booker innenfor rammene i denne iterasjonen.
- Ekte Supabase-persistens, ekte agent-utførelse, varslinger.
- Geografiske grenser.
