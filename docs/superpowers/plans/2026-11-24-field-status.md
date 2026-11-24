# Field status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** «Field status» i Tools-menyen på `/paymentsOverview` lar deg sette hvert felt i redigeringsskjemaene til Editable, Disabled eller Read only.

**Architecture:** En delt `ConfigurableField` velger mellom feltet, feltet deaktivert, eller en `ReadOnlyField` (designet fra «Rediger bankinfo» på `/internationalPayment`). Siden eier statusene og sender dem til skjemaet som er åpent; `undefined` betyr dagens oppførsel.

**Tech Stack:** Next.js 16 (app router, klientkomponenter), React, `@dnb/eufemia` 11.18.1, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-24-field-status-design.md`

## Global Constraints

- Feltnøkler og etiketter, i denne rekkefølgen: `fromAccount` «Fra konto», `toAccount` «Til konto», `currency` «Valuta», `amount` «Beløp», `message` «Melding», `kid` «KID», `paymentDate` «Betalingsdato».
- Statuser og etiketter: `editable` «Editable», `disabled` «Disabled», `readOnly` «Read only».
- Startverdi: alle felt `editable`.
- Svitsj av → `fieldStatus` er `undefined` og skjemaene oppfører seg nøyaktig som før.
- Svitsj på → statusen per felt gjelder og overstyrer `readOnly` (lån), `isFund` og den faste `disabled` på KID.
- Read only: `FormLabel` med `marginBottom: 0`, gap `var(--spacing-xx-small)`, verdi som `P` i `var(--token-color-text-neutral-alternative)`.
- Tom melding i read only vises som «–». Dato i read only formateres med `LOCALE` (`nb-NO`) som «3. desember 2026».
- Ingen testrammeverk i prosjektet: verifisering er `npx eslint app/paymentsOverview app/internationalPayment`, `npx tsc --noEmit -p .`, `npx next build` og sjekk i nettleseren på `http://localhost:3000/paymentsOverview`.

## Review Focus

- **Bytte status mens modalen er åpen:** feltet skal skifte tilstand med en gang, og verdien brukeren har skrevet skal beholdes (state ligger i skjemaet, ikke i feltet). Sjekkes i Task 3.
- **Svitsj av etter endringer:** når «Field status» slås av, skal lånet igjen være helt låst og KID låst, selv om valgene i menyen står på Editable. Sjekkes i Task 3.
- **Felt som ikke finnes i skjemaet:** Til konto på innenlands, Valuta på overføring osv. skal ikke dukke opp fordi de har en status. Sjekkes i Task 3.
- **Read only på tomt felt:** tom melding gir «–», ikke en tom linje uten høyde. Sjekkes i Task 3.
- **`/internationalPayment` etter utflyttingen:** bankinfoen skal se lik ut, med skeleton, som før. Sjekkes i Task 1.

---

### Task 1: `ReadOnlyField` og `ConfigurableField`

**Files:**
- Create: `app/shared/ReadOnlyField.tsx`
- Create: `app/paymentsOverview/fieldStatus.tsx`
- Modify: `app/internationalPayment/page.tsx:789-822` (`readOnlyField` bruker `ReadOnlyField`)

**Interfaces:**
- Produces:
  - `ReadOnlyField({ label: string; lines: string[]; lineStyle?: CSSProperties; children?: (lines: ReactNode) => ReactNode })` — default export. `children` lar `/internationalPayment` pakke linjene i sin `Skeleton`; uten `children` rendres linjene direkte. `lineStyle` legges på hver `P`.
  - `type FieldKey = "fromAccount" | "toAccount" | "currency" | "amount" | "message" | "kid" | "paymentDate"`
  - `type FieldStatus = "editable" | "disabled" | "readOnly"`
  - `type FieldStatusMap = Record<FieldKey, FieldStatus>`
  - `const FIELD_LABELS: { key: FieldKey; label: string }[]` (rekkefølge og tekster fra Global Constraints)
  - `const FIELD_STATUS_OPTIONS: { value: FieldStatus; label: string }[]`
  - `const DEFAULT_FIELD_STATUS: FieldStatusMap` (alle `editable`)
  - `function ConfigurableField({ status, label, value, children }: { status: FieldStatus; label: string; value: string; children: (disabled: boolean) => ReactNode })` — `readOnly` → `<ReadOnlyField label={label} lines={[value || "–"]} />`, ellers `children(status === "disabled")`.

