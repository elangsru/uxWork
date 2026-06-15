# growthHacking — oppsett

En enkel konkurranse-app: deltakere logger inn med epost + 4-sifret kode, velger en
aktivitet, gjetter et resultat i prosent, og ser hverandre i en liste. Mens en aktivitet
er **Aktiv** vises kun hvem som har svart (ikke tallene). Når den settes til **Lukket** i
regnearket avsløres fasit og listen rangeres nærmest-først.

All data leses fra og skrives til Google Sheet via en Apps Script web app.

## 1. Deploy Apps Script

1. Åpne regnearket → **Extensions → Apps Script**.
2. Lim inn innholdet fra [`growthHacking-apps-script.gs`](./growthHacking-apps-script.gs).
3. Bytt ut `SHARED_SECRET = "CHANGE_ME"` med en hemmelig streng (f.eks. en tilfeldig UUID).
4. **Deploy → New deployment → Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
5. Kopier `/exec`-URL-en.

## 2. Env-variabler

Legg i `.env.local` (og i Railway):

```
GH_APPS_SCRIPT_URL=<exec-URL fra steg 1.5>
GH_SHARED_SECRET=<samme secret som i scriptet>
```

Disse er **kun server-side** (ingen `NEXT_PUBLIC_`) — secret og URL forlater aldri nettleseren.

## 3. Regneark-struktur

| | A | B | C | D+ (én per deltaker) |
|---|---|---|---|---|
| Rad 2 | `Deltaker` | | | Navn |
| Rad 3 | `Epost` | | | epost |
| Rad 4 | `Kode` | | | 4-sifret kode |
| Rad 5+ | Aktivitetsnavn | Status | Fasit | Deltakerens svar |

- **Status (kolonne B):** tom eller hva som helst = Aktiv (kan endres). `Lukket` = låst + avslørt.
- Nye deltakere legges til som nye kolonner; nye aktiviteter som nye rader. Appen er dynamisk.
- Kun deltakere som finnes i arket kan logge inn (ingen selvregistrering).
