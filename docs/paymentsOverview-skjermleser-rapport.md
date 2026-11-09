# Betalingsoversikt – skjermleser og svaksynte brukere

Gjennomgang av `/paymentsOverview` (2. november 2026). Rapporten beskriver hvordan siden fungerer
for en blind eller svaksynt person som bruker skjermleser, og anbefaler tiltak. **Ingen kode er endret.**

## Metode

- Kodegjennomgang av `app/paymentsOverview/` (page, TransactionRow, GroupCard, GroupingRow,
  ToolsPanel, redigeringsskjemaene og CSS).
- Automatisk test med axe-core 4 i nettleseren, med «Show warnings», «Show unconfirmed eInvoices»
  og «Penger til overs» slått på, og på redigeringsdialogen for Happybytes.
- Uthenting av tilgjengelighetsnavn, roller, overskrifter, landemerker og live-regioner fra DOM-en,
  og sjekk av hvor fokus havner etter dialoger og «Godkjenn».

Ikke testet med faktisk VoiceOver/NVDA/JAWS. Funnene bør bekreftes med ekte skjermleser,
helst sammen med en bruker. Treff fra Next.js sin utviklerverktøylinje er holdt utenfor.

## Sammendrag

Eufemia gir et godt utgangspunkt: språk er satt (`lang="nb-NO"`), brødsmulestien er et navngitt
`nav`, dialogene har riktig rolle og flytter fokus, brytere og radioknapper har ledetekster, og
avatarer er bevisst skjult for å unngå dobbel opplesing. De største hullene er i **selve
betalingslisten**:

1. Informasjon som bare vises med farge (saldo går i minus) finnes ikke for skjermleser.
2. Radene er knapper med andre knapper inni seg – ugyldig struktur som skjermlesere håndterer dårlig.
3. Beløp, kontonummer og saldo leses uten enhet eller forklaring.
4. Siden har nesten ingen struktur å navigere i (én overskrift, ingen `main`).
5. Statusendringer (godkjent, reaktivert, filtrert) annonseres ikke, eller annonseres for mye.

| # | Funn | Alvor | WCAG |
|---|------|-------|------|
| 1 | «Saldo i minus» vises bare som rød kant | Kritisk | 1.4.1, 1.3.1 |
| 2 | Knapper inni klikkbare rader (nested interactive) | Alvorlig | 4.1.2 |
| 3 | Rader som ser klikkbare ut, men ikke gjør noe | Alvorlig | 4.1.2, 3.2 |
| 4 | Knapper uten navn i Autocomplete | Alvorlig | 4.1.2 |
| 5 | Beløp uten valuta, saldo uten ledetekst | Alvorlig | 1.3.1 |
| 6 | Sumraden: to tall uten å si hva de er | Alvorlig | 1.3.1 |
| 7 | Mangler `main` og overskrifter for gruppene | Moderat | 1.3.1, 2.4.1, 2.4.6 |
| 8 | Varsler som `role="alert"`, merkelapper som `role="status"` | Moderat | 4.1.3 |
| 9 | «Godkjenn» og filtrering annonserer ikke resultat | Moderat | 4.1.3 |
| 10 | Dialogtittel «Betaling til» uten mottaker | Moderat | 2.4.6 |
| 11 | Kontonummer med punktum leses som desimaltall | Lav | – |
| 12 | Forkortelser, knapper uten funksjon, engelsk tekst | Lav | 3.1.2, 3.3.2 |
| 13 | Svaksynte: forstørrelse, kontrast, små tekster | Moderat | 1.4.3, 1.4.10, 1.4.11 |

---

## Funn og anbefalinger

### 1. «Saldo i minus» vises bare med farge – kritisk

Når «Penger til overs» er på, får hver rad en 5 px rød eller grønn stripe langs venstre kant
(`.row-balance-negative::before` i CSS). Det er den eneste måten siden forteller at en betaling
kan føre til overtrekk. `balanceAfter` brukes kun til CSS-klassen og blir aldri tekst.
En skjermleserbruker får **ingen** informasjon om dette, og en svaksynt bruker med fargesvakhet
eller høy forstørrelse ser det knapt. Hjelpeteksten sier «Betalinger merket med rødt…», som
forutsetter at man ser farge.

I testen var ASK, DNB Global index og Tibber merket røde – uten noe i tilgjengelighetstreet.

