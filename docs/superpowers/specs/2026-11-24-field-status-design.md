# Field status i betalingsoversikten — design

## Hvorfor

UX vil simulere ulike varianter av redigeringsskjemaet for betalinger frem i
tid: hvilke felt som kan endres, hvilke som er deaktivert og hvilke som bare
vises som tekst. Det skal kunne veksles fritt i prototypen, uten kodeendring.

## Mål

- Nytt punkt «Field status» i Tools-menyen på `/paymentsOverview`: en svitsj.
- Når svitsjen er på, vises én rad per felt med en liten nedtrekksmeny:
  **Editable**, **Disabled**, **Read only**.
- Feltene: Fra konto, Til konto, Valuta, Beløp, Melding, KID, Betalingsdato.
- Valgene gjelder alle tre redigeringsskjemaene (overføring, innenlands,
  utland), der feltet finnes. Til konto finnes bare på overføring, Valuta bare
  på utland, KID og Melding vises aldri samtidig.
- Med svitsjen på overstyrer valgene alle eksisterende regler (KID alltid
  låst, lån helt låst, til-konto låst for fond).

## Ikke-mål

- Ingen lagring mellom sideinnlastinger (som resten av Tools-menyen).
- Knappene under skjemaet (Lagre, Stopp, Slett) styres ikke av Field status.
  Lånets «locked» på knappene blir som i dag.
- Ingen endring i «Valuta som sendes» sin avhengighet av valgt mottaker når
  feltet står på Editable.

## Tilnærming

Vurdert:

- **A. Felles feltkomponent (valgt).** `ConfigurableField` tar en status og
  rendrer enten feltet som vanlig, feltet med `disabled`, eller read only
  (etikett + grå tekst). Read only-utseendet ligger ett sted, og alle skjema
  oppfører seg likt.
- **B. Hvert skjema løser det selv.** Færre filer, men samme tre-veis logikk
  på ~15 steder som lett glir fra hverandre.

Valgt A fordi alle felt i alle tre skjemaene skal kunne veksles fritt og se
likt ut.

## Design

- **Typer** (`fieldStatus.ts`): `FieldKey` = `fromAccount | toAccount |
  currency | amount | message | kid | paymentDate`, `FieldStatus` =
  `editable | disabled | readOnly`, og en liste med etikett per felt til
  Tools-menyen.
- **Read only** gjenbruker designet fra «Rediger bankinfo» på
  `/internationalPayment` (`readOnlyField`): `FormLabel` uten margin, 4 px
  gap (`--spacing-xx-small`), verdien som `P` i
  `--token-color-text-neutral-alternative`. Flyttes til en delt komponent
  `ReadOnlyField` som begge sider kan bruke; skeleton-delen bli igjen på
  `/internationalPayment`.
- **`ConfigurableField`** (`status`, `label`, `value` som tekst til read only,
  `render(disabled)` for feltet). Read only viser `ReadOnlyField` med
  `value`. Disabled kaller `render(true)`. Editable kaller `render(false)`.
- **Tools-menyen**: `ToolsPanel` får støtte for en svitsj med underrader
  (liten `Dropdown`, samme stil som «Response delay»). Underradene vises bare
  når svitsjen er på.
- **Siden** eier `fieldStatusEnabled` og `fieldStatus: Record<FieldKey,
  FieldStatus>` (alle `editable` som start) og sender
  `fieldStatus` (eller `undefined` når svitsjen er av) til skjemaet som er
  åpent.
- **Skjemaene**: når `fieldStatus` er satt, brukes statusen per felt og de
  gamle reglene ignoreres. Når den er `undefined`, gjelder dagens regler.
  Read only-tekst: kontonavn + nummer for kontoer, formatert beløp, valuta-
  kode, meldingen (eller «–» hvis tom), KID og datoen som «3. desember 2026».

## Overlatt til den som bygger

- Nøyaktig tekst i read only for tomme felt.
- Om underradene i Tools-menyen rykkes inn eller står som egne rader.
