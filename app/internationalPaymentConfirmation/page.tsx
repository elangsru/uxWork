"use client";

import { useState, type CSSProperties } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Icon, List, Switch } from "@dnb/eufemia/components";
import { H1, H2, H3, P } from "@dnb/eufemia/elements";
import { check_medium, transfer_to, thumbs_up, thumbs_down, filter, close } from "@dnb/eufemia/icons";

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
  const [showFeedback, setShowFeedback] = useState(true);

  return (
    <Theme colorScheme="light">
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
          }}
        >
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
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--token-color-background-success-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon icon={check_medium} size="medium" color="var(--token-color-icon-success)" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <H2 style={{ margin: 0 }}>Betalingen er lagt til forfall.</H2>
                <P>Du finner betalingen i betalingsoversikten.</P>
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
                  text="Til betalingsoversikt"
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
                  <List.Cell.Title>Betalt fra</List.Cell.Title>
                  <List.Cell.End>{PAYMENT.fromName} ({PAYMENT.fromNumber})</List.Cell.End>
                </List.Item.Basic>
                <List.Item.Basic>
                  <List.Cell.Title>Betalt til</List.Cell.Title>
                  <List.Cell.End>{PAYMENT.toName} ({PAYMENT.toNumber})</List.Cell.End>
                </List.Item.Basic>
                <List.Item.Basic>
                  <List.Cell.Title>Beløp</List.Cell.Title>
                  <List.Cell.End>{PAYMENT.amount}</List.Cell.End>
                </List.Item.Basic>
                <List.Item.Basic>
                  <List.Cell.Title>Betalingsdato</List.Cell.Title>
                  <List.Cell.End>{PAYMENT.date}</List.Cell.End>
                </List.Item.Basic>
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
              <P style={{ margin: 0 }}>Hva synes du om den nye betalingsflyten?</P>
              <div style={{ display: "flex", gap: "24px" }}>
                <Button variant="tertiary" text="Liker" icon={thumbs_up} iconPosition="right" />
                <Button variant="tertiary" text="Liker ikke" icon={thumbs_down} iconPosition="right" />
              </div>
            </div>
          )}
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
            <P size="basis" style={{ margin: 0 }}>Show feedback</P>
            <Switch label="Show feedback" labelSrOnly checked={showFeedback} onChange={({ checked }) => setShowFeedback(checked)} />
          </div>
        </div>
      )}
    </Theme>
  );
}
