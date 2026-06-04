"use client";

import { useState, useEffect } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Card, Avatar, Dropdown, Input, Badge, InfoCard, NumberFormat } from "@dnb/eufemia/components";
import { H1, H2, P, Li, Ul } from "@dnb/eufemia/elements";
import { stop, chevron_right } from "@dnb/eufemia/icons";

type Screen = "dashboard" | "merchant" | "approve";

type Activity = {
  date: string;
  description: string;
  amount: number;
  status: "booket" | "avvist";
};

type AgentMandate = {
  id: string;
  merchant: { name: string; iso: string };
  agentName: string;
  status: "active" | "paused";
  schedule: { weekday: string; from: string; to: string; recurrence: string };
  caps: { perPurchase: number; perMonth: number };
  spentThisMonth: number;
  expiry: string;
  createdAt: string;
  activity: Activity[];
};

const MERCHANT = { name: "Oslo Padelklubb", iso: "NO" };

const weekdayOptions = [
  "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag",
].map((d) => ({ selectedKey: d, content: d.charAt(0).toUpperCase() + d.slice(1) }));

const timeOptions = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].map(
  (t) => ({ selectedKey: t, content: t }),
);

const recurrenceOptions = [
  { selectedKey: "ukentlig", content: "Hver uke" },
  { selectedKey: "annenhver", content: "Annenhver uke" },
];