- [ ] **Step 1:** Lag `ReadOnlyField` med utseendet fra Global Constraints. Linjene rendres som én `P` per linje i en wrapper med fargen.
- [ ] **Step 2:** Bytt `readOnlyField` i `app/internationalPayment/page.tsx` til `<ReadOnlyField label lines>{(content) => <Skeleton …>{content}</Skeleton>}</ReadOnlyField>`. Skeleton-stilene (`--skeleton-delay: 0s`, `animationDuration: 1s`) sendes inn som `lineStyle`.
- [ ] **Step 3:** Lag `fieldStatus.tsx` med typer, konstanter og `ConfigurableField` som over.
- [ ] **Step 4:** Kjør `npx eslint app/shared app/paymentsOverview/fieldStatus.tsx app/internationalPayment && npx tsc --noEmit -p .`. Forventet: ingen nye feil (de 3 eksisterende `set-state-in-effect`-feilene i `internationalPayment/page.tsx` er der fra før).
- [ ] **Step 5:** Åpne `/internationalPayment`, velg en mottaker, åpne «Rediger mottaker» og sjekk at bankinfoen (SWIFT/BIC-kode osv.) ser ut som på skjermbildet: etikett, grå verdi, skeleton ved lasting.
- [ ] **Step 6:** Commit: `git add app/shared app/paymentsOverview/fieldStatus.tsx app/internationalPayment/page.tsx && git commit -m "Delt ReadOnlyField og ConfigurableField for Field status"`

### Task 2: «Field status» i Tools-menyen

**Files:**
- Modify: `app/paymentsOverview/ToolsPanel.tsx`
- Modify: `app/paymentsOverview/page.tsx` (state + `ToolsPanel`-props)
- Modify: `app/paymentsOverview/paymentsOverview.css`

**Interfaces:**
- Consumes: `FieldStatusMap`, `FIELD_LABELS`, `FIELD_STATUS_OPTIONS`, `DEFAULT_FIELD_STATUS` fra Task 1.
- Produces: i `page.tsx`: `fieldStatusEnabled: boolean`, `fieldStatus: FieldStatusMap`, og `activeFieldStatus: FieldStatusMap | undefined` (`fieldStatusEnabled ? fieldStatus : undefined`). I `ToolsPanel`: ny valgfri prop `groups?: ToolsGroup[]` der `type ToolsGroup = { label: string; checked: boolean; onChange: (checked: boolean) => void; selects: ToolsSelect[] }`.

- [ ] **Step 1:** Utvid `ToolsPanel` med `groups`. Hver gruppe er en vanlig svitsjrad; når `checked` er sant vises `selects` under som rader med samme liten `Dropdown` som `selects` bruker i dag (gjenbruk samme render). Gruppene rendres mellom svitsjene og `selects`.
- [ ] **Step 2:** Rykk underradene inn med `padding-left: var(--spacing-large)` (klasse `po-tools__row--sub`), så de leses som del av gruppen.
- [ ] **Step 3:** I `page.tsx`: legg til `fieldStatusEnabled`, `fieldStatus` og `activeFieldStatus`, og send én gruppe «Field status» med én select per `FIELD_LABELS`-element.
- [ ] **Step 4:** Kjør eslint og tsc som i Task 1, Step 4. Forventet: ingen nye feil.
- [ ] **Step 5:** I nettleseren: åpne Tools-menyen, slå på «Field status». Forventet: sju innrykkede rader i rekkefølgen fra Global Constraints, alle med «Editable». Endre én til «Read only», slå svitsjen av og på igjen. Forventet: valget står fortsatt.
- [ ] **Step 6:** Commit: `git commit -am "Field status-svitsj med nedtrekk per felt i Tools-menyen"`

### Task 3: Skjemaene bruker Field status

