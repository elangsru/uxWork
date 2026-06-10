"use client";

import { useState } from "react";
import { ToggleButton } from "@dnb/eufemia/components";
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

  if (payments.length === 0) {
    return <p>Ingen betalinger funnet i regnearket.</p>;
  }

  return (
    <div>
      <ToggleButton.Group
        value={selectedType}
        onChange={({ value }) => setSelectedType(String(value))}
        bottom="medium"
      >
        {payments.map((p) => (
          <ToggleButton key={p.type} text={p.type} value={p.type} />
        ))}
      </ToggleButton.Group>

      {selected && (
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 24px" }}>
          {selected.fields.map((f) => (
            <div key={f.label} style={{ display: "contents" }}>
              <dt style={{ fontWeight: 600 }}>{f.label}</dt>
              <dd style={{ margin: 0 }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
