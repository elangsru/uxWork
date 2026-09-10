"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Button, Icon, Switch, Dropdown, List, TermDefinition, Tag, Flex,
  Avatar, Badge, CountryFlag, Anchor, FormStatus, Tooltip, Breadcrumb, Dialog, Autocomplete,
} from "@dnb/eufemia/components";
import Theme from "@dnb/eufemia/shared/Theme";
import { H1, H2, H3, P, Span, Hr } from "@dnb/eufemia/elements";
import { filter, close, check, account_medium, savings_account_medium, account_card_medium, card_medium, wallet_medium, coins_1_medium, location_medium, web_medium, history_medium, globe_medium, information_circled_medium, office_buildings_medium, phone_medium, bubble_medium, kid_number_medium, copy, ainvoice_medium, einvoice_medium, attachment_medium, file_pdf_medium, upload, download, paperclip_medium, loan_medium, question_medium, restaurant_medium, shopping_cart_medium, hanger_medium, travel_medium, bus_medium, car_1_medium, bandage_medium, baby_medium, dog_medium, house_1_medium, heart_rate_medium, laptop_medium, recurring_medium, shield_medium, pay_from_medium, hand_money_medium, house_value_medium } from "@dnb/eufemia/icons";
import * as EufemiaIcons from "@dnb/eufemia/icons";
import type { PaymentRecord } from "@/lib/payments";

/* ── Land → ISO-kode for CountryFlag ─────────────────────────────── */
const COUNTRY_ISO: Record<string, string> = {
  norge: "NO", sverige: "SE", danmark: "DK", finland: "FI",
  island: "IS", spania: "ES", tyskland: "DE", frankrike: "FR",
  storbritannia: "GB", nederland: "NL", italia: "IT", polen: "PL", usa: "US",
};

/* Felt som rendres i kortet og derfor ikke i detaljlisten */
const BENEFICIARY_LABELS =
  /^(logo\/avatar|logourl|mottaker navn|mottaker navn reservert|mottaker konto|mottaker konto ?type|mottaker land|mottaker adresse 1|mottaker adresse 2|mottaker postnr|mottaker sted\/by|mottaker web|mottaker orgnr|mottaker telefon|telefon|orgnr|org\.?nr\.?|organisasjonsnummer|melding|kid|pengebruk tag|dato|transaksjonsdato|reservert dato|reservasjonsdato|bokf[øo]rt dato|bokf[øo]ringsdato|rentedato|beløp|beløp nok|nok beløp|beløp valuta|valuta beløp|valutabeløp|vekslingskurs|valutasort|res(?:erv|v)ert melding|kontonavn|fra kontonavn|kontotype|konto type|fra konto type|kontonummer|fra kontonummer|fra konto|kortnavn|fra kortnavn|kortnummer|kortnummer pan|kortnummer\/pan|fra kortnummer\/pan|fra kortnummer pan|pan|kortnettverk|fra kortnettverk|kortnettverk logo|fra kortnettverk logo|digital wallet|digital wallet logo|klokkeslett|pengebruk sub|pengebruk main|pengebruk reservert|sas eurobonuspoeng|eurobonus poeng|sas bonus|betalingsprodukt|kvittering|efaktura|efaktura-vedlegg|betalingsbekreftelse|pris|gebyr|pris\/gebyr|lån avdrag|lån renter|kortreklamasjon(er)?|transaksjonsid|fra milj[øo]|pengebruk icon)$/i;

/* Valutakode → ISO-landkode for CountryFlag */
const CURRENCY_FLAG: Record<string, string> = {
  EUR: "EU", USD: "US", GBP: "GB", SEK: "SE",
  DKK: "DK", NOK: "NO", CHF: "CH", JPY: "JP",
  AUD: "AU", CAD: "CA", NZD: "NZ", HKD: "HK",
  SGD: "SG", PLN: "PL", CZK: "CZ", HUF: "HU",
  ISK: "IS", TRY: "TR", MXN: "MX", BRL: "BR",
  INR: "IN", CNY: "CN", ZAR: "ZA", THB: "TH",
};

function fieldValue(record: PaymentRecord | undefined, re: RegExp): string {
  return record?.fields.find((f) => re.test(f.label.trim()))?.value ?? "";
}

