"use client";

import Theme from "@dnb/eufemia/shared/Theme";
import { Avatar, Breadcrumb, Button } from "@dnb/eufemia/components";
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
    <Theme colorScheme="light">
      {/* Toppfelt med brødsmulesti og sidemal, samme oppsett som på
          domesticPayment. Startsiden er «Hjem», så stien har bare det ene
          leddet. */}
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
            data={[{ text: "Hjem" }]}
          />
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <Avatar size="medium" variant="primary" hasLabel>E</Avatar>
            <Button variant="tertiary" size="small" icon="chevron_down" iconPosition="right">Meg</Button>
          </div>
        </div>
      </div>
      <div style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "calc(100vh - 80px)", padding: "48px", boxSizing: "border-box" }}>
        <main
          lang="en"
          style={{
            background: "var(--token-color-background-neutral)",
            boxShadow: "0px 8px 16px 0px rgba(51,51,51,0.08)",
            padding: "48px 96px",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            alignItems: "flex-start",
            minHeight: "calc(100vh - 176px)",
            boxSizing: "border-box",
            maxWidth: "72rem",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Sidehode som på transactionDetails: tittel og byline i egen
              stack med 8 px gap, ikke som egne barn av kortet (32 px gap). */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <H1 size="x-large" style={{ margin: 0 }} suppressHydrationWarning>
              Design to code projects
            </H1>
            <P size="x-small" style={{ margin: 0, color: "var(--token-color-text-neutral-alternative)" }}>
              by Espen Langsrud
            </P>
          </div>
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
      </div>
    </Theme>
  );
}
