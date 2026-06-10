"use client";

import { useState } from "react";
import { ToggleButton } from "@dnb/eufemia/components";
import Theme from "@dnb/eufemia/shared/Theme";
import { H1, P } from "@dnb/eufemia/elements";
import type { PaymentRecord } from "@/lib/payments";

export default function PaymentDetailsView({
  payments,
}: {
  payments: PaymentRecord[];
}) {
  const [selectedType, setSelectedType] = useState(
    payments[0]?.type ?? ""
  );

  const selected = payments.find((p) => p.type === selectedType);

  return (
    <Theme>
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
    </Theme>
  );
}