function fieldDisplay(record: PaymentRecord | undefined, re: RegExp, showNames: boolean): string {
  const field = record?.fields.find((f) => re.test(f.label.trim()));
  if (!field) return "";
  return showNames ? `{${field.label}}` : field.value;
}

/** Løser en logoverdi fra regnearket til en sti under /public.
 *  Godtar filnavn ("visa", "visa.svg", "Apple Pay", "Rema"), ferdig sti
 *  ("/wallet/vipps.svg") eller full URL – URL-er og absolutte stier brukes som de er. */
function logoSrc(value: string, folder: "kortnettverk" | "wallet" | "merchants"): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  // merchants-filene har stor forbokstav ("Rema.svg"), i motsetning til
  // kortnettverk/wallet som er små. Railway kjører Linux med case-sensitivt
  // filsystem, så her må vi beholde casingen fra arket.
  const stripped = raw.replace(/\s+/g, "");
  const file = folder === "merchants" ? stripped : stripped.toLowerCase();
  return `/${folder}/${/\.(svg|png|jpe?g|webp)$/i.test(file) ? file : `${file}.svg`}`;
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

/** Høyrestilt innhold for List.Cell.End, slik den nye listeraden i Figma viser
 *  beløp: hovedverdien i basis/medium (arves fra Cell.End) og en underlinje i
 *  small/regular under. Cell.End har ingen innebygd subline i 11.11.0 — den har
 *  bare fontSize/fontWeight — så stablingen gjøres her med Flex.Vertical.
 *
 *  Underlinja er alltid dempet, med samme farge som Subline
 *  variant="description" gir på venstresiden (rgb(115,115,115)). Den er en
 *  detalj under hovedverdien, ikke en likeverdig verdi.
 *
 *  Returnerer bare innmaten, ikke Cell.End selv: Flex.Container pakker ukjente
 *  barn i sine egne Flex.Item, så en wrapper-komponent rundt Cell.End ville
 *  kunne gi et ekstra ledd i radens flex-layout. */