**Files:**
- Modify: `app/paymentsOverview/EditTransferForm.tsx`
- Modify: `app/paymentsOverview/EditDomesticPaymentForm.tsx`
- Modify: `app/paymentsOverview/EditPaymentForm.tsx`
- Modify: `app/paymentsOverview/page.tsx:1690-1715` (send `fieldStatus={activeFieldStatus}` til alle tre)

**Interfaces:**
- Consumes: `ConfigurableField`, `FieldStatusMap` (Task 1), `activeFieldStatus` (Task 2), `LOCALE` fra `./data`.
- Produces: ny valgfri prop `fieldStatus?: FieldStatusMap` på alle tre skjemaene.

Statusen per felt utledes øverst i hvert skjema:
`const statusOf = (key: FieldKey, legacyDisabled: boolean): FieldStatus => fieldStatus ? fieldStatus[key] : legacyDisabled ? "disabled" : "editable";`
`legacyDisabled` er dagens regel for feltet (f.eks. `readOnly || isFund` for Til konto, `true` for KID, `false` der feltet ikke har noen regel).

Read only-verdier:
- Kontoer: `content.join(" ")` for valgt konto i lista (f.eks. «Felleskonto 1503 24 78612»), tom streng hvis ingen er valgt.
- Beløp: `amount` formatert med `toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })` + « kr» (utland: valutakode foran, som i feltet).
- Valuta: `selectedCurrency?.code`.
- Melding: `message`; KID: `tx.kid`.
- Betalingsdato: `new Date(paymentDate).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" })`.

- [ ] **Step 1:** `EditTransferForm`: pakk Fra konto, Til konto, Beløp, KID, Melding og Betalingsdato i `ConfigurableField`. `disabled` fra `children(disabled)` erstatter dagens `disabled`-uttrykk. Telleren under Melding vises bare når statusen er `editable`. `EditPaymentActions` sin `locked={readOnly}` beholdes uendret (Ikke-mål i spec).
- [ ] **Step 2:** `EditDomesticPaymentForm`: samme for Fra konto, Beløp, KID, Melding, Betalingsdato. Fra konto har egen `FormLabel` utenfor feltet; i read only erstattes hele `<div>` (label + felt) av `ReadOnlyField`, så etiketten ikke står to ganger.
- [ ] **Step 3:** `EditPaymentForm`: samme for Fra konto, Valuta, Beløp, Melding, Betalingsdato. Valuta beholder `!selectedRecipient`-regelen bare når `fieldStatus` er `undefined` eller statusen er `editable`. Beløpshintet (`amountHint`) vises bare når Beløp er `editable`.
- [ ] **Step 4:** Send `fieldStatus={activeFieldStatus}` til alle tre skjemaene i `page.tsx`.
- [ ] **Step 5:** Kjør eslint, tsc og `npx next build`. Forventet: build OK, ingen nye lint-feil.
- [ ] **Step 6: Nettleser — svitsj av.** Åpne Boliglånet: alle felt deaktivert. Åpne DNB Global index: Til konto og KID deaktivert. Som før.
- [ ] **Step 7: Nettleser — svitsj på.** Med alle `editable`: Boliglånet og KID kan redigeres. Sett Beløp til «Read only»: viser «Beløp» og f.eks. «12 345,00 kr» i grått. Sett Melding til «Read only» på en rad uten melding: viser «–». Sett Fra konto til «Disabled»: feltet er deaktivert.
- [ ] **Step 8: Nettleser — bytte med modalen åpen.** Skriv nytt beløp, bytt Beløp til «Read only» og tilbake til «Editable». Forventet: det nye beløpet står fortsatt. Åpne en innenlands betaling: ingen Til konto eller Valuta. Åpne José Martinez (utland): Valuta følger valget.
- [ ] **Step 9: Nettleser — svitsj av igjen.** Med menyvalg på Editable, slå «Field status» av og åpne Boliglånet. Forventet: alt låst igjen.
- [ ] **Step 10:** Commit: `git add app/paymentsOverview && git commit -m "Redigeringsskjemaene følger Field status"`