**Anbefaling**
- Legg til tekst i raden når saldoen går i minus, f.eks. synlig «Saldo etter: −1 234,00» eller
  et ikon med tekst «Kan gi overtrekk». Minimum: en `.dnb-sr-only`-tekst i raden.
- Vurder å vise saldo etter trekk som tall på alle rader når bryteren er på – da blir det nyttig
  for alle, ikke bare som farge.
- Skriv om hjelpeteksten så den ikke bare viser til «rødt».

### 2. Knapper inni klikkbare rader – alvorlig

Hver betalingsrad er `List.Item.Action` (rolle `button`). Rader med varsel eller ubekreftet
eFaktura har i tillegg «Rediger», «Godkjenn»/«Reaktiver» og et helt `<form>` inni seg. axe melder
`nested-interactive` på 6 steder.

Konsekvens: Mange skjermlesere leser en knapp som én flat tekst. Hele raden blir da én lang knapp
– «11. november 2026, Happybytes, AvtaleGiro, 299,00, Betalingen ble stoppet fordi …, Rediger,
Reaktiver, knapp» – og de indre knappene kan være vanskelige eller umulige å nå i bla-modus. Det
er også uklart hva Enter på raden gjør i forhold til «Rediger».

**Anbefaling**
- La raden selv inneholde én handling (åpne detaljer), og flytt varsel og handlingsknapper ut av
  knappeelementet – f.eks. som søsken under raden i samme `li`, eller bruk `List.Item.Basic`
  med en tydelig lenke/knapp for «Vis detaljer» og egne knapper ved siden av.
- Alternativt: Gjør hovedteksten (mottaker) til en lenke/knapp, og la resten av raden være vanlig
  innhold. Klikkflaten kan fortsatt dekke hele raden med CSS for seende brukere.
- «Rediger» og et klikk på raden gjør det samme i dag; vurder om én av dem kan fjernes.

### 3. Rader som ser klikkbare ut, men ikke gjør noe – alvorlig

`openPayment` i `page.tsx` åpner bare dialogen for åtte bestemte id-er. Alle andre rader (f.eks.
Asker Kommune, Fremtind) er fortsatt knapper med chevron, men ingenting skjer ved aktivering.
En skjermleserbruker hører «knapp», trykker, og får ingen tilbakemelding.

**Anbefaling**
- Gi rader uten detaljvisning en ikke-interaktiv rad (`List.Item.Basic`), eller la alle rader åpne
  en visning. Prototypen bør ikke annonsere handlinger som ikke finnes.

### 4. Knapper uten navn – alvorlig

`Autocomplete` med `submitButtonTitle=""` gir nedtrekksknappen tomt navn (axe: `button-name`).
Gjelder «Belastningskonto», «Fakturaeier», «Foreslått belastningskonto» og «Fra konto» i
redigeringsdialogen. Skjermleseren sier bare «knapp».

**Anbefaling**
- Fjern `submitButtonTitle=""` (Eufemia har en norsk standardtekst) eller sett en tekst som
  «Vis kontoer».

### 5. Beløp uten valuta, saldo uten ledetekst – alvorlig

- Radbeløp vises som «500,00» uten «kr». Visuelt fungerer det i kontekst; opplest blir det
  «fem hundre komma null null» uten enhet.
- Saldo i gruppehodet («Felleskonto 1503.24.78612 – 42 500,00») har ingen ledetekst. Det er
  ikke opplagt at tallet er saldo og ikke en sum.
- Utenlandsbetaling leses «ca kr 5 234,98, EUR 500,00» – forståelig, men rekkefølgen gjør at
  tilnærmet beløp kommer før det faktiske.

**Anbefaling**
- Legg til skjult tekst: «500,00 kroner», «Saldo 42 500,00 kroner». Eufemias `NumberFormat`
  med `currency` og `srLabel` løser dette konsekvent.
- For valutarader: les det faktiske beløpet først («500 euro, cirka 5 234,98 kroner»).

### 6. Sumraden: to tall uten å si hva de er – alvorlig

Med saldo på leses sumraden som «Sum 4 transaksjoner (2 ubekreftet), Penger til overs
1. desember, 6 244,00, −5 455,00». Det visuelle oppsettet kobler ledetekst og tall i hver sin
linje, men i DOM-en kommer begge ledetekstene før begge tallene. Det er ikke mulig å vite at
−5 455,00 hører til «Penger til overs», eller at det betyr overtrekk.

