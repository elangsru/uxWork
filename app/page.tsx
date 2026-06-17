"use client";

import { Button } from "@dnb/eufemia/components";
import { H1, P } from "@dnb/eufemia/elements";
import { chevron_right, launch } from "@dnb/eufemia/icons";

const projects = [
  {
    label: "International payments",
    href: "/internationalPayment",
    jiraUrl: "https://dnb-asa.atlassian.net/browse/MINBANK-48322",
  },
  {
    label: "Pending payments overview",
    href: "/paymentsOverview",
    jiraUrl: "https://dnb-asa.atlassian.net/browse/RCP-5048",
  },
  {
    label: "Payment confirmation (concept)",
    href: "/paymentConfirmation",
    jiraUrl: "https://dnb-asa.atlassian.net/browse/MINBANK-49516",
  },
  {
    label: "Transaction details",
    href: "/transactionDetails",
    jiraUrl: "https://dnb-asa.atlassian.net/browse/RCP-5150",
  },
  {
    label: "growthHacking",
    href: "/growthHacking",
  },
];

export default function Home() {
  return (
    <main
      style={{
        background: "white",
        minHeight: "100vh",
        padding: "48px 96px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        alignItems: "flex-start",
      }}
    >
      <H1 size="x-large" suppressHydrationWarning>Design to code projects</H1>
      <P>by Espen Langsrud</P>
      {projects.map((p) => (
        <div
          key={p.href}
          style={{ display: "flex", gap: "16px", alignItems: "center" }}
        >
          <Button
            variant="secondary"
            text={p.label}
            icon={chevron_right}
            iconPosition="right"
            href={p.href}
          />
          {p.jiraUrl && (
            <Button
              variant="tertiary"
              text={p.jiraUrl}
              icon={launch}
              iconPosition="right"
              iconSize="medium"
              href={p.jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          )}
        </div>
      ))}
    </main>
  );
}
