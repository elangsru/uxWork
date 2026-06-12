"use client";

import { useState, useEffect } from "react";
import { Button, Icon, Switch, Dropdown, Avatar, Badge, CountryFlag } from "@dnb/eufemia/components";
import Theme from "@dnb/eufemia/shared/Theme";
import { H1, H2, P } from "@dnb/eufemia/elements";
import { filter, close, chevron_down, chevron_up } from "@dnb/eufemia/icons";
import type { PaymentRecord } from "@/lib/payments";

const COUNTRY_ISO: Record<string, string> = {
  norge: "NO",
  sverige: "SE",
  danmark: "DK",
  finland: "FI",
  island: "IS",
  spania: "ES",
  tyskland: "DE",
  frankrike: "FR",
  storbritannia: "GB",
  nederland: "NL",
  italia: "IT",
  polen: "PL",
  usa: "US",
};

// Rader som vises i beneficiary-kortet og derfor utelates fra detaljlista.
const BENEFICIARY_LABELS = /^(logo\/avatar|mottaker navn|mottaker konto|mottaker land)$/i;

function fieldValue(record: PaymentRecord | undefined, re: RegExp): string {
  return record?.fields.find((f) => re.test(f.label.trim()))?.value ?? "";
}

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
  const [detailsOpen, setDetailsOpen] = useState(true);
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

  const beneficiaryName =
    fieldValue(selected, /^mottaker navn$/i) || fieldValue(selected, /^mottaker$/i);
  const beneficiaryAccount = fieldValue(selected, /^mottaker konto/i);
  const beneficiaryCountry = fieldValue(selected, /^mottaker land$/i);
  const flagIso = COUNTRY_ISO[beneficiaryCountry.trim().toLowerCase()];
  const avatarInitial = beneficiaryName.trim().charAt(0).toUpperCase() || "?";
  const hasBeneficiary = beneficiaryName.trim().length > 0;
  const detailFields = selected
    ? selected.fields.filter((f) => !BENEFICIARY_LABELS.test(f.label.trim()))
    : [];

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
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <H1 size="x-large">Transaksjonsdetaljer</H1>
            <P>Velg Trx type fra konfigurasjonsmenyen for å endre visning</P>
          </div>

          {/* Content */}
          {payments.length === 0 ? (
            <P>Ingen betalinger funnet i regnearket.</P>
          ) : (
            selected && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {hasBeneficiary && (
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((o) => !o)}
                    aria-expanded={detailsOpen}
                    style={{
                      cursor: "pointer",
                      border: "none",
                      font: "inherit",
                      color: "inherit",
                      textAlign: "left",
                      boxSizing: "border-box",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "16px",
                      borderRadius: "24px",
                      background: "var(--token-color-background-neutral)",
                      boxShadow: "0px 2px 8px 0px rgba(51,51,51,0.08)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      {flagIso ? (
                        <Badge
                          content={<CountryFlag iso={flagIso} size="small" />}
                          vertical="bottom"
                          horizontal="right"
                          variant="content"
                        >
                          <Avatar size="large" variant="primary">
                            {avatarInitial}
                          </Avatar>
                        </Badge>
                      ) : (
                        <Avatar size="large" variant="primary">
                          {avatarInitial}
                        </Avatar>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <H2 size="large" style={{ margin: 0 }}>
                          {beneficiaryName}
                        </H2>
                        {beneficiaryAccount && (
                          <P style={{ margin: 0 }}>{beneficiaryAccount}</P>
                        )}
                      </div>
                    </div>
                    <Icon icon={detailsOpen ? chevron_up : chevron_down} size="medium" />
                  </button>
                )}

                {(!hasBeneficiary || detailsOpen) && detailFields.length > 0 && (
                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "8px 24px",
                      margin: 0,
                    }}
                  >
                    {detailFields.map((f) => (
                      <div key={f.label} style={{ display: "contents" }}>
                        <dt style={{ fontWeight: 600 }}>{f.label}</dt>
                        <dd style={{ margin: 0 }}>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
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

          {payments.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
              <P size="basis" style={{ margin: 0 }}>
                Trx type
              </P>
              <div className="narrow-dropdown">
                <style>{`
                  .narrow-dropdown .dnb-dropdown { --dropdown-width: 16rem; }
                `}</style>
                <Dropdown
                  label="Trx type"
                  labelSrOnly
                  size="small"
                  value={selectedType}
                  data={payments.map((p) => ({ selectedKey: p.type, content: p.type }))}
                  onChange={({ data }) =>
                    setSelectedType(
                      typeof data?.selectedKey === "string" ? data.selectedKey : selectedType
                    )
                  }
                />
              </div>
            </div>
          )}

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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--token-color-background-neutral-subtle, #f8f8f8)", borderRadius: "var(--token-radius-md, 8px)", padding: "16px" }}>
            <P size="basis" style={{ margin: 0 }}>
              Vis reservert
            </P>
            <Switch label="Vis reservert" labelSrOnly checked={false} disabled />
          </div>
        </div>
      )}
    </Theme>
  );
}
