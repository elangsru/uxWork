"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Icon, List, Switch, Textarea } from "@dnb/eufemia/components";
import { H1, H2, H3, P } from "@dnb/eufemia/elements";
import { transfer_to, thumbs_up, thumbs_down, filter, close } from "@dnb/eufemia/icons";

const PAYMENT = {
  fromName: "Lønnskonto",
  fromNumber: "7001 19 60764",
  toName: "Espen Lunar",
  toNumber: "9602 07 17286",
  amount: "1,00 kr",
  date: "21. september 2025",
};

export default function InternationalPaymentConfirmation() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fullWidth, setFullWidth] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentType, setPaymentType] = useState("sepa");
  const [costOption, setCostOption] = useState("delt");
  const [fromName, setFromName] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [toName, setToName] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [amountInNok, setAmountInNok] = useState(false);
  const [currencyCode, setCurrencyCode] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    const fw = sessionStorage.getItem("fullWidth");
    const dm = sessionStorage.getItem("darkMode");
    const to = sessionStorage.getItem("toolsOpen");
    setFullWidth(fw === null ? true : fw === "true");
    setDarkMode(dm === "true");
    setToolsOpen(to === "true");
    setMessage(sessionStorage.getItem("message") ?? "");
    setPaymentType(sessionStorage.getItem("paymentType") ?? "sepa");
    setCostOption(sessionStorage.getItem("costOption") ?? "delt");
    setFromName(sessionStorage.getItem("fromName") ?? "");
    setFromNumber(sessionStorage.getItem("fromNumber") ?? "");
    setToName(sessionStorage.getItem("toName") ?? "");
    setToNumber(sessionStorage.getItem("toNumber") ?? "");
    setAmount(sessionStorage.getItem("amount") ?? "");
    setAmountInNok(sessionStorage.getItem("amountInNok") === "true");
    setCurrencyCode(sessionStorage.getItem("currencyCode") ?? "");
    setPaymentDate(sessionStorage.getItem("paymentDate") ?? "");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("fullWidth", String(fullWidth));
  }, [fullWidth, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("darkMode", String(darkMode));
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem("toolsOpen", String(toolsOpen));
  }, [toolsOpen, hydrated]);

  if (!hydrated) {
    return <div style={{ minHeight: "100vh", background: "var(--token-color-background-neutral-subtle)" }} />;
  }

  const isEuropa = paymentType === "europa";
  const isSepa = paymentType === "sepa";
  const cost = isEuropa
    ? 30
    : isSepa
    ? 0
    : costOption === "jeg"
    ? 410
    : costOption === "mottaker"
    ? 0
    : 60;
  const costLabel = isEuropa
    ? "Pris - Europa-betaling"
    : isSepa
    ? "Pris - SEPA-betaling"
    : "Pris - Cross border-betaling";
  const fmtNok = (v: number) => v.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  };
  const costDisplay = isEuropa
    ? "kr 30,00"
    : isSepa
    ? "kr 0,00"
    : `NOK ${fmtNok(cost)}`;

  const exchangeRates: Record<string, number> = {
    EUR: 10.84, USD: 9.85, GBP: 12.85, SEK: 0.95, DKK: 1.46, CHF: 11.5, JPY: 0.064, NOK: 1,
  };
  const rate = currencyCode ? exchangeRates[currencyCode] ?? 1 : 1;
  const amountNum = parseFloat(amount.replace(",", ".")) || 0;
  const foreignAmount = amountInNok ? amountNum / rate : amountNum;
  const nokAmount = amountInNok ? amountNum : amountNum * rate;

  return (
    <Theme colorScheme={darkMode ? "dark" : "light"}>
      <style>{`
        .receipt-list .dnb-list__item::after { display: none !important; }
        .receipt-list .dnb-list__item { border-radius: 0 !important; }
        .receipt-list .dnb-list__item:not(:last-child) {
          border-bottom: 1px solid var(--token-color-stroke-neutral-subtle);
        }
      `}</style>
      <div
        style={{
          background: "var(--token-color-background-neutral-subtle)",
          minHeight: "100vh",
          padding: "48px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "var(--token-color-background-neutral)",
            boxShadow: "0px 8px 16px 0px rgba(51,51,51,0.08)",
            padding: "48px 96px",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            minHeight: "calc(100vh - 96px)",
            boxSizing: "border-box",
            maxWidth: "72rem",
            margin: "0 auto",
            width: "100%",
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: fullWidth ? "100%" : "488px", width: "100%" }}>
            <H1 size="x-large">Betale til utlandet</H1>

          {/* Confirmation card */}
          <div
            style={{
              outline: "1px solid var(--token-color-stroke-neutral-alternative)",
              borderRadius: "var(--token-radius-lg)",
              padding: "32px",
              display: "flex",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <svg
              width="96"
              height="86"
              viewBox="0 0 200.095 178.42"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              <path
                d="M178.39 91.5384C178.85 73.9001 174.07 56.5213 164.653 41.5998C155.237 26.6783 141.607 14.8843 125.487 7.70925C109.368 0.534179 91.4825 -1.69969 74.0934 1.29014C56.7042 4.27997 40.5922 12.3592 27.7948 24.5062C14.9974 36.6531 6.08942 52.3222 2.19741 69.5319C-1.69461 86.7416 -0.395883 104.719 5.92936 121.191C12.2546 137.662 23.3223 151.888 37.7327 162.07C52.1432 172.251 69.2492 177.93 86.8875 178.39C110.538 179.006 133.465 170.202 150.625 153.914C167.785 137.626 177.772 115.189 178.39 91.5384Z"
                fill="#00353F"
              />
              <path
                transform="translate(28.49 13.63)"
                d="M47.9049 134.31L1.81338 73.8349C0.410342 72.0288 -0.217757 69.7393 0.0672565 67.4701C0.35227 65.2009 1.52705 63.1379 3.33315 61.7348C5.13926 60.3318 7.42874 59.7037 9.69794 59.9887C11.9671 60.2737 14.0302 61.4485 15.4332 63.2546L48.6524 106.34C68.3513 82.1563 124.309 14.8709 160.584 0.503667C162.594 -0.224496 164.805 -0.161142 166.77 0.680884C168.735 1.52291 170.306 3.08059 171.165 5.03808C171.819 7.05167 171.72 9.23445 170.886 11.1806C170.052 13.1267 168.54 14.7037 166.63 15.6184C128.079 30.7331 55.4955 123.73 55.4955 124.494L47.9049 134.31Z"
                fill="#00B07D"
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <H2 style={{ margin: 0 }}>Fullført</H2>
                <P>Betaling lagt til forfall</P>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  text="Ny betaling"
                  icon={transfer_to}
                  iconPosition="left"
                  href="/internationalPayment"
                />
                <Button
                  variant="secondary"
                  text="Betalingsoversikt"
                  href="/paymentsOverview"
                />
              </div>
            </div>
          </div>

          {/* Detaljer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <H3 style={{ margin: 0 }}>Detaljer</H3>
            <div
              className="receipt-list"
              style={{
                outline: "1px solid var(--token-color-stroke-neutral-alternative)",
                borderRadius: "var(--token-radius-lg)",
                overflow: "hidden",
              }}
            >
              <List.Container>
                <List.Item.Basic>
                  <List.Cell.Title>Betalingsdato</List.Cell.Title>
                  <List.Cell.End>{fmtDate(paymentDate)}</List.Cell.End>
                </List.Item.Basic>
                <List.Item.Basic>
                  <List.Cell.Title>Betalt fra</List.Cell.Title>
                  <List.Cell.End>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.3 }}>
                      <span>{fromName || "—"}</span>
                      {fromName && (
                        <span style={{ color: "var(--token-color-text-neutral-alternative)", fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-regular)" }}>{fromNumber}</span>
                      )}
                    </div>
                  </List.Cell.End>
                </List.Item.Basic>
                <List.Item.Basic>
                  <List.Cell.Title>Betalt til</List.Cell.Title>
                  <List.Cell.End>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.3 }}>
                      <span>{toName || "—"}</span>
                      {toName && (
                        <span style={{ color: "var(--token-color-text-neutral-alternative)", fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-regular)" }}>{toNumber}</span>
                      )}
                    </div>
                  </List.Cell.End>
                </List.Item.Basic>
                <List.Item.Basic>
                  <List.Cell.Title>Beløp</List.Cell.Title>
                  <List.Cell.End>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.3 }}>
                      <span>{currencyCode || "—"} {fmtNok(foreignAmount)}</span>
                      <span style={{ color: "var(--token-color-text-neutral-alternative)", fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-regular)" }}>≈ NOK {fmtNok(nokAmount)} (estimert)</span>
                    </div>
                  </List.Cell.End>
                </List.Item.Basic>
                <List.Item.Basic>
                  <List.Cell.Title>{costLabel}</List.Cell.Title>
                  <List.Cell.End>{costDisplay}</List.Cell.End>
                </List.Item.Basic>
                {message && (
                  <List.Item.Basic>
                    <List.Cell.Title>Melding</List.Cell.Title>
                    <List.Cell.End>&ldquo;{message}&rdquo;</List.Cell.End>
                  </List.Item.Basic>
                )}
              </List.Container>
            </div>
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div
              style={{
                background: "var(--token-color-background-info-subtle)",
                borderRadius: "var(--token-radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <P style={{ margin: 0 }}>Hva synes du om den løsningen for betale til utlandet?</P>
              <div style={{ display: "flex", gap: "24px" }}>
                <Button variant="tertiary" text="Liker" icon={thumbs_up} iconPosition="right" onClick={() => setFeedback("like")} />
                <Button variant="tertiary" text="Liker ikke" icon={thumbs_down} iconPosition="right" onClick={() => setFeedback("dislike")} />
              </div>
              {feedback && (
                <Textarea
                  label={
                    <>
                      Vil du legge til noe?{" "}
                      <span style={{ color: "var(--token-color-text-neutral-alternative)", fontWeight: "normal" }}>(Valgfritt)</span>
                    </>
                  }
                  rows={4}
                  stretch
                  placeholder="Ikke oppgi personlige opplysninger eller sensitiv informasjon i dette feltet."
                  value={feedbackText}
                  onChange={({ value }) => setFeedbackText(value)}
                />
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Tools button */}
      <div style={{ position: "fixed", top: "32px", right: "32px", zIndex: 100 }}>
        <Button
          variant="secondary"
          icon={filter}
          aria-label="Tools menu"
          onClick={() => setToolsOpen((o) => !o)}
          style={{ borderRadius: "50%", width: "48px", height: "48px", padding: 0 }}
        />
      </div>

      {/* Tools popover */}
      {toolsOpen && (
        <div
          style={{
            position: "fixed",
            top: "92px",
            right: "32px",
            background: "var(--token-color-background-neutral)",
            border: "1px solid var(--token-color-stroke-neutral-subtle, #ebebeb)",
            filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.08))",
            borderRadius: "var(--token-radius-md, 8px)",
            minWidth: "440px",
            maxWidth: "560px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 99,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <P size="basis" style={{ fontWeight: 500, margin: 0 }}>Configurations menu</P>
              <button
                onClick={() => setToolsOpen(false)}
                aria-label="Lukk"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon icon={close} size="small" />
              </button>
            </div>
            <P size="basis" style={{ margin: 0 }}>
              For experimenting purposes only...
            </P>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Full width</P>
            <Switch label="Full width" labelSrOnly checked={fullWidth} onChange={({ checked }) => setFullWidth(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Dark mode</P>
            <Switch label="Dark mode" labelSrOnly checked={darkMode} onChange={({ checked }) => setDarkMode(checked)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>Show feedback</P>
            <Switch label="Show feedback" labelSrOnly checked={showFeedback} onChange={({ checked }) => setShowFeedback(checked)} />
          </div>
        </div>
      )}
    </Theme>
  );
}
