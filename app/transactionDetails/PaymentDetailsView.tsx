"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Button, Icon, Switch, Dropdown, List, TermDefinition, Tag,
  Avatar, Badge, CountryFlag, Anchor, FormStatus, Tooltip, Breadcrumb,
} from "@dnb/eufemia/components";
import Theme from "@dnb/eufemia/shared/Theme";
import { H2, P, Hr } from "@dnb/eufemia/elements";
import { filter, close, account_medium, savings_account_medium, account_card_medium, card_medium, wallet_medium, coins_1_medium, location_medium, web_medium, history_medium, globe_medium, information_circled_medium, office_buildings_medium, phone_medium, bubble_medium, kid_number_medium, copy, ainvoice_medium, einvoice_medium, attachment_medium, file_pdf_medium, upload, download, paperclip_medium, loan_medium, question_medium, launch, restaurant_medium, shopping_cart_medium, hanger_medium, travel_medium, bus_medium, car_1_medium, bandage_medium, baby_medium, dog_medium, house_1_medium, heart_rate_medium, laptop_medium, recurring_medium, shield_medium, stopwatch_medium, hand_money_medium, house_value_medium } from "@dnb/eufemia/icons";
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
  const betalingsproduktIcon = /straksbetaling/i.test(betalingsprodukt) ? stopwatch_medium : globe_medium;
  const reservedMessage  = fieldValue(selected, /^res(erv|v)ert melding$/i);
  const transaksjonsDato = fieldValue(selected, /^transaksjonsdato$/i);
  const reservertDate    = fieldValue(selected, /^(reservert dato|reservasjonsdato)$/i);
  const bokfortDato      = fieldValue(selected, /^(bokf[øo]rt dato|bokf[øo]ringsdato)$/i);
  const rentedato        = fieldValue(selected, /^rentedato$/i);
  const sectionDate      = formatDateNo(showReserved && reservertDate ? reservertDate : transaksjonsDato);
  const klokkeslett      = fieldValue(selected, /^klokkeslett$/i);
  const sectionDateTime  = klokkeslett ? `${sectionDate} - ${klokkeslett}` : sectionDate;


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

  const digitalWallet     = fieldValue(selected, /^digital wallet$/i);
  const digitalWalletLogo = fieldValue(selected, /^digital wallet logo$/i);
  const hasDigitalWallet = Boolean(digitalWallet);

  const pengebrukSub  = fieldValue(selected, /^pengebruk sub$/i);
  const pengebrukMain = fieldValue(selected, /^pengebruk main$/i);
  const pengebrukIconField = fieldValue(selected, /^pengebruk icon$/i);
  const pengebrukReservert = fieldValue(selected, /^pengebruk reservert$/i);
  const hasPengebruk  = Boolean(pengebrukSub || pengebrukMain || (showReserved && pengebrukReservert));
  const pengebrukIcon = ((pengebrukIconField ? lookupEufemiaIcon(pengebrukIconField) : null) ?? getPengebrukIcon(pengebrukSub || pengebrukMain)) as ReturnType<typeof getPengebrukIcon>;
  const transactionTags = fieldValue(selected, /^pengebruk tag$/i)
    .split(",").map((t) => t.trim()).filter(Boolean);

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

          {/* ── Innhold ────────────────────────────────────────── */}
          {payments.length === 0 ? (
            <P>Ingen betalinger funnet i regnearket.</P>
          ) : selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

              {/* ── Beløpsmodul ────────────────────────────────── */}
              {(nokAmount || hasLoanBreakdown) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <P style={{ margin: 0, fontWeight: 600 }}>{showFieldNames ? `${fd(showReserved && reservertDate ? /^(reservert dato|reservasjonsdato)$/i : /^transaksjonsdato$/i)}${klokkeslett ? ` - ${fd(/^klokkeslett$/i)}` : ""}` : sectionDateTime}</P>
                  <div style={{
                    border: "1px solid var(--token-color-stroke-neutral-subtle)",
                    borderRadius: "24px",
                    backgroundColor: "var(--token-color-background-neutral)",
                    backgroundImage: showReserved
                      ? "repeating-linear-gradient(-45deg, var(--token-color-stroke-neutral-subtle) 1px 2px, transparent 0 6px)"
                      : undefined,
                    overflow: "hidden",
                  }}>
                    {/* NOK-beløp */}
                    {nokAmount && (
                    <div style={{ padding: "16px" }}>
                      <H2 size="x-large" style={{ margin: 0, ...(showReserved && { color: "var(--token-color-text-neutral-alternative)" }) }}>NOK {fd(/^(beløp|beløp nok|nok beløp)$/i)}</H2>
                    </div>
                    )}

                    {/* Reservert-melding (FormStatus) */}
                    {showReserved && reservedMessage && (
                      <div style={{ padding: "0 16px 12px" }}>
                        <FormStatus
                          text={showFieldNames ? fd(/^res(erv|v)ert melding$/i) : reservedMessage}
                          state="information"
                          stretch
                        />
                      </div>
                    )}

                    {/* Valuta + vekslingskurs — én rad */}
                    {(currencyAmount || exchangeRate) && (
                      <>
                        <div style={{ padding: "0 16px" }}><Hr space={0} /></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px" }}>
                          {currencyFlagIso && <CountryFlag iso={currencyFlagIso} size="medium" />}
                          <P style={{ margin: 0 }}>
                            {currencyCode && `${fd(/^valutasort$/i)} `}{fd(/^(beløp valuta|valuta beløp|valutabeløp)$/i)}{exchangeRate && ` (vekslingskurs ${fd(/^vekslingskurs$/i)})`}
                          </P>
                        </div>
                      </>
                    )}

                    {/* SAS Eurobonus */}
                    {isMastercard && (
                      <>
                        <div style={{ padding: "0 16px" }}><Hr space={0} /></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px" }}>
                          <img src="/merchants/SAS.svg" alt="SAS" width={24} height={24} style={{ flexShrink: 0 }} />
                          <P style={{ margin: 0 }}>
                            {showSasBonus && sasPoints
                              ? `SAS Eurobonuspoeng ${fd(/^(sas eurobonuspoeng|eurobonus poeng|sas bonus)$/i)}`
                              : "Få Eurobonuspoeng når du bruker ditt Mastercard"}
                          </P>
                          {showSasBonus && sasPoints && (
                            <Anchor href="https://www.sas.no" target="_blank" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>Full saldo på sas.no</Anchor>
                          )}
                          {!showSasBonus && (
                            <Anchor href="https://www.dnb.no/kort/kredittkort/mastercard/upgrade" target="_blank" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>Les mer</Anchor>
                          )}
                        </div>
                      </>
                    )}

                    {/* Betalingsprodukt + Pris/gebyr */}
                    {(betalingsprodukt || prisGebyr) && (
                      <>
                        <div style={{ padding: "0 16px" }}><Hr space={0} /></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px" }}>
                          {betalingsproduktIcon && <Icon icon={betalingsproduktIcon} size="medium" style={{ flexShrink: 0, color: "var(--token-color-icon-action)" }} />}
                          <P style={{ margin: 0 }}>
                            {td("Betalingsprodukt", fd(/^betalingsprodukt$/i))}
                            {prisGebyr && ` NOK ${fd(/^(pris|gebyr|pris\/gebyr)$/i)}`}
                          </P>
                        </div>
                      </>
                    )}

                    {/* Avdrag + Renter (boliglån) */}
                    {hasLoanBreakdown && (
                      <>
                        <div style={{ padding: "0 16px" }}><Hr space={0} /></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px" }}>
                          <Icon icon={loan_medium} size="medium" style={{ flexShrink: 0, color: "var(--token-color-icon-action)" }} />
                          <P style={{ margin: 0 }}>
                            {showFieldNames
                              ? `${fd(/^lån avdrag$/i)} og ${fd(/^lån renter$/i)}`
                              : [avdrag && `Avdrag: NOK ${avdrag}`, renter && `Renter: NOK ${renter}`].filter(Boolean).join(" og ")
                            }
                          </P>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Beneficiary-kort ───────────────────────────── */}
              {hasBeneficiary && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <P style={{ margin: 0, fontWeight: 600 }}>{tilLabel}</P>
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
                                  <Anchor
                                    href="#"
                                    icon={copy}
                                    tooltip="Kopier KID-nummer"
                                    iconPosition="right"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigator.clipboard.writeText(kid);
                                      setKidCopied(true);
                                      setTimeout(() => setKidCopied(false), 2000);
                                    }}
                                  >
                                    {showFieldNames ? fd(/^kid$/i) : kid}
                                  </Anchor>
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {hasAddress && (
                              <List.Item.Basic icon={location_medium} title={td("Adresse")}>
                                <List.Cell.End fontWeight="regular">
                                  {address1   && <span style={{ display: "block" }}>{fd(/^mottaker adresse 1$/i)}</span>}
                                  {address2   && <span style={{ display: "block" }}>{fd(/^mottaker adresse 2$/i)}</span>}
                                  {postalLine && (
                                    <span style={{ display: "block" }}>
                                      {showFieldNames
                                        ? [fd(/^mottaker postnr$/i), fd(/^mottaker sted\/by$/i)].filter(Boolean).join(" ")
                                        : postalLine}
                                    </span>
                                  )}
                                  {hasStreetAddress && (
                                    <Anchor
                                      href={`https://maps.google.com/?q=${encodeURIComponent([address1, address2, postalLine, country].filter(Boolean).join(", "))}`}
                                      target="_blank"
                                      style={{ display: "block", marginTop: "8px" }}
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
                            {isAvtalegiro && (
                              <List.Item.Basic icon={ainvoice_medium} title={td("Avtalegiro")}>
                                <List.Cell.End fontWeight="regular">
                                  <Anchor href="https://www.dnb.no/segp/ps/applikasjoner/payment-agreements/DirectDebit/70011960764123/details" target="_blank">
                                    Vis avtale
                                  </Anchor>
                                </List.Cell.End>
                              </List.Item.Basic>
                            )}
                            {isEfaktura && (
                              <List.Item.Basic icon={einvoice_medium} title={td("eFakturahistorikk")}>
                                <List.Cell.End fontWeight="regular">
                                  <Anchor href="https://www.dnb.no/segp/ps/applikasjoner/payment-agreements/einvoice/mine/issuers/917245975" icon={launch} iconPosition="right" target="_blank">
                                    Vis eFakturaer
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
                            {(/^ja$/i.test(kortreklamasjoner) || showFieldNames) && (
                              <List.Item.Basic icon={question_medium} title={td("Kortreklamasjon", "Ukjent transaksjon")}>
                                <List.Cell.End fontWeight="regular">
                                  {showFieldNames
                                    ? fd(/^kortreklamasjon(er)?$/i)
                                    : <Anchor href="https://www.dnb.no/segp/apps/besok/card_complaints/dashboard?segment=segp" icon={launch} iconPosition="right" target="_blank">Rapporter</Anchor>}
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
                  <P style={{ margin: 0, fontWeight: 600 }}>{fraLabel}</P>
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

              {/* ── Pengebruk ──────────────────────────────────── */}
              {hasPengebruk && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <P style={{ margin: 0, fontWeight: 600 }}>Pengebruk</P>
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
                              <List.Item.Action title="Bytt kategori" />
                              <List.Item.Action title="Splitt transaksjonen" />
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
                                    <Tag variant="addable" onClick={() => setExtraTags((prev) => [...prev, "#eksempel tag"])}>Legg til</Tag>
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
      <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 100 }}>
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
          position: "fixed", bottom: "92px", right: "32px",
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
    </Theme>
  );
}
