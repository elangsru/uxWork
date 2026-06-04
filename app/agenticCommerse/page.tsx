"use client";

import { useState, useEffect } from "react";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Card } from "@dnb/eufemia/components";
import { H1, P } from "@dnb/eufemia/elements";
import { stop } from "@dnb/eufemia/icons";

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

export default function AgenticCommerse() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [mandate, setMandate] = useState<AgentMandate | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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
          {screen === "merchant" && <P>Skjerm: merchant (bygges i Task 3)</P>}
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