function endStack(value: ReactNode, subline?: ReactNode): ReactNode {
  if (!subline) return value;
  return (
    <Flex.Vertical align="flex-end" gap={false}>
      <span>{value}</span>
      <Span size="small" weight="regular" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
        {subline}
      </Span>
    </Flex.Vertical>
  );
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
  const [toolsOpen, setToolsOpen]       = useState(false);
  const [showReserved, setShowReserved] = useState(false);
  const [hideFromSpending, setHideFromSpending] = useState(false);
  const [showSasBonus, setShowSasBonus]         = useState(true);
  const [showFieldNames, setShowFieldNames]     = useState(false);
  const [showLogo, setShowLogo]                 = useState(false);
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
    setToolsOpen(sessionStorage.getItem("toolsOpen") === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("darkMode", String(darkMode));
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("toolsOpen", String(toolsOpen));
  }, [toolsOpen, hydrated]);

  /* ── Datauttrekk ───────────────────────────────────────────────── */
  const selected         = payments.find((p) => p.type === selectedType);
  const fd               = (re: RegExp) => fieldDisplay(selected, re, showFieldNames);
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
  /* Egen sjekk, ikke isOverforing — den matcher «Overføring» og «Boliglån»,
     ikke «Utenlandsbetaling». Valutaraden vises på fire typer (Varekjøp Visa
     Utland, Utenlandsbetaling, ATM Visa, ATM Mastercard); bare denne kaller
     den «Overføringsvaluta». */
  const isUtenlandsbetaling = /utenlandsbetaling/i.test(selectedType);
  const tilLabel         = isGebyrRenter ? "Innbetalt" : isOverforing ? "Overført til" : "Betalt til";
  const fraLabel         = isOverforing ? "Overført fra" : "Betalt fra";
  const logoUrl          = fieldValue(selected, /^logourl$/i);
  // Innlimt URL → gammel oppførsel: avataren beholdes, logoen vises til høyre.
  // Filnavn ("Netflix") → logoen erstatter avataren, hentet fra /merchants.
  const logoIsUrl        = /^(https?:)?\/\//i.test(logoUrl.trim());
  const externalLogo     = showLogo && logoIsUrl ? logoUrl.trim() : "";
  const merchantLogo     = showLogo && !logoIsUrl ? logoSrc(logoUrl, "merchants") : "";

  const nokAmount        = fieldValue(selected, /^(beløp|beløp nok|nok beløp)$/i);
  const currencyAmount   = fieldValue(selected, /^(beløp valuta|valuta beløp|valutabeløp)$/i);
  const exchangeRate     = fieldValue(selected, /^(vekslingskurs)$/i);
  const currencyFlagIso  = CURRENCY_FLAG[currencyCode.trim().toUpperCase()];
  const sasPoints        = fieldValue(selected, /^(sas eurobonuspoeng|eurobonus poeng|sas bonus)$/i);
  const betalingsprodukt = fieldValue(selected, /^betalingsprodukt$/i);
  const prisGebyr        = fieldValue(selected, /^(pris|gebyr|pris\/gebyr)$/i);
  const avdrag           = fieldValue(selected, /^lån avdrag$/i);
  const renter           = fieldValue(selected, /^lån renter$/i);
  const hasLoanBreakdown = Boolean(avdrag || renter);
  /* Figma bruker actions/pay_from for straksbetaling og essentials/globe ellers. */
  const betalingsproduktIcon = /straksbetaling/i.test(betalingsprodukt) ? pay_from_medium : globe_medium;
  const reservedMessage  = fieldValue(selected, /^res(erv|v)ert melding$/i);
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
  const termDefRecord = payments.find((p) => /^termdefinition$/i.test(p.type));
  const td = (label: string, children: ReactNode = label): ReactNode => {
    const def = termDefRecord?.fields.find((f) => f.label === label)?.value;
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
  const hasCard       = Boolean(cardName || cardPan || cardNetwork);
  const cardSubline   = [cardPan, fraMiljo && `(${fraMiljo})`].filter(Boolean).join(" ");
  const isMastercard  = /mastercard/i.test(cardNetwork) || /mastercard/i.test(fromAccountType);
  /* Styrer om List.Container under beløpet skal rendres i det hele tatt —
     en tom Container ville gitt en ramme uten innhold. Må stå etter
     isMastercard, som SAS-raden avhenger av. */
  const hasAmountRows = Boolean(
    currencyAmount || exchangeRate || isMastercard || betalingsprodukt || prisGebyr || hasLoanBreakdown
  );

  const digitalWallet     = fieldValue(selected, /^digital wallet$/i);
  const digitalWalletLogo = fieldValue(selected, /^digital wallet logo$/i);
  const hasDigitalWallet = Boolean(digitalWallet);

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
     Boksen er 2rem for å matche Avatar size="medium", så listejusteringen
     holder seg lik på tvers av radene. */
  const beneficiaryMark: ReactNode = merchantLogo ? (
    <span
      style={{
        width: "2rem",
        height: "2rem",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img
        src={merchantLogo}
        alt={name}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
      />
    </span>
  ) : isGebyrRenter ? (
    /* Gebyr og renter har ingen mottaker — ikon i stedet for initial-avatar.
       Samme 2rem-boks som logoen, så radjusteringen holder seg. */
    <span
      style={{
        width: "2rem",
        height: "2rem",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon icon={hand_money_medium} size="medium" style={{ color: "var(--token-color-icon-action)" }} />
    </span>
  ) : (
    <Avatar size="medium" variant="primary">{initial}</Avatar>
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
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__chevron.dnb-list__item__chevron { place-self: center; display: flex; }
        .dnb-list__item__accordion--open { --item-background-color: var(--token-color-background-neutral-subtle); }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__icon.dnb-list__item__icon { place-self: center; }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__title.dnb-list__item__title { align-self: center; }
        .dnb-list__item__accordion__header.dnb-list__item__accordion__header .dnb-list__item__end.dnb-list__item__end { align-self: center; }
        .dnb-list__item.dnb-list__item .dnb-list__item__icon.dnb-list__item__icon { place-self: center; }
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
        /* FormStatus krymper men vokser aldri tilbake ved resize. Årsaken ligger
           i updateWidth(): den er laget for skjemafelt og slår opp feltet
           statusen tilhører via en selector avledet av id-en, måler bredden og
           fryser den som inline max-width. Vår FormStatus er frittstående uten
           felt, så oppslaget gir feil tall og verdien blir stående — 30rem
           (480px) selv når containeren er 960px.

           min-width tilfredsstiller vaktsetningen
             hasCustomWidth = element.style.maxWidth ? false
               : style.minWidth !== '' && style.minWidth !== 'auto' || ...
             if (!hasCustomWidth) element.style.maxWidth = remWidth
           så Eufemia slutter å skrive max-width i det hele tatt. max-width:none
           med !important nøytraliserer en verdi som eventuelt rakk å bli satt
           før stilarket lastet — inline stil slår klassespesifisitet. */
        .td-status-fullwidth { min-width: 0; max-width: none !important; }
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
              { text: "Hjem", href: "#" },
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
            {selected && <P style={{ margin: 0 }}>{dateTimeDisplay}</P>}
            {/* Skiller sidehodet fra innholdet. top="small" (16px) legger seg
                til wrapperens 8px gap = 24px luft over streken. */}
            <Hr top="small" bottom={0} />
          </div>

          {/* ── Innhold ────────────────────────────────────────── */}
          {payments.length === 0 ? (
            <P>Ingen betalinger funnet i regnearket.</P>
          ) : selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

              {/* ── Beløpsmodul ──────────────────────────────────
                  Bygget som Betalt fra: beløpet fritt over en List.Container.
                  List.Cell.Title tilbyr bare basis/small som fontSize, så en
                  H2 på 34px hører ikke hjemme i en rad. Ikoner går gjennom
                  List sine egne slots: ekte Eufemia-ikoner via icon-propen
                  (ItemIcon wrapper dem i <Icon size="medium">), flagg og
                  logoer via List.Cell.Start. Fargen på ikonene kommer fra
                  .dnb-list__item__icon-regelen øverst, så ingen inline color. */}
              {(nokAmount || hasLoanBreakdown) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {nokAmount && (
                    <H2 size="x-large" style={{ margin: 0, ...(showReserved && { color: "var(--token-color-text-neutral-alternative)" }) }}>NOK {fd(/^(beløp|beløp nok|nok beløp)$/i)}</H2>
                  )}

                  {showReserved && reservedMessage && (
                    /* bottom="small" gir luft ned til det som følger. Flex-gap
                       kollapser ikke med margin, så 16px legges til wrapperens
                       8px = 24px under meldingen.

                       stretch må stå: den er det som gjør at bakgrunnen fyller
                       bredden i stedet for å hugge teksten. Bieffekten er en
                       inline max-width som ikke vokser tilbake ved resize —
                       den nøytraliseres av .td-status-fullwidth. */
                    <FormStatus
                      className="td-status-fullwidth"
                      text={showFieldNames ? fd(/^res(erv|v)ert melding$/i) : reservedMessage}
                      state="information"
                      stretch
                      bottom="small"
                    />
                  )}

                  {hasAmountRows && (
                    <List.Container>
                      {/* Valutakjøp. Flagget må ligge i Cell.Start, ikke
                          icon-propen: ItemBasic rendrer icon → title →
                          children, så en Cell.Start som child havner etter
                          tittelen. Derfor children-formen på radene med
                          flagg og avatar. */}
                      {(currencyAmount || exchangeRate) && (
                        <List.Item.Basic>
                          {currencyFlagIso && (
                            <List.Cell.Start>
                              <CountryFlag iso={currencyFlagIso} size="medium" />
                            </List.Cell.Start>
                          )}
                          <List.Cell.Title>{td(isUtenlandsbetaling ? "Overføringsvaluta" : "Valutakjøp")}</List.Cell.Title>
                          <List.Cell.End>
                            {endStack(
                              `${currencyCode ? `${fd(/^valutasort$/i)} ` : ""}${fd(/^(beløp valuta|valuta beløp|valutabeløp)$/i)}`,
                              exchangeRate ? `Vekslingskurs ${fd(/^vekslingskurs$/i)}` : undefined,
                            )}
                          </List.Cell.End>
                        </List.Item.Basic>
                      )}

                      {/* Transaksjonskostnad. Betalingsproduktet er underlinje
                          under prisen, ikke egen rad — slik Figma viser det.
                          Mangler prisen, står produktet som hovedverdi i stedet
                          for å etterlate en tom høyreside. */}
                      {(betalingsprodukt || prisGebyr) && (
                        <List.Item.Basic
                          icon={betalingsproduktIcon}
                          title={td("Transaksjonskostnad")}
                        >
                          <List.Cell.End>
                            {endStack(
                              prisGebyr
                                ? `NOK ${fd(/^(pris|gebyr|pris\/gebyr)$/i)}`
                                : fd(/^betalingsprodukt$/i),
                              prisGebyr && betalingsprodukt ? fd(/^betalingsprodukt$/i) : undefined,
                            )}
                          </List.Cell.End>
                        </List.Item.Basic>
                      )}

                      {/* SAS Eurobonus. Avatar med src i stedet for en rå <img>:
                          Figma peker på Eufemias Avatar, og hasLabel demper
                          «Avatar group required»-advarselen siden raden selv
                          gir konteksten. */}
                      {isMastercard && (
                        <List.Item.Basic>
                          <List.Cell.Start>
                            {/* backgroundColor må settes: Avatar er primary som
                                default, og SAS-merket er #0002BE — blått på
                                DNB-grønt forsvinner. Figma viser logoen på
                                nøytral flate. */}
                            <Avatar
                              size="small"
                              src="/merchants/SAS-wordmark.svg"
                              alt="SAS"
                              hasLabel
                              backgroundColor="var(--token-color-background-neutral)"
                            />
                          </List.Cell.Start>
                          <List.Cell.Title>
                            {showSasBonus && sasPoints
                              ? td("SAS Eurobonus")
                              : "Få Eurobonuspoeng når du bruker ditt Mastercard"}
                          </List.Cell.Title>
                          {/* fontWeight="regular" på lenkevarianten: Cell.End er
                              medium som default, som er riktig for et beløp, men
                              gjør lenken tyngre enn «Vis i kart» og de andre
                              lenkene i lista. Poengsummen beholder medium. */}
                          <List.Cell.End fontWeight={showSasBonus && sasPoints ? "medium" : "regular"}>
                            {showSasBonus && sasPoints
                              ? `${fd(/^(sas eurobonuspoeng|eurobonus poeng|sas bonus)$/i)} poeng`
                              : <Anchor href="https://www.dnb.no/kort/kredittkort/mastercard/upgrade" target="_blank" rel="noopener noreferrer">Les mer</Anchor>}
                          </List.Cell.End>
                        </List.Item.Basic>
                      )}

                      {/* Avdrag + renter (boliglån). Én rad med underlinje på
                          begge sider: labelene til venstre, beløpene til høyre.
                          Renter-linja er dempet (variant="description", samme
                          grå som kontonumrene) siden den er en detalj under
                          avdraget, ikke en likeverdig verdi. I 11.11.0 endrer
                          varianten bare fargen — fontSize er small uansett.
                          Degraderer til én linje når bare ett av feltene finnes. */}
                      {hasLoanBreakdown && (
                        <List.Item.Basic icon={loan_medium}>
                          <List.Cell.Title>
                            {avdrag ? td("Avdrag lån") : td("Renter lån")}
                            {avdrag && renter && (
                              <List.Cell.Title.Subline variant="description">Renter lån</List.Cell.Title.Subline>
                            )}
                          </List.Cell.Title>
                          <List.Cell.End>
                            {endStack(
                              avdrag ? `NOK ${fd(/^lån avdrag$/i)}` : `NOK ${fd(/^lån renter$/i)}`,
                              avdrag && renter ? `NOK ${fd(/^lån renter$/i)}` : undefined,
                            )}
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
                            <Badge content={<CountryFlag iso={flagIso} size="small" />} vertical="bottom" horizontal="right" variant="content">
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
                        {externalLogo && (
                          <List.Cell.End fontWeight="regular">
                            <img src={externalLogo} alt={name} style={{ height: "24px", width: "auto", display: "block" }} />
                          </List.Cell.End>
                        )}
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
                            {/* Avtalegiro: chevron i stedet for lenke til høyre.
                                List.Item.Action gjør hele raden klikkbar og gir
                                chevronen, så en Anchor i List.Cell.End er overflødig.
                                Trygt her fordi «Avtalegiro» ikke har ordforklaring i
                                regnearket — en TermDefinition er en knapp, og den
                                ville blitt nøstet inne i radens lenke.

                                target/rel må settes eksplisitt: med href rendrer
                                Action en <Anchor noStyle>, som verken arver
                                target="_blank" eller legger på launch-ikonet. */}
                            {isAvtalegiro && (
                              <List.Item.Action
                                className="td-chevron-row"
                                icon={ainvoice_medium}
                                title={td("Avtalegiro")}
                                href="https://www.dnb.no/segp/ps/applikasjoner/payment-agreements/DirectDebit/70011960764123/details"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            )}
                            {/* eFakturahistorikk: lenke til høyre, ikke klikkbar rad.
                                Anchor med target="_blank" gir launch-ikonet
                                automatisk — det er nettopp dette ikonet som utløser
                                Eufemias :has()-regel og skjuler chevronen på
                                Avtalegiro-raden over, derfor .td-chevron-row der. */}
                            {isEfaktura && (
                              <List.Item.Basic icon={einvoice_medium} title={td("eFakturahistorikk")}>
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
                            <List.Item.Basic icon={history_medium} title={td("Historikk", "Betalingshistorikk")}>
                              <List.Cell.End fontWeight="regular">
                                <Anchor href="#" target="_blank">
                                  Vis transaksjoner
                                </Anchor>
                              </List.Cell.End>
                            </List.Item.Basic>
                            {(/^ja$/i.test(kortreklamasjoner) || showFieldNames) && (
                              <List.Item.Basic icon={question_medium} title={td("Kortreklamasjon", "Ukjent transaksjon")}>
                                <List.Cell.End fontWeight="regular">
                                  {showFieldNames
                                    ? fd(/^kortreklamasjon(er)?$/i)
                                    : <Anchor href="https://www.dnb.no/segp/apps/besok/card_complaints/dashboard?segment=segp" target="_blank">Rapporter</Anchor>}
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
                              : <img src={logoSrc(cardNetworkLogo, "kortnettverk")} alt={cardNetwork} style={{ height: "24px", width: "auto", display: "block" }} />
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
                              ? <Tooltip targetElement={<img src={logoSrc(digitalWalletLogo, "wallet")} alt={digitalWallet} style={{ height: "24px", width: "auto", display: "block" }} />}>{`Betalt med ${digitalWallet}`}</Tooltip>
                              : null}
                        </List.Cell.End>
                      </List.Item.Basic>
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

              {/* ── Detaljer ──────────────────────────────────────── */}
              {(transaksjonsDato || reservertDate || bokfortDato || rentedato) && (
                <div>
                <List.Container>
                  <List.Item.Accordion icon={information_circled_medium}>
                    <List.Item.Accordion.Header>
                      <List.Cell.Title>Detaljer</List.Cell.Title>
                    </List.Item.Accordion.Header>
                    <List.Item.Accordion.Content>
                      <div className="dnb-card" style={{ borderTop: "1px solid var(--token-color-stroke-neutral-subtle)" }}>
                        <List.Container>
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
      <div style={{ position: "fixed", top: "32px", right: "32px", zIndex: 100 }}>
        <Button
          variant="secondary"
          icon={filter}
          aria-label="Tools menu"
          onClick={() => setToolsOpen((o) => !o)}
          style={{ borderRadius: "50%", width: "48px", height: "48px", padding: 0 }}
        />
      </div>

      {/* ── Konfigurasjons-popover ─────────────────────────────────── */}
      {toolsOpen && (
        <div style={{
          position: "fixed", top: "92px", right: "32px",
          maxHeight: "calc(100vh - 124px)",
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
            <P size="basis" style={{ margin: 0 }}>For experimenting purposes only...</P>
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
            <P size="basis" style={{ margin: 0 }}>Vis feltnavn</P>
            <Switch label="Vis feltnavn" labelSrOnly checked={showFieldNames} onChange={({ checked }) => setShowFieldNames(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle)", borderRadius: "8px", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Dark mode</P>
            <Switch label="Dark mode" labelSrOnly checked={darkMode} onChange={({ checked }) => setDarkMode(checked)} />
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
