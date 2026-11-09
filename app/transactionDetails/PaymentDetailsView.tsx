"use client";

import { useState, useEffect, type ReactNode, type CSSProperties } from "react";
import {
  Button, Icon, Switch, Dropdown, List, TermDefinition, Tag,
  Avatar, Badge, CountryFlag, Anchor, Tooltip, Breadcrumb, Dialog, Autocomplete, FormStatus,
} from "@dnb/eufemia/components";
import Theme from "@dnb/eufemia/shared/Theme";
import { formatNumber } from "@dnb/eufemia/components/number-format/NumberUtils";
import { H1, H2, H3, P, Span, Hr } from "@dnb/eufemia/elements";
import { filter, close, check, swap, account_medium, savings_account_medium, account_card_medium, card_medium, wallet_medium, coins_1_medium, location_medium, web_medium, history_medium, information_circled_medium, office_buildings_medium, phone_medium, bubble_medium, kid_number_medium, copy, ainvoice_medium, einvoice_medium, attachment_medium, file_pdf_medium, upload, download, paperclip_medium, loan_medium, restaurant_medium, shopping_cart_medium, hanger_medium, travel_medium, bus_medium, car_1_medium, bandage_medium, baby_medium, dog_medium, house_1_medium, heart_rate_medium, laptop_medium, recurring_medium, shield_medium, hand_money_medium, house_value_medium } from "@dnb/eufemia/icons";
import * as EufemiaIcons from "@dnb/eufemia/icons";
import type { PaymentRecord } from "@/lib/payments";

/* ── Avatar-størrelser fra Eufemia ───────────────────────────────── */
/* Eufemia støtter nøyaktig disse fire på Avatar. Boksmålene er avatarens
   egne tokens (--avatar-width--*), som logo- og ikonvariantene må matche for
   at radene skal ligge på samme venstrekant uansett valgt størrelse. */
type AvatarSize = "small" | "medium" | "large" | "x-large";
const AVATAR_BOX: Record<AvatarSize, string> = {
  small: "1.5rem",
  medium: "2rem",
  large: "4rem",
  "x-large": "5rem",
};
/* Ikoner utenfor Avatar (gebyr/renter) har ingen auto-size å arve, så de
   følger avatarens ikon-tokens (--avatar-icon-size--*) manuelt. Eufemias
   Icon har ingen 1.25rem-variant, så medium/small bruker nærmeste steg. */
const AVATAR_ICON_SIZE: Record<AvatarSize, "small" | "medium" | "large" | "x-large"> = {
  small: "small",
  medium: "medium",
  large: "x-large",
  "x-large": "x-large",
};
/* Flagget i Badge-en har ingen kobling til avataren i Eufemia – Badge har
   ingen size-prop, og variant="content" styles av oss. Flagget må derfor
   få størrelse eksplisitt. CountryFlag-tokens (--size) er 0.5 / 0.75 / 1 /
   1.5 / 2 / 2.5rem. Regelen er ett steg ned fra avatarens eget navn:
   medium-avatar → small-flagg, large → medium, x-large → large. Gir 50 %
   av avatarbredden på de to små og ~38 % på de to store, der et flagg på
   halve avataren ble for dominerende. */
const AVATAR_FLAG_SIZE: Record<AvatarSize, "x-small" | "small" | "medium" | "large"> = {
  small: "x-small",
  medium: "small",
  large: "medium",
  "x-large": "large",
};

/* ── Land → ISO-kode for CountryFlag ─────────────────────────────── */
const COUNTRY_ISO: Record<string, string> = {
  norge: "NO", sverige: "SE", danmark: "DK", finland: "FI",
  island: "IS", spania: "ES", tyskland: "DE", frankrike: "FR",
  storbritannia: "GB", nederland: "NL", italia: "IT", polen: "PL", usa: "US",
};

/* Felt som rendres i kortet og derfor ikke i detaljlisten */
const BENEFICIARY_LABELS =
  /^(logo\/avatar|logourl|mottaker navn|mottaker navn reservert|mottaker konto|mottaker konto ?type|mottaker land|mottaker adresse 1|mottaker adresse 2|mottaker postnr|mottaker sted\/by|mottaker web|mottaker orgnr|mottaker beskrivelse|mottaker telefon|telefon|orgnr|org\.?nr\.?|organisasjonsnummer|melding|kid|pengebruk tag|dato|transaksjonsdato|reservert dato|reservasjonsdato|bokf[øo]rt dato|bokf[øo]ringsdato|rentedato|beløp|beløp nok|nok beløp|beløp valuta|valuta beløp|valutabeløp|vekslingskurs|valutasort|res(?:erv|v)ert melding|kontonavn|fra kontonavn|kontotype|konto type|fra konto type|kontonummer|fra kontonummer|fra konto|kortnavn|fra kortnavn|kortnummer|kortnummer pan|kortnummer\/pan|fra kortnummer\/pan|fra kortnummer pan|pan|kortnettverk|fra kortnettverk|kortnettverk logo|fra kortnettverk logo|digital wallet|digital wallet logo|klokkeslett|pengebruk sub|pengebruk main|pengebruk reservert|sas eurobonuspoeng|eurobonus poeng|sas bonus|betalingsprodukt|kvittering|efaktura|efaktura-vedlegg|betalingsbekreftelse|pris|gebyr|pris\/gebyr|lån avdrag|lån renter|kortreklamasjon(er)?|transaksjonsid|betalingsid|fra milj[øo]|pengebruk icon)$/i;

function fieldValue(record: PaymentRecord | undefined, re: RegExp): string {
  return record?.fields.find((f) => re.test(f.label.trim()))?.value ?? "";
}

function fieldDisplay(record: PaymentRecord | undefined, re: RegExp, showNames: boolean): string {
  const field = record?.fields.find((f) => re.test(f.label.trim()));
  if (!field) return "";
  return showNames ? `{${field.label}}` : field.value;
}

/** Formaterer et tall fra arket med norsk tusenskille via Eufemias
 *  formatNumber: «12345,78» → «12 345,78», «-1800» → «−1 800,00».
 *  Arket bruker komma som desimaltegn og kan ha mellomrom. Beløp får minst
 *  to desimaler; flere beholdes (vekslingskurs har ofte fire). Verdier som
 *  ikke er tall vises uendret. */
function formatNo(raw: string, minDecimals = 2): string {
  const n = raw.trim().replace(/[\s\u00a0\u202f]/g, "").replace(/^\u2212/, "-").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(n)) return raw;
  const decimals = Math.max(minDecimals, n.split(".")[1]?.length ?? 0);
  return formatNumber(n, { locale: "nb-NO", decimals });
}

/** Sant når verdien i arket er en lenke (http://, https:// eller //) og ikke
 *  et filnavn under /public. Brukes både av logoSrc og av visningen, som
 *  rammer lenkelogoer rundt slik som avataren. */
function isLogoLink(value: string): boolean {
  return /^(https?:)?\/\//i.test(value.trim());
}

/** Løser en logoverdi fra regnearket til en sti under /public.
 *  Godtar filnavn ("visa", "visa.svg", "Apple Pay", "Rema"), ferdig sti
 *  ("/wallet/vipps.svg") eller full URL – URL-er og absolutte stier brukes som de er. */