export default function AgenticCommerse() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [mandate, setMandate] = useState<AgentMandate | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [weekday, setWeekday] = useState("torsdag");
  const [fromTime, setFromTime] = useState("18:00");
  const [toTime, setToTime] = useState("20:00");
  const [recurrence, setRecurrence] = useState("ukentlig");
  const [pricePerBooking, setPricePerBooking] = useState(400);
  const [capPerPurchase, setCapPerPurchase] = useState(400);
  const [capPerMonth, setCapPerMonth] = useState(1600);
  const [expiry, setExpiry] = useState("2026-12-31");

  useEffect(() => {
    const raw = sessionStorage.getItem("agenticCommerse.mandate");
    if (raw) {
      try {
        setMandate(JSON.parse(raw) as AgentMandate);
      } catch {
        /* ignore malformed state */
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (mandate) {
      sessionStorage.setItem("agenticCommerse.mandate", JSON.stringify(mandate));
    } else {
      sessionStorage.removeItem("agenticCommerse.mandate");
    }
  }, [mandate, hydrated]);

  const createMandate = () => {
    const now = new Date();
    setMandate({
      id: `mandate-${now.getTime()}`,
      merchant: MERCHANT,
      agentName: "Padel-agent",
      status: "active",
      schedule: { weekday, from: fromTime, to: toTime, recurrence },
      caps: { perPurchase: capPerPurchase, perMonth: capPerMonth },
      spentThisMonth: 0,
      expiry,
      createdAt: now.toISOString(),
      activity: [],
    });
    setScreen("dashboard");
  };

  return (
    <Theme name="ui" colorScheme={darkMode ? "dark" : "light"}>
      <main
        style={{
          minHeight: "100vh",
          background: "var(--token-color-background-default, #fff)",
          padding: "32px 24px",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          {screen === "dashboard" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <H1 size="large" suppressHydrationWarning>
                  Mine handleagenter
                </H1>
                {mandate && (
                  <Button
                    variant="secondary"
                    text="Stopp alle agenter"
                    icon={stop}
                    iconPosition="left"
                    onClick={() =>
                      setMandate((m) => (m ? { ...m, status: "paused" } : m))
                    }
                  />
                )}
              </div>

              {!mandate && (
                <Card filled stack>
                  <P>Du har ingen aktive handleagenter ennå.</P>
                  <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
                    En handleagent kan utføre faste kjøp for deg innenfor rammer du
                    bestemmer — og du kan stoppe den når som helst.
                  </P>
                  <Button
                    variant="primary"
                    text="Simuler: book padel hos Oslo Padelklubb"
                    top="small"
                    onClick={() => setScreen("merchant")}
                  />
                </Card>
              )}

              {/* Filled state (agent card) is added in Task 5 */}
            </div>
          )}
          {screen === "merchant" && (
            <Card stack>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Avatar size="medium" variant="primary">🎾</Avatar>
                <H2 size="medium">Oslo Padelklubb</H2>
              </div>
              <P>
                Sett opp en AI-agent som booker bane for deg fast. Du bestemmer når og
                hvor ofte — banken din godkjenner og setter budsjettrammene.
              </P>

              <Dropdown
                label="Ukedag"
                data={weekdayOptions}
                value={weekday}
                onChange={({ data }) => setWeekday(String(data?.selectedKey))}
                stretch
                top="small"
              />
              <div style={{ display: "flex", gap: "12px" }}>
                <Dropdown
                  label="Fra"
                  data={timeOptions}
                  value={fromTime}
                  onChange={({ data }) => setFromTime(String(data?.selectedKey))}
                  stretch
                  top="small"
                />
                <Dropdown
                  label="Til"
                  data={timeOptions}
                  value={toTime}
                  onChange={({ data }) => setToTime(String(data?.selectedKey))}
                  stretch
                  top="small"
                />
              </div>
              <Dropdown
                label="Gjentakelse"
                data={recurrenceOptions}
                value={recurrence}
                onChange={({ data }) => setRecurrence(String(data?.selectedKey))}
                stretch
                top="small"
              />
              <Input
                label="Pris per booking (maks)"
                type="number"
                value={String(pricePerBooking)}
                onChange={({ value }) => setPricePerBooking(Number(value) || 0)}
                suffix="kr"
                stretch
                top="small"
              />

              <Button
                variant="primary"
                text="La AI-agenten min booke fast"
                icon={chevron_right}
                iconPosition="right"
                top="medium"
                onClick={() => setScreen("approve")}
              />
              <Button
                variant="tertiary"
                text="Avbryt"
                top="x-small"
                onClick={() => setScreen("dashboard")}
              />
            </Card>
          )}
          {screen === "approve" && (
            <Card stack>
              <div style={{ textAlign: "center" }}>
                <Avatar size="large" variant="primary">🛡️</Avatar>
                <H2 size="medium" top="small">Autoriser handleagent</H2>
                <P size="small" style={{ color: "var(--token-color-text-neutral-alternative)" }}>
                  {MERCHANT.name} ber om å booke fast på dine vegne
                </P>
              </div>

              <P size="small" bottom="x-small" top="medium" style={{ fontWeight: 600 }}>
                AGENTEN FÅR LOV TIL
              </P>
              <Ul>
                <Li>
                  Kun hos <strong>{MERCHANT.name}</strong>{" "}
                  <Badge variant="information" content="Låst" />
                </Li>
                <Li>
                  Hver {weekday} {fromTime}–{toTime} ({recurrence})
                </Li>
                <Li>
                  Per booking: <NumberFormat.Currency currency="NOK">{pricePerBooking}</NumberFormat.Currency>
                </Li>
              </Ul>

              <P size="small" bottom="x-small" top="medium" style={{ fontWeight: 600 }}>
                DINE BUDSJETTRAMMER
              </P>
              <Input
                label="Maks per kjøp"
                type="number"
                value={String(capPerPurchase)}
                onChange={({ value }) => setCapPerPurchase(Number(value) || 0)}
                suffix="kr"
                stretch
              />
              <Input
                label="Maks per måned"
                type="number"
                value={String(capPerMonth)}
                onChange={({ value }) => setCapPerMonth(Number(value) || 0)}
                suffix="kr"
                stretch
                top="small"
              />
              <Input
                label="Mandat utløper"
                type="date"
                value={expiry}
                onChange={({ value }) => setExpiry(String(value))}
                stretch
                top="small"
              />

              <InfoCard
                top="medium"
                text={`${MERCHANT.name} ser kun at betalingen er dekket — ikke kontonummer eller saldo.`}
              />

              <Button variant="primary" text="Godkjenn med BankID" top="medium" onClick={createMandate} />
              <Button variant="secondary" text="Avvis" top="x-small" onClick={() => setScreen("merchant")} />
            </Card>
          )}

          <Button
            variant="tertiary"
            text="↻ Nullstill demo"
            top="medium"
            onClick={() => {
              setMandate(null);
              setScreen("dashboard");
            }}
          />
        </div>
      </main>
    </Theme>
  );
}