**Anbefaling**
- Strukturer hvert tall med sin egen ledetekst i DOM (to rader, eller en `dl`), f.eks.
  «Sum: 6 244,00 kroner» og «Penger til overs 1. desember: minus 5 455,00 kroner».
- Sørg for at minus leses som «minus» (U+2212 leses ulikt av skjermlesere; `NumberFormat`
  håndterer dette).

### 7. Mangler struktur å navigere i – moderat

- Ingen `main`-landemerke på siden (axe: `landmark-one-main`, `region`). Innholdet ligger i
  `div.po-page`. Bare lastevisningen bruker `<main>`.
- Eneste overskrift er H1 «Betalingsoversikt». Gruppene (konto eller dato) er knapper i et
  trekkspill, ikke overskrifter. En skjermleserbruker kan ikke hoppe mellom kontoer med
  overskriftsnavigasjon (H-tasten), som er den vanligste måten å skumlese en side på.
- Toppfeltet er ikke `header`.

**Anbefaling**
- Pakk innholdet i `<main>` og toppfeltet i `<header>`.
- Gi hver gruppe en H2 (f.eks. via `List.Item.Accordion` med `headingLevel` hvis tilgjengelig,
  eller en `H2` i headeren), og vurder skjulte H2-er for «Filter» og «Betalinger».
- Vurder `aria-label` på listen, f.eks. «Betalinger fra Felleskonto».

### 8. For mange live-regioner – moderat

- Varslene på radene (`FormStatus state="warning"`) får `role="alert"`. Når «Show warnings» slås
  på, eller listen re-rendres (filter, gruppering), kan skjermleseren lese opp alle varslene på
  én gang og avbryte det brukeren holdt på med.
- Merkelappene («AvtaleGiro», «eFaktura») og flagget («Spania») ligger i `role="status"`.
  De er statisk innhold og bør ikke være live-regioner.

**Anbefaling**
- Bruk varsel uten live-region når det vises sammen med innholdet ved lasting (FormStatus har
  `role`/`aria-live`-kontroll, eller bruk et vanlig element med ikon og tekst).
- Bruk `role="alert"` kun for varsler som oppstår som følge av en handling.
- Sjekk `Badge`-props for å fjerne `status`-rollen på rene merkelapper.

### 9. Handlinger og filtrering annonserer ikke resultat – moderat

- **Godkjenn:** knappen viser spinner i 5 sekunder, deretter skjer endringen stille. Fokus står på
  knappen. Ingen kunngjøring av «eFaktura godkjent», og ingen opplest «venter» underveis.
- **Reaktiver:** dialogen «Reaktivert» fungerer bra (alertdialog, fokus tilbake til knappen),
  men raden står fortsatt som stoppet etterpå. For en skjermleserbruker er det motstridende:
  dialogen sier reaktivert, raden sier stoppet.
- **Filter, dato, konto, typeknapper:** listen endres uten kunngjøring. Brukeren vet ikke om
  filteret ga 0 eller 12 treff uten å lete gjennom listen.
- **Hent flere:** skeleton setter `aria-busy`, men nye fakturaeiere annonseres ikke.

**Anbefaling**
- En felles, skjult `aria-live="polite"`-region som melder «3 betalinger vises», «eFaktura fra
  Asker Kommune godkjent», «2 nye fakturaeiere hentet».
- Etter godkjenning: flytt fokus til en logisk plass (neste rad eller gruppen) hvis raden endres.
- Oppdater radens tilstand etter reaktivering, så dialog og liste sier det samme.

### 10. Dialogtittel «Betaling til» – moderat

Redigeringsdialogen får tittelen «Betaling til» (eller «Overføring») uten mottaker. Det er det
skjermleseren sier når dialogen åpnes: «Betaling til, dialog». Fokus settes på dialogen, og
lukking returnerer fokus til raden – det er bra.

**Anbefaling**
- Ta med mottaker: «Betaling til Happybytes», «Overføring til Sparing bryllup».
- Felt som er låst (KID er `disabled`) bør forklares, f.eks. «KID kan ikke endres for AvtaleGiro»
  koblet med `aria-describedby`. Ett felt i dialogen har ingen ledetekst (`readonly`-input uten
  navn – trolig datofeltet; bør bekreftes).