function logoSrc(value: string, folder: "kortnettverk" | "wallet" | "merchants"): string {
  const raw = value.trim();
  if (!raw) return "";
  if (isLogoLink(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  // merchants-filene har stor forbokstav ("Rema.svg"), i motsetning til
  // kortnettverk/wallet som er små. Railway kjører Linux med case-sensitivt
  // filsystem, så her må vi beholde casingen fra arket.
  const stripped = raw.replace(/\s+/g, "");
  const file = folder === "merchants" ? stripped : stripped.toLowerCase();
  return `/${folder}/${/\.(svg|png|jpe?g|webp)$/i.test(file) ? file : `${file}.svg`}`;
}

/* Alle betalingslogoer (kortnettverk og lommebøker) vises 24px høye med
   naturlig bredde. */
const PAYMENT_LOGO_HEIGHT = 24;
/* List.Cell.End har 4px padding-top, men også min-height 32px. Så lenge
   logoen + paddingen er under 32px, midtstiller cellen den selv. Over
   28px logohøyde må paddingen kompenseres med -4px marginTop. */
const LOCAL_LOGO_STYLE: CSSProperties = {
  display: "block", height: PAYMENT_LOGO_HEIGHT, width: "auto",
};

/* Firmalogoer fra Eufemias logokatalog (@eufemia/logos), servert fra den
   versjonerte CDN-en: https://assets.eufemia.dnb.no/logos/manifest.json.
   Nøkkelen er verdien i arket. Katalogen har egne light/dark-varianter.
   Mastercard står bevisst utenfor: katalogens logo har «mastercard»-
   ordmerket, og vi vil bare ha sirklene. Den faller derfor tilbake til
   public/kortnettverk/mastercard.svg, som bare er sirklene.

   Katalogfilene er kvadratiske lerreter med gjennomsiktig luft rundt
   logoen. box er logoens synlige flate målt i 192px-filene (@3x, union av
   light og dark): [x0, y0, x1, y1]. Lerretet skaleres så den flaten blir
   PAYMENT_LOGO_HEIGHT høy, og negativ marg fjerner luften — filen selv er uendret.
   Versjonen er låst (v1.6.0, immutable), så målene står seg. */
const EUFEMIA_LOGOS_BASE = "https://assets.eufemia.dnb.no/logos/v1.6.0";
const EUFEMIA_LOGO_CANVAS = 192;
const EUFEMIA_LOGOS: Record<string, { slug: string; box: [number, number, number, number] }> = {
  click2pay: { slug: "clicktopay", box: [35, 55, 153, 130] },
  visa:      { slug: "visa",       box: [0, 62, 192, 128] },
  bankaxept: { slug: "bankaxept",  box: [0, 38, 191, 154] },
  applepay:  { slug: "apple-pay",  box: [3, 35, 189, 155] },
  vipps:     { slug: "vipps",      box: [0, 72, 192, 121] },
};
function eufemiaLogo(value: string, dark: boolean) {
  const entry = EUFEMIA_LOGOS[value.trim().toLowerCase().replace(/\s+/g, "")];
  if (!entry) return null;
  const [x0, y0, x1, y1] = entry.box;
  const k = PAYMENT_LOGO_HEIGHT / (y1 - y0);
  const size = EUFEMIA_LOGO_CANVAS * k;
  const file = (scale: number) => `${EUFEMIA_LOGOS_BASE}/${entry.slug}/logo-${dark ? "dark" : "light"}-64pt@${scale}x.png`;
  return {
    src: file(1),
    srcSet: `${file(2)} 2x, ${file(3)} 3x`,
    width: size,
    height: size,
    style: {
      display: "block",
      maxWidth: "none",
      marginTop: -y0 * k,
      marginBottom: -(EUFEMIA_LOGO_CANVAS - y1) * k,
      marginLeft: -x0 * k,
      marginRight: -(EUFEMIA_LOGO_CANVAS - x1) * k,
    } satisfies CSSProperties,
  };
}

/** Formaterer DD.MM.YYYY → "15. januar 2026" (norsk) */
function formatDateNo(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return raw;
  const months = ["januar","februar","mars","april","mai","juni",
                  "juli","august","september","oktober","november","desember"];
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = m[3];
  return `${day}. ${months[month]} ${year}`;
}

function accountIcon(type: string) {
  return /sparekonto/i.test(type)          ? savings_account_medium
    : /lånekonto/i.test(type)              ? loan_medium
    : /mastercard|visa|kort/i.test(type)   ? account_card_medium
    : account_medium;
}

function getMottakerKontoIcon(type: string) {
  return /sparekonto/i.test(type) ? savings_account_medium
    : /lån/i.test(type)           ? house_value_medium
    : account_medium;
}

function lookupEufemiaIcon(name: string): unknown {
  const icons = EufemiaIcons as Record<string, unknown>;
  const mediumName = name.endsWith("_medium") ? name : `${name}_medium`;
  return icons[mediumName] ?? icons[name] ?? null;
}

function getPengebrukIcon(category: string) {
  const c = category.toLowerCase();
  if (/restaurant|kafe|kaf[eé]|spisested|servering|mat og drikke/.test(c)) return restaurant_medium;
  if (/dagligvar|matvare|kolonial|supermarked|kiosk|nærbutikk/.test(c)) return shopping_cart_medium;
  if (/klær|sko|klede|fashion|mote/.test(c)) return hanger_medium;
  if (/fly|hotell|ferie|cruise|overnatting/.test(c)) return travel_medium;
  if (/kollektiv|buss|tog|trikk|t-bane|transport/.test(c)) return bus_medium;
  if (/bil|parkering|bensin|drivstoff|verksted/.test(c)) return car_1_medium;
  if (/helse|apotek|lege|tannlege|medisin|velvære/.test(c)) return bandage_medium;
  if (/barn|baby|barnehage/.test(c)) return baby_medium;
  if (/dyr|hund|katt|veterin/.test(c)) return dog_medium;
  if (/bolig|hus|husleie|strøm|internett|hjem/.test(c)) return house_1_medium;
  if (/sport|trening|gym|fritid/.test(c)) return heart_rate_medium;
  if (/elektronikk|data|mobil|tech/.test(c)) return laptop_medium;
  if (/abonnement|streaming|media|avis/.test(c)) return recurring_medium;
  if (/forsikring/.test(c)) return shield_medium;
  return coins_1_medium;
}

/* ─────────────────────────────────────────────────────────────────── */

export default function PaymentDetailsView({ payments }: { payments: PaymentRecord[] }) {
  const [selectedType, setSelectedType] = useState(
    payments.find((p) => /varekjøp.*bank/i.test(p.type))?.type ?? payments[0]?.type ?? ""
  );
  const [darkMode, setDarkMode]         = useState(false);
  // Samme bryter og sessionStorage-nøkkel som internationalPayment, så valget
  // følger med mellom sidene. Default er skjemabredden derfra (488px).
  const [fullWidth, setFullWidth]       = useState(false);
  const [toolsOpen, setToolsOpen]       = useState(false);
  const [showReserved, setShowReserved] = useState(false);
  const [hideFromSpending, setHideFromSpending] = useState(false);
  const [showSasBonus, setShowSasBonus]         = useState(true);
  const [showFieldNames, setShowFieldNames]     = useState(false);
  const [showLogo, setShowLogo]                 = useState(false);
  const [avatarSize, setAvatarSize]             = useState<AvatarSize>("medium");
  const [hydrated, setHydrated]         = useState(false);
  const [kidCopied, setKidCopied] = useState(false);
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  /* Radene under Pengebruk er ekte knapper (role=button, tabIndex=0) og må
     gjøre noe når de aktiveres — ellers lover de en handling de ikke har.
     Holder handlingsnavnet, ikke en boolean, så dialogen kan gjenbrukes. */
  const [notImplemented, setNotImplemented] = useState<string | null>(null);

  useEffect(() => {
    setDarkMode(sessionStorage.getItem("darkMode") === "true");
    setFullWidth(sessionStorage.getItem("fullWidth") === "true");
    setToolsOpen(sessionStorage.getItem("toolsOpen") === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("darkMode", String(darkMode));
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("fullWidth", String(fullWidth));
  }, [fullWidth, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("toolsOpen", String(toolsOpen));
  }, [toolsOpen, hydrated]);

  /* ── Datauttrekk ───────────────────────────────────────────────── */
  const selected         = payments.find((p) => p.type === selectedType);
  const fd               = (re: RegExp) => fieldDisplay(selected, re, showFieldNames);
  // Som fd, men tallet formateres med tusenskille (feltnavn-visning urørt).
  const fdNo             = (re: RegExp, minDecimals?: number) => showFieldNames ? fd(re) : formatNo(fd(re), minDecimals);
  const nameReserved     = fieldValue(selected, /^mottaker navn reservert$/i);
  const useReservedName  = showReserved && Boolean(nameReserved);
  const nameRe           = useReservedName ? /^mottaker navn reservert$/i : /^mottaker navn$/i;
  const name             = useReservedName
    ? nameReserved
    : fieldValue(selected, /^mottaker navn$/i) || fieldValue(selected, /^mottaker$/i);
  const account          = fieldValue(selected, /^mottaker konto/i);
  const mottakerKontoType = fieldValue(selected, /^mottaker konto ?type$/i);
  const country          = fieldValue(selected, /^mottaker land$/i);
  const currencyCode     = fieldValue(selected, /^valutasort$/i);
  const hasCurrency      = currencyCode.trim().length > 0;
  const flagIso          = COUNTRY_ISO[country.trim().toLowerCase()];
  const showFlag         = hasCurrency && Boolean(flagIso);
  const initial          = name.trim().charAt(0).toUpperCase() || "?";
  const hasBeneficiary   = Boolean(name.trim() || account);
  const isAvtalegiro     = /avtalegiro/i.test(selectedType);
  const isEfaktura       = /efaktura/i.test(selectedType);
  const isOverforing     = /overf[øo]ring|boliglån/i.test(selectedType);
  const isGebyrRenter    = /gebyr og renter/i.test(selectedType);
  const tilLabel         = isGebyrRenter ? "Innbetalt" : isOverforing ? "Overført til" : "Betalt til";
  const fraLabel         = isOverforing ? "Overført fra" : "Betalt fra";
  const logoUrl          = fieldValue(selected, /^logourl$/i);
  /* Logoen vises alltid til venstre for firmanavnet. Tre tilstander:
     navn ("Netflix") → filen under /merchants i kvadratisk boks, lenke →
     samme bilde i rundt avatarformat med subtil strek, tomt → placeholder
     (ikon eller bokstavavatar) lenger ned. */
  const merchantLogo     = showLogo ? logoSrc(logoUrl, "merchants") : "";
  /* Feltet Logo/Avatar i arket velger hvilket merke raden får. "Avtar" er en
     skrivefeil i arket, så regexen godtar den også. Andre verdier ("Icon",
     tomt) faller til dagens logikk lenger ned. */
  const logoAvatarMode   = fieldValue(selected, /^logo\/avatar$/i).trim();
  const wantsLogo        = /^logo$/i.test(logoAvatarMode);
  const wantsAvatar      = /^av(a)?tar$/i.test(logoAvatarMode);

  const nokAmount        = fieldValue(selected, /^(beløp|beløp nok|nok beløp)$/i);
  const currencyAmount   = fieldValue(selected, /^(beløp valuta|valuta beløp|valutabeløp)$/i);
  const exchangeRate     = fieldValue(selected, /^(vekslingskurs)$/i);
  // Valutakoder (ISO 4217) starter med landkoden; euro har EU-flagget.
  const currencyFlagIso  = /^eur$/i.test(currencyCode.trim()) ? "EU" : currencyCode.trim().slice(0, 2).toUpperCase();
  const sasPoints        = fieldValue(selected, /^(sas eurobonuspoeng|eurobonus poeng|sas bonus)$/i);
  const betalingsprodukt = fieldValue(selected, /^betalingsprodukt$/i);
  const prisGebyr        = fieldValue(selected, /^(pris|gebyr|pris\/gebyr)$/i);
  const avdrag           = fieldValue(selected, /^lån avdrag$/i);
  const renter           = fieldValue(selected, /^lån renter$/i);
  const hasLoanBreakdown = Boolean(avdrag || renter);
  const transaksjonsDato = fieldValue(selected, /^transaksjonsdato$/i);
  const reservertDate    = fieldValue(selected, /^(reservert dato|reservasjonsdato)$/i);
  const bokfortDato      = fieldValue(selected, /^(bokf[øo]rt dato|bokf[øo]ringsdato)$/i);
  const rentedato        = fieldValue(selected, /^rentedato$/i);
  const sectionDate      = formatDateNo(showReserved && reservertDate ? reservertDate : transaksjonsDato);
  const klokkeslett      = fieldValue(selected, /^klokkeslett$/i);
  const sectionDateTime  = klokkeslett ? `${sectionDate} - ${klokkeslett}` : sectionDate;
  /* Datolinja under H1. I «vis feltnavn»-modus vises feltnavnene i stedet for
     de formaterte verdiene, derfor to varianter. */
  const dateTimeDisplay  = showFieldNames
    ? `${fd(showReserved && reservertDate ? /^(reservert dato|reservasjonsdato)$/i : /^transaksjonsdato$/i)}${klokkeslett ? ` - ${fd(/^klokkeslett$/i)}` : ""}`
    : sectionDateTime;

  const melding          = fieldValue(selected, /^melding$/i);
  const kid              = fieldValue(selected, /^kid$/i);

  const address1         = fieldValue(selected, /^mottaker adresse 1$/i);
  const address2         = fieldValue(selected, /^mottaker adresse 2$/i);
  const postalCode       = fieldValue(selected, /^mottaker postnr$/i);
  const city             = fieldValue(selected, /^mottaker sted\/by$/i);
  const website          = fieldValue(selected, /^mottaker web$/i);
  const orgNr            = fieldValue(selected, /^(mottaker orgnr|orgnr|org\.?nr\.?|organisasjonsnummer)$/i);
  const phone            = fieldValue(selected, /^(mottaker telefon|telefon)$/i);
  const kortreklamasjoner = fieldValue(selected, /^kortreklamasjon(er)?$/i);
  const transactionId     = fieldValue(selected, /^transaksjonsid$/i);
  const paymentId         = fieldValue(selected, /^betalingsid$/i);
  const mottakerBeskrivelse = fieldValue(selected, /^mottaker beskrivelse$/i);
  const termDefRecord = payments.find((p) => /^termdefinition$/i.test(p.type));
  /* Ordforklaringen hentes fra TermDefinition-kolonnen i arket. `fallbackDef`
     brukes når cellen er tom, så en forklaring kan defineres i koden – fyller
     du inn cellen i arket, vinner arket. */
  const td = (label: string, children: ReactNode = label, fallbackDef?: string): ReactNode => {
    const def = termDefRecord?.fields.find((f) => f.label === label)?.value || fallbackDef;
    return def ? <TermDefinition content={def}>{children}</TermDefinition> : children;
  };
  const kvittering       = fieldValue(selected, /^kvittering$/i);
  const efaktura         = fieldValue(selected, /^(efaktura|efaktura-vedlegg)$/i);
  const betalingsbekreftelse = fieldValue(selected, /^betalingsbekreftelse$/i);
  const hasVedlegg       = Boolean(kvittering || efaktura || betalingsbekreftelse);
  const postalLine       = [postalCode, city].filter(Boolean).join(" ");
  const hasStreetAddress = Boolean(address1 || address2 || postalLine);
  const hasAddress       = (hasStreetAddress || country) && hasBeneficiary;

  const fromAccountName   = fieldValue(selected, /^(kontonavn|fra kontonavn)$/i);
  const fromAccountType   = fieldValue(selected, /^(kontotype|konto type|fra konto type)$/i);
  const fromAccountNumber = fieldValue(selected, /^(kontonummer|fra kontonummer|fra konto)$/i);
  const hasFromAccount    = Boolean(fromAccountName || fromAccountType || fromAccountNumber);
  const fromAccountIcon   = accountIcon(fromAccountType);
  const mottakerKontoIcon = getMottakerKontoIcon(mottakerKontoType);

  const cardName    = fieldValue(selected, /^(kortnavn|fra kortnavn)$/i);
  const cardPan          = fieldValue(selected, /^(kortnummer pan|kortnummer\/pan|fra kortnummer\/pan|fra kortnummer pan|kortnummer|pan)$/i);
  const fraMiljo         = fieldValue(selected, /^fra milj[øo]$/i);
  const cardNetwork      = fieldValue(selected, /^(kortnettverk|fra kortnettverk)$/i);
  const cardNetworkLogo  = fieldValue(selected, /^(kortnettverk logo|fra kortnettverk logo)$/i);
  const cardNetworkLogoEufemia = eufemiaLogo(cardNetworkLogo, darkMode);
  const hasCard       = Boolean(cardName || cardPan || cardNetwork);
  const cardSubline   = [cardPan, fraMiljo && `(${fraMiljo})`].filter(Boolean).join(" ");
  const isMastercard  = /mastercard/i.test(cardNetwork) || /mastercard/i.test(fromAccountType);
  /* Styrer om List.Container under beløpet skal rendres i det hele tatt —
     en tom Container ville gitt en ramme uten innhold. */
  /* Med opptjente poeng vises EuroBonus som tag under beløpet; lista
     brukes bare til mersalget når poengene mangler. */
  const showSasUpsell = isMastercard && !(showSasBonus && sasPoints);
  const hasAmountRows = showSasUpsell;

  const digitalWallet     = fieldValue(selected, /^digital wallet$/i);
  const digitalWalletLogo = fieldValue(selected, /^digital wallet logo$/i);
  const hasDigitalWallet = Boolean(digitalWallet);
  const walletLogoEufemia = eufemiaLogo(digitalWalletLogo, darkMode);

  const pengebrukSub  = fieldValue(selected, /^pengebruk sub$/i);
  const pengebrukMain = fieldValue(selected, /^pengebruk main$/i);
  const pengebrukIconField = fieldValue(selected, /^pengebruk icon$/i);
  const pengebrukReservert = fieldValue(selected, /^pengebruk reservert$/i);
  // Reservert-modus viser kun «Pengebruk reservert»-raden, så seksjonen må
  // styres av det feltet alene — ikke av de vanlige pengebruk-feltene.
  const hasPengebruk  = showReserved
    ? Boolean(pengebrukReservert)
    : Boolean(pengebrukSub || pengebrukMain);
  const pengebrukIcon = ((pengebrukIconField ? lookupEufemiaIcon(pengebrukIconField) : null) ?? getPengebrukIcon(pengebrukSub || pengebrukMain)) as ReturnType<typeof getPengebrukIcon>;
  const transactionTags = fieldValue(selected, /^pengebruk tag$/i)
    .split(",").map((t) => t.trim()).filter(Boolean);

  /* Forslag i tagg-dialogen: alle tagger som finnes i arket, minus de som
     allerede ligger på denne transaksjonen. TermDefinition-kolonnen holder
     ordforklaringer, ikke tagger, så den holdes utenfor. Fritekst er tillatt. */
  const tagSuggestions = Array.from(new Set(
    payments
      .filter((p) => !/^termdefinition$/i.test(p.type))
      .flatMap((p) => p.fields.filter((f) => /^pengebruk tag$/i.test(f.label.trim())))
      .flatMap((f) => f.value.split(",").map((t) => t.trim()))
      .filter(Boolean)
  )).filter((t) => !transactionTags.includes(t) && !extraTags.includes(t));

  const saveTag = () => {
    const value = tagInput.trim().replace(/^#\s*/, "");
    if (!value) return;
    setExtraTags((prev) => [...prev, `#${value}`]);
    setTagInput("");
    setTagDialogOpen(false);
  };

  const detailFields = selected
    ? selected.fields.filter((f) => !BENEFICIARY_LABELS.test(f.label.trim()))
    : [];

  /* Logo erstatter Avatar når "Vis logo" er slått på og typen har en logo.
     Boksen følger avatarens eget breddetoken for valgt størrelse, så
     listejusteringen holder seg lik på tvers av radene. */
  const avatarBox = AVATAR_BOX[avatarSize];
  const logoMarkBox: CSSProperties = {
    width: avatarBox,
    height: avatarBox,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
  /* Navn fra arket ("Rema") → kvadratisk boks som før. Lenke → samme runde
     format som avataren, med 1 px subtil grå strek rundt. boxSizing holder
     ytre mål lik avatarens tross streken. Bildet fyller hele sirkelen
     (cover), så brede ordmerker beskjæres i stedet for å krympe. */
  const logoIsLink = isLogoLink(logoUrl);
  const merchantLogoMark: ReactNode = (
    <span
      style={
        logoIsLink
          ? {
              ...logoMarkBox,
              boxSizing: "border-box",
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid var(--token-color-stroke-neutral-subtle)",
            }
          : logoMarkBox
      }
    >
      <img
        src={merchantLogo}
        alt={name}
        style={
          logoIsLink
            ? { width: "100%", height: "100%", objectFit: "cover", display: "block" }
            : { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }
        }
      />
    </span>
  );
  /* hasLabel: avataren er dekorativ — radens tittel er mottakernavnet, så
     Eufemia trenger ingen Avatar.Group her. Samme mønster som SAS-avataren
     lenger ned. Uten den logger Eufemia «Avatar group required». */
  const letterAvatar = <Avatar size={avatarSize} variant="primary" hasLabel>{initial}</Avatar>;

  const beneficiaryMark: ReactNode = wantsLogo && merchantLogo ? (
    merchantLogoMark
  ) : wantsLogo ? (
    /* Logo-type uten logo: bygningsikon i samme grønne sirkel som bokstaven,
       slik at raden aldri viser en initial for en forhandler. */
    <Avatar size={avatarSize} variant="primary" hasLabel icon={office_buildings_medium} />
  ) : wantsAvatar ? (
    letterAvatar
  ) : merchantLogo ? (
    /* Typer uten verdi i Logo/Avatar-feltet beholder dagens oppførsel. */
    merchantLogoMark
  ) : isGebyrRenter ? (
    /* Gebyr og renter har ingen mottaker — ikon i stedet for initial-avatar.
       Samme boks som logoen, så radjusteringen holder seg. */
    <span style={logoMarkBox}>
      <Icon icon={hand_money_medium} size={AVATAR_ICON_SIZE[avatarSize]} style={{ color: "var(--token-color-icon-action)" }} />
    </span>
  ) : (
    letterAvatar
  );

  /* ── SSR-hydration guard ───────────────────────────────────────── */
  if (!hydrated) {
    return <div style={{ minHeight: "100vh", background: "var(--token-color-background-neutral-subtle)" }} />;
  }

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <Theme colorScheme={darkMode ? "dark" : "light"}>
      {/* Fix: Tailwind preflight sets svg { display: block }, breaking Eufemia inline icons */}
      {/* Fix: Eufemia's :is(:has(.subline)) rule (0,3,0) sets place-self:start on header chevron/icon/title
          when accordion opens and inner items have sublines — causes layout jump on single-line headers.
          Double-class specificity (0,4,0) keeps all three elements vertically centered. */}
      <style>{`
        .dnb-icon svg { display: inline-block; vertical-align: top; }
        .dnb-list__item .dnb-list__item__icon .dnb-icon { color: var(--token-color-icon-action); }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-icon { color: var(--token-color-icon-action); }
        /* Ikon inne i en Avatar skal ha samme farge som bokstavversjonen. Regelen
           over er ment for ikoner som ligger direkte i raden, men slår også inn på
           bygningsikonet inne i avataren og gjør det grønt på mørkegrønn bunn.
           inherit henter avatarens egen tekstfarge, så den følger variant. */
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-avatar .dnb-icon { color: inherit; }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__chevron.dnb-list__item__chevron { place-self: center; display: flex; }
        .dnb-list__item__accordion--open { --item-background-color: var(--token-color-background-neutral-subtle); }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__icon.dnb-list__item__icon { place-self: center; }
        /* List.Cell.Start (avatar/ikon i Betalt til) toppjusteres av Eufemia som __icon, men sto ikke i reglene. */
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__start.dnb-list__item__start { align-self: center; }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__title.dnb-list__item__title { align-self: center; }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__end.dnb-list__item__end { align-self: center; }
        .dnb-list__item.dnb-list__item .dnb-list__item__icon.dnb-list__item__icon { place-self: center; }
        .dnb-list__item.dnb-list__item .dnb-list__item__start.dnb-list__item__start { align-self: center; }
        .dnb-list__item.dnb-list__item .dnb-list__item__title.dnb-list__item__title { align-self: center; }
        .dnb-list__item.dnb-list__item .dnb-list__item__end.dnb-list__item__end { align-self: center; }
        /* Eufemia skjuler chevronen med
           .dnb-list__item:has(.dnb-anchor__launch-icon) .dnb-list__item__chevron { display: none }
           (0,3,0). :has() treffer her accordionen, ikke raden — accordionen er også
           en .dnb-list__item og inneholder søskenrader med eksterne lenker som har
           launch-ikon. Chevronen på våre Action-rader blir derfor skjult som
           sidevirkning. Dobbel klasse gir 0,4,0 og vinner. Scopet til .td-chevron-row
           så vi ikke tvinger chevron på rader som ikke skal ha den. */
        .td-chevron-row.td-chevron-row .dnb-list__item__chevron.dnb-list__item__chevron { display: flex; }
        /* Eufemia løfter rader inne i accordion-innholdet til z-index 11 ved hover
           (0,4,0), over accordionens kantlinje på ::after (z-index 10). Det er ment
           for hover-rammen på Action-rader, men Basic-radene har ingen ramme — bare
           hvit bakgrunn som dekker sidekantene. Ikke-klikkbare rader blir liggende. */
        .dnb-list__item__accordion .dnb-list__item__accordion__content .dnb-list__item.dnb-list__item:not(.dnb-list__item__action):is(:hover, :has(>:focus-visible)) { z-index: 1; }
        /* Info-tag (Figma 22660:111327): subtil grå bunn, 1px kant og 8px
           radius. Eufemias standard-Tag er hvit uten kant. */
        .td-info-tag.dnb-tag.dnb-button {
          background-color: var(--token-color-background-neutral-subtle);
          box-shadow: inset 0 0 0 1px var(--token-color-stroke-neutral-bold);
          border-radius: var(--token-radius-md, 0.5rem);
          color: var(--token-color-text-neutral);
          height: auto;
          padding: 0.25rem 0.5rem;
        }
        .td-info-tag.dnb-tag.dnb-button .dnb-button__text { font-weight: var(--font-weight-medium); line-height: 1.25rem; }
        /* Knappens alignment-helper er 24px høy og ville gitt 32px tag. */
        .td-info-tag.dnb-tag.dnb-button .dnb-button__alignment { height: 1.25rem; }
        /* FormStatus måler sin egen bredde ved mount og låser den som inline
           max-width (setMaxWidthToElement, laget for feltstatus). Da følger
           ikke boksen med når Full width slås på. Eufemia hopper over låsingen
           når elementet allerede har max-width fra CSS. */
        .td-reserved-status.dnb-form-status { max-width: 100%; }
      `}</style>

      {/* ── Page header (netbank-shell) ─────────────────────────────
          Ligger utenfor det hvite innholdskortet: full bredde, egen hvit
          flate, med innholdet innrykket i linje med kortet under. */}
      <div style={{
        background: "var(--token-color-background-page-background, var(--token-color-background-neutral))",
        height: "80px",
        display: "flex",
        alignItems: "flex-end",
        boxSizing: "border-box",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          height: "62px",
          padding: "0 48px",
          maxWidth: "calc(72rem + 96px)",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}>
          <Breadcrumb
            variant="multiple"
            navText="Sidehierarki"
            data={[
              { text: "Hjem", href: "/" },
              { text: "Kontoer", href: "#" },
              { text: "Brukskonto", href: "#" },
              { text: "Transaksjonsdetaljer" },
            ]}
          />
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <Avatar size="medium" variant="primary" hasLabel>E</Avatar>
            <Button variant="tertiary" size="small" icon="chevron_down" iconPosition="right">Meg</Button>
          </div>
        </div>
      </div>

      {/* Page background */}
      <div style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "calc(100vh - 80px)", padding: "48px", boxSizing: "border-box" }}>

        {/* Content card */}
        <div style={{
          background: "var(--token-color-background-neutral)",
          color: "var(--token-color-text-neutral)",
          boxShadow: "0px 8px 16px 0px rgba(51,51,51,0.08)",
          padding: "48px 96px",
          display: "flex",
          flexDirection: "column",
          gap: "48px",
          minHeight: "calc(100vh - 176px)",
          boxSizing: "border-box",
          maxWidth: "72rem",
          margin: "0 auto",
          width: "100%",
        }}>

          {/* ── Sidetittel ─────────────────────────────────────────
              Viser betalingstypen fra rad 1 i regnearket — headerraden der
              hver kolonne er en betalingstype, som transpose() gjør om til
              record.type. Faller tilbake til en generisk tittel i tom-
              tilstanden, så siden aldri står uten H1.

              size="x-large" (34px) i stedet for H1s default xx-large (48px),
              som ville ropt høyere enn beløpet under.

              Datoen ligger i samme stack med 8px gap, ikke som eget barn av
              kortet — kortets egen gap er 48px, som ville skilt tittel og dato
              fra hverandre. Den er en <P>, ikke en overskrift: den navngir
              ingen seksjon, og som H3 over beløpets H2 brøt den dessuten
              rekkefølgen på overskriftsnivåene. */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <H1 size="x-large" style={{ margin: 0 }}>{selectedType || "Transaksjonsdetaljer"}</H1>
            {selected && <P size="x-small" style={{ margin: 0, color: "var(--token-color-text-neutral-alternative)" }}>{dateTimeDisplay}</P>}
            {/* Skiller sidehodet fra innholdet. top="small" (16px) legger seg
                til wrapperens 8px gap = 24px luft over streken. */}
            <Hr top="small" bottom={0} />
          </div>

          {/* ── Innhold ────────────────────────────────────────── */}
          {payments.length === 0 ? (
            <P>Ingen betalinger funnet i regnearket.</P>
          ) : selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: fullWidth ? "100%" : "488px", width: "100%" }}>

              {/* ── Beløpsmodul ──────────────────────────────────
                  Bygget som Betalt fra: beløpet fritt over en List.Container.
                  List.Cell.Title tilbyr bare basis/small som fontSize, så en
                  H2 på 26px hører ikke hjemme i en rad. Ikoner går gjennom
                  List sine egne slots: ekte Eufemia-ikoner via icon-propen
                  (ItemIcon wrapper dem i <Icon size="medium">), flagg og
                  logoer via List.Cell.Start. Fargen på ikonene kommer fra
                  .dnb-list__item__icon-regelen øverst, så ingen inline color. */}
              {(nokAmount || hasLoanBreakdown) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {nokAmount && (
                    <H2 size="large" style={{ margin: 0, ...(showReserved && { color: "var(--token-color-text-neutral-alternative)" }) }}>Kr {fdNo(/^(beløp|beløp nok|nok beløp)$/i)}</H2>
                  )}

                  {/* Reservert-status som infoboks under beløpet (Figma
                      22624:84981, erstatter tidligere tag). stretch: boksen
                      står alene og skal fylle bredden som i Figma. */}
                  {showReserved && (
                    <FormStatus
                      className="td-reserved-status"
                      state="information"
                      stretch
                      text="Beløpet er reservert og trukket fra disponibel saldo, men ikke bokført."
                    />
                  )}

                  {/* Valutakjøp (Figma 22660:111327): to tagger under beløpet
                      — valutabeløp med flagget til valutaen, og vekslingskurs
                      med swap-ikon. Utseendet kommer fra .td-info-tag. */}
                  {(currencyAmount || exchangeRate) && (
                    <Tag.Group label="Valuta">
                      {currencyAmount && (
                        <Tag
                          className="td-info-tag"
                          icon={currencyFlagIso ? <CountryFlag iso={currencyFlagIso} size="small" /> : undefined}
                          text={`${currencyCode ? `${fd(/^valutasort$/i)} ` : ""}${fdNo(/^(beløp valuta|valuta beløp|valutabeløp)$/i)}`}
                        />
                      )}
                      {exchangeRate && (
                        <Tag
                          className="td-info-tag"
                          icon={swap}
                          text={`${currencyCode ? `${fd(/^valutasort$/i)} 1 = NOK ` : ""}${fdNo(/^vekslingskurs$/i, 0)}`}
                        />
                      )}
                    </Tag.Group>
                  )}

                  {/* SAS EuroBonus (Figma 22659:111326): samme tag som
                      valutaen. SAS.svg er sas_avatar-ressursen fra Figma. */}
                  {isMastercard && showSasBonus && sasPoints && (
                    <div>
                      <Tag
                        className="td-info-tag"
                        hasLabel
                        icon={<img src="/merchants/SAS.svg" width={16} height={16} alt="" />}
                        text={`EuroBonus ${fd(/^(sas eurobonuspoeng|eurobonus poeng|sas bonus)$/i)} p`}
                      />
                    </div>
                  )}

                  {/* Avdrag + renter (boliglån, Figma 22669:111328): to tagger
                      uten ikon, samme .td-info-tag som valutaen. Degraderer
                      til én tag når bare ett av feltene finnes. */}
                  {hasLoanBreakdown && (
                    <Tag.Group label="Lån">
                      {avdrag && <Tag className="td-info-tag" text={`Avdrag kr ${fdNo(/^lån avdrag$/i)}`} />}
                      {renter && <Tag className="td-info-tag" text={`Renter kr ${fdNo(/^lån renter$/i)}`} />}
                    </Tag.Group>
                  )}

                  {hasAmountRows && (
                    <List.Container>
                      {/* Mersalg når kortet ikke har opptjent EuroBonus.
                          Poengsummen vises som tag over. Avatar med src i
                          stedet for en rå <img>: Figma peker på Eufemias
                          Avatar, og hasLabel demper «Avatar group
                          required»-advarselen siden raden selv gir
                          konteksten. */}
                      {showSasUpsell && (
                        <List.Item.Basic>
                          <List.Cell.Start>
                            {/* backgroundColor må settes: Avatar er primary som
                                default, og SAS-merket er #0002BE — blått på
                                DNB-grønt forsvinner. */}
                            <Avatar
                              size="small"
                              src="/merchants/SAS-wordmark.svg"
                              alt="SAS"
                              hasLabel
                              backgroundColor="var(--token-color-background-neutral)"
                            />
                          </List.Cell.Start>
                          <List.Cell.Title>Få Eurobonuspoeng når du bruker ditt Mastercard</List.Cell.Title>
                          {/* fontWeight="regular": Cell.End er medium som
                              default, som gjør lenken tyngre enn de andre
                              lenkene i lista. */}
                          <List.Cell.End fontWeight="regular">
                            <Anchor href="https://www.dnb.no/kort/kredittkort/mastercard/upgrade" target="_blank" rel="noopener noreferrer">Les mer</Anchor>
                          </List.Cell.End>
                        </List.Item.Basic>
                      )}

                    </List.Container>
                  )}
                </div>
              )}

              {/* ── Beneficiary-kort ───────────────────────────── */}
              {hasBeneficiary && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <H3 style={{ margin: 0 }}>{tilLabel}</H3>
                  <List.Container>
                    <List.Item.Accordion>
                      <List.Item.Accordion.Header>
                        <List.Cell.Start>
                          {isOverforing ? (
                            <Icon icon={mottakerKontoIcon} size="medium" style={{ color: "var(--token-color-icon-action)" }} />
                          ) : showFlag ? (
                            <Badge content={<CountryFlag iso={flagIso} size={AVATAR_FLAG_SIZE[avatarSize]} />} vertical="bottom" horizontal="right" variant="content">
                              {beneficiaryMark}
                            </Badge>
                          ) : (
                            beneficiaryMark
                          )}
                        </List.Cell.Start>
                        <List.Cell.Title>
                          {showFieldNames ? (fd(nameRe) || fd(/^mottaker$/i)) : (name || account)}
                          {name && account && (
                            <List.Cell.Title.Subline variant="description">
                              {fd(/^mottaker konto/i)}
                            </List.Cell.Title.Subline>
                          )}
                        </List.Cell.Title>
                      </List.Item.Accordion.Header>
                      <List.Item.Accordion.Content>
                        <div className="dnb-card" style={{ borderTop: "1px solid var(--token-color-stroke-neutral-subtle)" }}>
                          <List.Container>
                            {mottakerKontoType && !isOverforing && (
                              <List.Item.Basic icon={mottakerKontoIcon} title={td("Kontotype")}>
                                <List.Cell.End fontWeight="regular">
                                  {showFieldNames ? fd(/^mottaker konto ?type$/i) : mottakerKontoType}
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {melding && (
                              <List.Item.Basic icon={bubble_medium} title={td("Melding")}>
                                <List.Cell.End fontWeight="regular">
                                  {showFieldNames ? fd(/^melding$/i) : `"${melding}"`}
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {kid && (
                              <List.Item.Basic icon={kid_number_medium} title={td("KID")}>
                                <List.Cell.End fontWeight="regular">
                                  {/* Button, ikke Anchor: kopiering er en handling, ikke
                                      navigasjon. Anchor href="#" havnet i skjermleserens
                                      lenkeliste og ga tom navigasjon på midtklikk. */}
                                  <Button
                                    variant="tertiary"
                                    icon={kidCopied ? check : copy}
                                    iconPosition="right"
                                    tooltip={kidCopied ? "KID-nummeret er kopiert" : "Kopier KID-nummer"}
                                    onClick={() => {
                                      navigator.clipboard.writeText(kid).then(
                                        () => {
                                          setKidCopied(true);
                                          setTimeout(() => setKidCopied(false), 2000);
                                        },
                                        () => setKidCopied(false),
                                      );
                                    }}
                                  >
                                    {showFieldNames ? fd(/^kid$/i) : kid}
                                  </Button>
                                  {/* Ikonbyttet er visuelt; skjermlesere trenger en
                                      live region for å få med seg bekreftelsen. */}
                                  <span className="dnb-sr-only" aria-live="polite">
                                    {kidCopied ? "KID-nummer kopiert" : ""}
                                  </span>
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {hasAddress && (
                              <List.Item.Basic
                                icon={location_medium}
                                title={
                                  /* Adressen står som tittel i stedet for labelen «Adresse».
                                     Ingen ordforklaring finnes for dette feltet, så td() droppes. */
                                  [
                                    address1 && fd(/^mottaker adresse 1$/i),
                                    address2 && fd(/^mottaker adresse 2$/i),
                                    postalLine && (showFieldNames
                                      ? [fd(/^mottaker postnr$/i), fd(/^mottaker sted\/by$/i)].filter(Boolean).join(" ")
                                      : postalLine),
                                    country && fd(/^mottaker land$/i),
                                  ]
                                    .filter(Boolean)
                                    .map((line, i) => (
                                      <span key={i} style={{ display: "block" }}>{line}</span>
                                    ))
                                }
                              >
                                <List.Cell.End fontWeight="regular">
                                  {hasStreetAddress && (
                                    <Anchor
                                      href={`https://maps.google.com/?q=${encodeURIComponent([address1, address2, postalLine, country].filter(Boolean).join(", "))}`}
                                      target="_blank"
                                    >Vis i kart</Anchor>
                                  )}
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {website && (
                              <List.Item.Basic icon={web_medium} title={td("Nettsted")}>
                                <List.Cell.End fontWeight="regular">
                                  <Anchor
                                    href={website.startsWith("http") ? website : `https://${website}`}
                                    target="_blank"
                                  >
                                    {showFieldNames ? fd(/^mottaker web$/i) : website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                                  </Anchor>
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {phone && (
                              <List.Item.Basic icon={phone_medium} title={td("Telefon")}>
                                <List.Cell.End fontWeight="regular">
                                  {showFieldNames ? fd(/^(mottaker telefon|telefon)$/i) : phone}
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {orgNr && (
                              <List.Item.Basic icon={office_buildings_medium} title={td("Org.nr.")}>
                                <List.Cell.End fontWeight="regular">
                                  <Anchor
                                    href={`https://virksomhet.brreg.no/nb/oppslag/enheter/${orgNr.replace(/\D/g, "")}`}
                                    target="_blank"
                                  >
                                    {showFieldNames ? fd(/^(mottaker orgnr|orgnr|org\.?nr\.?|organisasjonsnummer)$/i) : orgNr.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                                  </Anchor>
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {/* Avtalegiro: lenke til høyre, samme mønster som
                                eFakturahistorikk under. Var tidligere en
                                List.Item.Action (klikkbar rad med chevron), men
                                raden skal ha en synlig «Vis avtale»-lenke — og
                                Action rendrer <Anchor noStyle> uten lenketekst.
                                Anchor med target="_blank" gir launch-ikonet. */}
                            {isAvtalegiro && (
                              <List.Item.Basic icon={ainvoice_medium} title={td("Avtalegiro")}>
                                <List.Cell.End fontWeight="regular">
                                  <Anchor
                                    href="https://www.dnb.no/segp/ps/applikasjoner/payment-agreements/DirectDebit/70011960764123/details"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Vis avtale
                                  </Anchor>
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {/* eFakturahistorikk: lenke til høyre, ikke klikkbar rad.
                                Anchor med target="_blank" gir launch-ikonet
                                automatisk. */}
                            {isEfaktura && (
                              <List.Item.Basic icon={einvoice_medium} title={td("eFakturahistorikk", "eFaktura")}>
                                <List.Cell.End fontWeight="regular">
                                  <Anchor
                                    href="https://www.dnb.no/segp/ps/applikasjoner/payment-agreements/einvoice/mine/issuers/917245975"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Vis historikk
                                  </Anchor>
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            <List.Item.Basic icon={history_medium} title={td("Historikk")}>
                              <List.Cell.End fontWeight="regular">
                                <Anchor href="#" target="_blank">
                                  Vis transaksjoner
                                </Anchor>
                              </List.Cell.End>
                            </List.Item.Basic>
                          </List.Container>
                        </div>
                      </List.Item.Accordion.Content>
                    </List.Item.Accordion>
                  </List.Container>
                </div>
              )}

              {/* ── Betalt fra ─────────────────────────────────── */}
              {(hasFromAccount || hasCard || hasDigitalWallet) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <H3 style={{ margin: 0 }}>{fraLabel}</H3>
                  <List.Container>
                    {hasFromAccount && (
                      isOverforing ? (
                        <List.Item.Basic icon={fromAccountIcon} title={
                          <>
                            {fd(/^(kontotype|konto type|fra konto type)$/i)}
                            {fromAccountNumber && (
                              <List.Cell.Title.Subline variant="description">
                                {fd(/^(kontonummer|fra kontonummer|fra konto)$/i)}
                              </List.Cell.Title.Subline>
                            )}
                          </>
                        } />
                      ) : (
                        <List.Item.Basic icon={fromAccountIcon} title={
                          <>
                            {fd(/^(kontotype|konto type|fra konto type)$/i)}
                            {fromAccountNumber && (
                              <List.Cell.Title.Subline variant="description">
                                {fd(/^(kontonummer|fra kontonummer|fra konto)$/i)}
                              </List.Cell.Title.Subline>
                            )}
                          </>
                        } />
                      )
                    )}
                    {hasCard && (
                      <List.Item.Basic icon={card_medium} title={
                        <>
                          {fd(/^(kortnavn|fra kortnavn)$/i)}{cardPan ? ` (${showFieldNames ? fd(/^(kortnummer pan|kortnummer\/pan|fra kortnummer\/pan|fra kortnummer pan|kortnummer|pan)$/i) : cardPan})` : ""}
                          {fraMiljo && (
                            <List.Cell.Title.Subline variant="description">
                              {showFieldNames ? fd(/^fra milj[øo]$/i) : fraMiljo}
                            </List.Cell.Title.Subline>
                          )}
                        </>
                      }>
                        {(cardNetworkLogo || showFieldNames) && (
                          <List.Cell.End fontWeight="regular">
                            {showFieldNames
                              ? fd(/^(kortnettverk logo|fra kortnettverk logo)$/i)
                              : cardNetworkLogoEufemia
                                ? <img {...cardNetworkLogoEufemia} alt={cardNetwork} />
                                : <img src={logoSrc(cardNetworkLogo, "kortnettverk")} alt={cardNetwork} style={LOCAL_LOGO_STYLE} />
                            }
                          </List.Cell.End>
                        )}
                      </List.Item.Basic>
                    )}
                    {hasDigitalWallet && (
                      <List.Item.Basic icon={wallet_medium} title={
                        <>
                          Digital lommebok
                          <List.Cell.Title.Subline variant="description">
                            {showFieldNames ? fd(/^digital wallet$/i) : `Betalt med ${digitalWallet}`}
                          </List.Cell.Title.Subline>
                        </>
                      }>
                        <List.Cell.End fontWeight="regular">
                          {showFieldNames
                            ? fd(/^digital wallet logo$/i)
                            : digitalWalletLogo
                              ? <Tooltip targetElement={walletLogoEufemia
                                  ? <img {...walletLogoEufemia} alt={digitalWallet} />
                                  : <img src={logoSrc(digitalWalletLogo, "wallet")} alt={digitalWallet} style={LOCAL_LOGO_STYLE} />}>{`Betalt med ${digitalWallet}`}</Tooltip>
                              : null}
                        </List.Cell.End>
                      </List.Item.Basic>
                    )}
                  </List.Container>
                </div>
              )}

              {/* ── Pengebruk ──────────────────────────────────── */}
              {hasPengebruk && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <H3 style={{ margin: 0 }}>Pengebruk</H3>
                  <List.Container>
                    {showReserved ? (
                      <List.Item.Basic icon={coins_1_medium} title={td("Pengebruk reservert", "Foreløpig kategori")}>
                        {pengebrukReservert && (
                          <List.Cell.End fontWeight="regular">
                            {fd(/^pengebruk reservert$/i)}
                          </List.Cell.End>
                        )}
                      </List.Item.Basic>
                    ) : (
                      <List.Item.Accordion icon={pengebrukIcon}>
                        <List.Item.Accordion.Header>
                          <List.Cell.Title>
                            {fd(/^pengebruk sub$/i)}{hideFromSpending && " (skjult)"}
                            {pengebrukMain && (
                              <List.Cell.Title.Subline variant="description">i {fd(/^pengebruk main$/i)}</List.Cell.Title.Subline>
                            )}
                          </List.Cell.Title>
                        </List.Item.Accordion.Header>
                        <List.Item.Accordion.Content>
                          <div className="dnb-card" style={{ borderTop: "1px solid var(--token-color-stroke-neutral-subtle)" }}>
                            <List.Container>
                              <List.Item.Action title="Bytt kategori" onClick={() => setNotImplemented("Bytt kategori")} />
                              <List.Item.Action title="Splitt transaksjonen" onClick={() => setNotImplemented("Splitt transaksjonen")} />
                              <List.Item.Basic title={td("Skjul i pengebruk")}>
                                <List.Cell.End>
                                  <Switch
                                    label="Skjul i pengebruk"
                                    labelSrOnly
                                    checked={hideFromSpending}
                                    onChange={({ checked }) => setHideFromSpending(checked)}
                                  />
                                </List.Cell.End>
                              </List.Item.Basic>
                              <List.Item.Basic title={td("Pengebruk tag", "Tagger")}>
                                <List.Cell.End>
                                  <Tag.Group label="Tagger">
                                    {showFieldNames ? (
                                      <Tag variant="clickable" onClick={() => {}}>{fd(/^pengebruk tag$/i)}</Tag>
                                    ) : (
                                      transactionTags.map((tag) => (
                                        <Tag key={tag} variant="clickable" onClick={() => {}}>
                                          {tag}
                                        </Tag>
                                      ))
                                    )}
                                    {extraTags.map((tag, i) => (
                                      <Tag key={i} variant="removable" onClick={() => setExtraTags((prev) => prev.filter((_, j) => j !== i))}>
                                        {tag}
                                      </Tag>
                                    ))}
                                    <Tag variant="addable" onClick={() => setTagDialogOpen(true)}>Legg til</Tag>
                                  </Tag.Group>
                                </List.Cell.End>
                              </List.Item.Basic>
                            </List.Container>
                          </div>
                        </List.Item.Accordion.Content>
                      </List.Item.Accordion>
                    )}
                  </List.Container>
                </div>
              )}

              {/* ── Vedlegg ──────────────────────────────────────── */}
              {hasVedlegg && (
                <div>
                  <List.Container>
                  <List.Item.Accordion icon={attachment_medium}>
                    <List.Item.Accordion.Header>
                      <List.Cell.Title>Vedlegg</List.Cell.Title>
                    </List.Item.Accordion.Header>
                    <List.Item.Accordion.Content>
                      <div className="dnb-card" style={{ borderTop: "1px solid var(--token-color-stroke-neutral-subtle)" }}>
                        <List.Container>
                          {kvittering && (
                            <List.Item.Basic title={td("Kjøpskvittering")}>
                              <List.Cell.End fontWeight="regular">
                                {/^vis$/i.test(kvittering) ? (
                                  <Anchor href="#" target="_blank">Vis</Anchor>
                                ) : /^last opp$/i.test(kvittering) ? (
                                  <Anchor href="#" icon={upload} iconPosition="right">Last opp</Anchor>
                                ) : null}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {efaktura && (
                            <List.Item.Basic title={td("eFaktura")}>
                              <List.Cell.End fontWeight="regular">
                                <Anchor href="#" target="_blank">Vis</Anchor>
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {betalingsbekreftelse && (
                            <List.Item.Basic title={td("Betalingsbekreftelse")}>
                              <List.Cell.End fontWeight="regular">
                                <Anchor href="#" icon={download} iconPosition="right">Last ned</Anchor>
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                        </List.Container>
                      </div>
                    </List.Item.Accordion.Content>
                  </List.Item.Accordion>
                </List.Container>
                </div>
              )}

              {/* ── Detaljer ────────────────────────────────────────
                  Kortreklamasjon og beskrivelse står i betingelsen: radene
                  ligger i denne seksjonen, så en type med bare ett av de
                  feltene og uten datofelt ville ellers mistet raden helt. */}
              {(transaksjonsDato || reservertDate || bokfortDato || rentedato || mottakerBeskrivelse || prisGebyr || betalingsprodukt || paymentId || transactionId || /^ja$/i.test(kortreklamasjoner) || showFieldNames) && (
                <div>
                <List.Container>
                  <List.Item.Accordion icon={information_circled_medium}>
                    <List.Item.Accordion.Header>
                      <List.Cell.Title>Detaljer</List.Cell.Title>
                    </List.Item.Accordion.Header>
                    <List.Item.Accordion.Content>
                      <div className="dnb-card" style={{ borderTop: "1px solid var(--token-color-stroke-neutral-subtle)" }}>
                        <List.Container>
                          {(mottakerBeskrivelse || showFieldNames) && (
                            <List.Item.Basic
                              title={td(
                                "Mottaker beskrivelse",
                                "Forhandler",
                                "Viser original beskrivelse fra forhandleren.",
                              )}
                            >
                              <List.Cell.End fontWeight="regular">
                                {fd(/^mottaker beskrivelse$/i)}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {/* Ukjent transaksjon. Flyttet hit fra beneficiary-accordionen;
                              ikonet droppet fordi ingen av radene i Detaljer har ikon. */}
                          {(/^ja$/i.test(kortreklamasjoner) || showFieldNames) && (
                            <List.Item.Basic title={td("Kortreklamasjon", "Ukjent transaksjon?")}>
                              <List.Cell.End fontWeight="regular">
                                {showFieldNames
                                  ? fd(/^kortreklamasjon(er)?$/i)
                                  : <Anchor href="https://www.dnb.no/hjelp-og-veiledning/klage-reklamasjon" target="_blank">Rapporter</Anchor>}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {transaksjonsDato && (
                            <List.Item.Basic title={td("Transaksjonsdato")}>
                              <List.Cell.End fontWeight="regular">
                                {formatDateNo(fd(/^transaksjonsdato$/i))}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {reservertDate && (
                            <List.Item.Basic title={td("Reservert dato")}>
                              <List.Cell.End fontWeight="regular">
                                {formatDateNo(fd(/^(reservert dato|reservasjonsdato)$/i))}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {bokfortDato && (
                            <List.Item.Basic title={td("Bokført dato")}>
                              <List.Cell.End fontWeight="regular">
                                {formatDateNo(fd(/^(bokf[øo]rt dato|bokf[øo]ringsdato)$/i))}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {rentedato && (
                            <List.Item.Basic title={td("Rentedato")}>
                              <List.Cell.End fontWeight="regular">
                                {formatDateNo(fd(/^rentedato$/i))}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {/* Transaksjonskostnad med betalingsproduktet (SEPA,
                              Straksbetaling …) i parentes i tittelen — én rad, flyttet
                              hit fra beløpsmodulen. Mangler prisen, står produktet
                              som verdi i stedet for å etterlate en tom høyreside. */}
                          {(prisGebyr || betalingsprodukt || showFieldNames) && (
                            <List.Item.Basic
                              title={td(
                                "Transaksjonskostnad",
                                prisGebyr && betalingsprodukt
                                  ? <>Transaksjonskostnad ({fd(/^betalingsprodukt$/i)})</>
                                  : "Transaksjonskostnad",
                              )}
                            >
                              <List.Cell.End fontWeight="regular">
                                {prisGebyr
                                  ? `Kr ${fdNo(/^(pris|gebyr|pris\/gebyr)$/i)}`
                                  : fd(/^betalingsprodukt$/i)}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {(paymentId || showFieldNames) && (
                            <List.Item.Basic title={td("BetalingsID", "Betalingsreferanse")}>
                              <List.Cell.End fontWeight="regular">
                                {fd(/^betalingsid$/i)}
                              </List.Cell.End>
                            </List.Item.Basic>
                          )}
                          {/* TransaksjonsID ligger sist i seksjonen. */}
                          {(transactionId || showFieldNames) && (
                          <List.Item.Basic title={td("TransaksjonsID")}>
                            <List.Cell.End fontWeight="regular">
                              {fd(/^transaksjonsid$/i)}
                            </List.Cell.End>
                          </List.Item.Basic>
                          )}
                        </List.Container>
                      </div>
                    </List.Item.Accordion.Content>
                  </List.Item.Accordion>
                </List.Container>
                </div>
              )}

              {/* ── Detaljfelt (alltid synlige) ─────────────────── */}
              {detailFields.length > 0 && (
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 24px", margin: 0 }}>
                  {detailFields.map((f) => (
                    <div key={f.label} style={{ display: "contents" }}>
                      <dt style={{ fontWeight: 600 }}>{td(f.label)}</dt>
                      <dd style={{ margin: 0 }}>{showFieldNames ? `<${f.label}>` : f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Konfigurasjons-knapp ───────────────────────────────────── */}
      <div style={{ position: "fixed", top: "21px", right: "20px", zIndex: 100, display: "flex", borderRadius: "50%", boxShadow: "var(--shadow-default)" }}>
        <Button
          variant="primary"
          icon={filter}
          aria-label="Tools menu"
          onClick={() => setToolsOpen((o) => !o)}
          style={{ borderRadius: "50%", width: "44px", height: "44px", padding: 0 }}
        />
      </div>

      {/* ── Konfigurasjons-popover ─────────────────────────────────── */}
      {toolsOpen && (
        <div style={{
          position: "fixed", top: "77px", right: "20px",
          maxHeight: "calc(100vh - 97px)",
          overflowY: "auto",
          background: "var(--token-color-background-neutral)",
          border: "1px solid var(--token-color-stroke-neutral-subtle)",
          filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.08))",
          borderRadius: "8px",
          minWidth: "440px", maxWidth: "560px",
          padding: "24px",
          display: "flex", flexDirection: "column", gap: "16px",
          zIndex: 99,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <P size="basis" style={{ fontWeight: 500, margin: 0 }}>Configurations menu</P>
              <button
                onClick={() => setToolsOpen(false)}
                aria-label="Lukk"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}
              >
                <Icon icon={close} size="small" />
              </button>
            </div>
            {/* contain: teksten bidrar ikke til panelets bredde, den brytes i stedet. */}
            <P size="basis" style={{ margin: 0, contain: "inline-size" }}>For experimenting and simulation purpose - not visible to end user.</P>
          </div>

          {payments.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
              <P size="basis" style={{ margin: 0 }}>Trx type</P>
              <div className="narrow-dropdown">
                <style>{`.narrow-dropdown .dnb-dropdown { --dropdown-width: 16rem; }`}</style>
                <Dropdown
                  label="Trx type"
                  labelSrOnly
                  size="small"
                  value={selectedType}
                  data={payments.filter((p) => !/^termdefinition$/i.test(p.type)).map((p) => ({ selectedKey: p.type, content: p.type }))}
                  onChange={({ data }) =>
                    setSelectedType(typeof data?.selectedKey === "string" ? data.selectedKey : selectedType)
                  }
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Vis reservert</P>
            <Switch label="Vis reservert" labelSrOnly checked={showReserved} onChange={({ checked }) => setShowReserved(checked)} />
          </div>

          {isMastercard && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
              <P size="basis" style={{ margin: 0 }}>SAS Eurobonus</P>
              <Switch label="SAS Eurobonus" labelSrOnly checked={showSasBonus} onChange={({ checked }) => setShowSasBonus(checked)} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Vis logo</P>
            <Switch label="Vis logo" labelSrOnly checked={showLogo} onChange={({ checked }) => setShowLogo(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Logo/avatar size</P>
            {/* independentWidth er Eufemias egen «bredde etter innhold» —
                gir .dnb-dropdown--independent-width → __shell { width: auto }.
                Derfor ingen .narrow-dropdown-wrapper her (den låser 16rem). */}
            <div>
              <Dropdown
                label="Logo/avatar size"
                labelSrOnly
                size="small"
                independentWidth
                value={avatarSize}
                data={(Object.keys(AVATAR_BOX) as AvatarSize[]).map((size) => ({
                  selectedKey: size,
                  content: `${size} (${AVATAR_BOX[size]})`,
                }))}
                onChange={({ data }) =>
                  setAvatarSize(
                    typeof data?.selectedKey === "string" ? (data.selectedKey as AvatarSize) : avatarSize,
                  )
                }
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Full width</P>
            <Switch label="Full width" labelSrOnly checked={fullWidth} onChange={({ checked }) => setFullWidth(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Dark mode</P>
            <Switch label="Dark mode" labelSrOnly checked={darkMode} onChange={({ checked }) => setDarkMode(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Vis feltnavn</P>
            <Switch label="Vis feltnavn" labelSrOnly checked={showFieldNames} onChange={({ checked }) => setShowFieldNames(checked)} />
          </div>
        </div>
      )}

      {/* ── Tagg-dialog ────────────────────────────────────────────── */}
      <Dialog
        omitTriggerButton
        open={tagDialogOpen}
        noAnimation
        onClose={() => setTagDialogOpen(false)}
        title="Legg til tagg"
        variant="information"
        maxWidth="49rem"
      >
        <Autocomplete
          label="Skriv inn navn på tagg"
          labelDirection="vertical"
          placeholder="# text"
          data={tagSuggestions}
          showSubmitButton
          noOptions="Ingen treff — trykk Lagre for å bruke det du har skrevet"
          onType={({ value }) => setTagInput(value)}
          onChange={({ data }) =>
            setTagInput(typeof data === "string" ? data : String(data?.content ?? ""))
          }
          onSubmit={saveTag}
        />
        <Button variant="primary" size="large" onClick={saveTag} top="medium">
          Lagre
        </Button>
      </Dialog>

      {/* ── «Ikke implementert»-dialog ──────────────────────────────
          Gir Pengebruk-radene en reell handling, så knappene ikke er
          blindveier for tastatur- og skjermleserbrukere. */}
      <Dialog
        omitTriggerButton
        open={notImplemented !== null}
        noAnimation
        onClose={() => setNotImplemented(null)}
        title={notImplemented ?? ""}
        variant="information"
      >
        <P>Denne handlingen er ikke implementert i prototypen.</P>
      </Dialog>
    </Theme>
  );
}
