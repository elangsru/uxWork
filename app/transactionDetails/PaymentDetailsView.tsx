"use client";

import { useState, useEffect } from "react";
import { ToggleButton, Button, Icon, Switch } from "@dnb/eufemia/components";
import Theme from "@dnb/eufemia/shared/Theme";
import { H1, P } from "@dnb/eufemia/elements";
import { filter, close } from "@dnb/eufemia/icons";
import type { PaymentRecord } from "@/lib/payments";

export default function PaymentDetailsView({
  payments,
}: {
  payments: PaymentRecord[];
}) {
  const [selectedType, setSelectedType] = useState(
    payments[0]?.type ?? ""
  );
  const [darkMode, setDarkMode] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  const selected = payments.find((p) => p.type === selectedType);

  if (!hydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--token-color-background-neutral-subtle)",
        }}
      />
    );
  }

  return (
    <Theme colorScheme={darkMode ? "dark" : "light"}>
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
            gap: "48px",
            minHeight: "calc(100vh - 96px)",
            boxSizing: "border-box",
            maxWidth: "72rem",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Hero */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <H1 size="x-large">Transaksjonsdetaljer</H1>
              <P>Velg betalingstype for å endre visning</P>
            </div>

            {payments.length > 0 && (
              <ToggleButton.Group
                value={selectedType}
                onChange={({ value }) => setSelectedType(String(value))}
              >
                {payments.map((p) => (
                  <ToggleButton key={p.type} text={p.type} value={p.type} />
                ))}
              </ToggleButton.Group>
            )}
          </div>

          {/* Content */}
          {payments.length === 0 ? (
            <P>Ingen betalinger funnet i regnearket.</P>
          ) : (
            selected && (
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "8px 24px",
                  margin: 0,
                }}
              >
                {selected.fields.map((f) => (
                  <div key={f.label} style={{ display: "contents" }}>
                    <dt style={{ fontWeight: 600 }}>{f.label}</dt>
                    <dd style={{ margin: 0 }}>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )
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
              <P size="basis" style={{ fontWeight: 500, margin: 0 }}>
                Configurations menu
              </P>
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
            <P size="basis" style={{ margin: 0 }}>
              Dark mode
            </P>
            <Switch
              label="Dark mode"
              labelSrOnly
              checked={darkMode}
              onChange={({ checked }) => setDarkMode(checked)}
            />
          </div>
        </div>
      )}
    </Theme>
  );
}