### 11. Kontonummer leses som tall – lav

«1503.24.78612» leses av mange skjermlesere som «ett tusen fem hundre og tre komma to fire …».

**Anbefaling**
- Vis kontonummer med mellomrom (`1503 24 78612`, som brukes andre steder i prototypen) eller
  gi en `aria-label` som leses siffer for siffer.

### 12. Mindre ting – lav

- Datosnarveier «Neste 30 dg», «Neste 7 dg» leses som «d g». Skriv «dager».
- «Overfør» og «Meg» er knapper uten funksjon; «Meg» annonserer ikke at den åpner noe
  (`aria-expanded`/`aria-haspopup` når den får meny). Avataren «E» har `hasLabel`, men ingen
  ledetekst – fint hvis den er dekorativ, men da bør den ha `aria-hidden`.
- Bryteren «Penger til overs» har skjult ledetekst og en synlig `TermDefinition` med samme tekst
  ved siden av. Sjekk at skjermleseren ikke leser «Penger til overs» to ganger, og at forklaringen
  er nåbar med tastatur.
- Type-ikonene (sparing, lån, fond) er skjult for skjermleser. Mottakernavnet dekker det oftest,
  men «ASK» og «DNB Global index» sier ikke at det er en overføring til sparing/fond.
- Verktøypanelet er engelsk på en norsk side, er ikke en dialog og flytter ikke fokus når det
  åpnes. Det er et demoverktøy og ikke synlig for sluttbruker, så lav prioritet – men merk
  `lang="en"` på panelet om det beholdes.

### 13. Svaksynte brukere (forstørrelse, kontrast) – moderat

Ikke målt fullt ut i denne gjennomgangen. Observasjoner fra koden:

- **Fargebasert informasjon:** se funn 1. Rødt beløp i sumraden har minustegn, det er bra.
- **Liten tekst:** datolinjen (overline) og «ca kr …» bruker `x-small`. Ved 200 % zoom er det
  greit, men for brukere med forstørrelsesprogram som zoomer inn på en del av skjermen, blir
  forholdet mellom beløp (høyrekant) og mottaker (venstrekant) langt. Vurder å holde viktig
  informasjon samlet.
- **Reflow (320 px / 400 % zoom):** toppfeltet har fast høyde 80 px, og verktøypanelet har
  `min-width: 440px` (demoverktøy). Test siden på 320 px bredde.
- **Kontrast:** Eufemia-tokens er generelt i orden. Kontroller den 5 px saldostripen
  (ikke-tekstkontrast 3:1, 1.4.11) og dark mode-overstyringene for DatePicker.
- **Fokusmarkering:** Eufemia har tydelig fokusring. Klikkbare rader med egne CSS-overstyringer
  (`outline` i `paymentsOverview.css`) bør testes med tastatur.

---

## Det som fungerer bra

- `lang="nb-NO"` på `html`.
- Brødsmulestien er `nav` med navnet «Sidehierarki».
- Avatarer er bevisst `aria-hidden`, så mottakernavnet ikke leses to ganger.
- Trekkspillgruppene har `aria-expanded`.
- Gruppering bruker `Radio.Group` med koblet ledetekst; «Lukk alle/Åpne alle» er en vanlig knapp
  med tekst.
- Dialogene er Eufemia-dialoger: `aria-modal`, `aria-labelledby`, fokus flyttes inn og tilbake.
- «Reaktivert»-kvitteringen er en `alertdialog` og returnerer fokus til knappen.
- Brytere i verktøypanelet har ledetekst (`labelSrOnly`).
- Skeleton ved «Hent flere» setter `aria-busy`.

## Foreslått rekkefølge

1. Tekst for «saldo i minus» (funn 1) og navn på Autocomplete-knappene (funn 4) – små endringer,
   stor effekt.
2. Valuta og ledetekster på beløp og sumrad (funn 5, 6), kontonummerformat (11).
3. `main` og H2 per gruppe (funn 7).
4. Omstrukturer radene så handlingsknapper ikke ligger inni radknappen (funn 2, 3).
5. Live-region for resultater og handlinger, og opprydding i `alert`/`status` (funn 8, 9).
6. Test med VoiceOver (macOS/iOS) og NVDA, og helst med en skjermleserbruker.
