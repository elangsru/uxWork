"use client";

import { Button } from "@dnb/eufemia/components";
import { H1, H2, P } from "@dnb/eufemia/elements";
import { chevron_right, launch } from "@dnb/eufemia/icons";

const groups = [
  {
    title: "Payments",
    projects: [
      {
        label: "Domestic payments",
        href: "/domesticPayment",
        jiraUrl: "https://dnb-asa.atlassian.net/browse/MINBANK-48056",
      },
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
    ],
  },
  {
    title: "Account/Card",
    projects: [
      {
        label: "Transaction details",
        href: "/transactionDetails",
        jiraUrl: "https://dnb-asa.atlassian.net/browse/RCP-5150",
      },
    ],
  },
  {
    title: "Others",
    projects: [
      {
        label: "Payment confirmation (concept)",
        href: "/paymentConfirmation",
        jiraUrl: "https://dnb-asa.atlassian.net/browse/MINBANK-49516",
      },
      {
        label: "growthHacking",
        href: "/growthHacking",
      },
    ],
  },
];

export default function Home() {
  return (
    <main
      lang="en"
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
      <H1 size="x-large" suppressHydrationWarning>
        Design to code projects
      </H1>
      <P>by Espen Langsrud</P>
      {groups.map((g) => [
        <H2 key={g.title} size="large">
          {g.title}
        </H2>,
        ...g.projects.map((p) => (
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
        )),
      ])}
    </main>
  );
}
