"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentRecord } from "@/lib/payments";

const REFRESH_INTERVAL_MS = 5000;

export default function PaymentDetailsView({
  payments,
}: {
  payments: PaymentRecord[];
}) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(
    payments[0]?.type ?? ""
  );

  // Henter regnearket på nytt jevnlig så endringer vises uten manuell refresh.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  const selected = payments.find((p) => p.type === selectedType);

  if (payments.length === 0) {
    return <p>Ingen betalinger funnet i regnearket.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {payments.map((p) => (
          <button
            key={p.type}
            type="button"
            onClick={() => setSelectedType(p.type)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: p.type === selectedType ? "#0a3d62" : "#fff",
              color: p.type === selectedType ? "#fff" : "#000",
              cursor: "pointer",
            }}
          >
            {p.type}
          </button>
        ))}
      </div>

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
