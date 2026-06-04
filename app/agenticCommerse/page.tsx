"use client";

import { useState, useEffect } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Card, Avatar, Dropdown, Input } from "@dnb/eufemia/components";
import { H1, H2, P } from "@dnb/eufemia/elements";
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
          {screen === "approve" && <P>Skjerm: approve (bygges i Task 4)</P>}

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
