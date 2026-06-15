"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, FormStatus, Skeleton, List, Avatar, Badge } from "@dnb/eufemia/components";
import { H1, H2, P } from "@dnb/eufemia/elements";
import { gh, getSession, clearSession, type Activity } from "../shared";

function StatusBadge({ locked }: { locked: boolean }) {
  return locked ? (
    <Badge content="Lukket" status="neutral" subtle />
  ) : (
    <Badge content="Aktiv" status="positive" subtle />
  );
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/growthHacking");
      return;
    }
    gh("activities", { email: session.email, code: session.code }).then((res) => {
      setLoading(false);
      if (res.ok && res.activities) {
        setActivities(res.activities);
      } else if (res.error === "no_match") {
        clearSession();
        router.replace("/growthHacking");
      } else {
        setError("Kunne ikke hente aktiviteter.");
      }
    });
  }, [router]);

  return (
    <Theme colorScheme="light">
      <main style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "100vh", padding: "48px" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column" }}>
            <style>{`
              .dnb-list__item__action .dnb-list__item__chevron .dnb-icon { transform: none !important; transition: none !important; }
              .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__subline) .dnb-list__item__chevron { place-self: center !important; }
              .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__subline) .dnb-list__item__start { place-self: center !important; }
              .dnb-list__item:has(> .dnb-list__item__action__button .dnb-list__item__subline) .dnb-list__item__end { place-self: center !important; }
            `}</style>
            <H1 size="x-large" top={false} bottom={false} suppressHydrationWarning>Growth hacking Konto og Kort</H1>
            <H2 size="large" top="large" bottom={false} suppressHydrationWarning>Aktiviteter</H2>
            <P top="small" bottom={false}>Velg en aktivitet fra listen under og tipp resultatet</P>

            {error && <FormStatus state="error" stretch text={error} top="large" />}

            <Skeleton show={loading} top="large">
              <List.Container>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <List.Item.Basic key={`skeleton-${i}`}>
                        <List.Cell.Start>
                          <Avatar size="medium" variant="primary">
                            {i + 1}
                          </Avatar>
                        </List.Cell.Start>
                        <List.Cell.Title>
                          Henter aktivitet
                          <List.Cell.Title.Subline variant="description">
                            Ditt svar: 00%
                          </List.Cell.Title.Subline>
                        </List.Cell.Title>
                        <List.Cell.End>
                          <StatusBadge locked={false} />
                        </List.Cell.End>
                      </List.Item.Basic>
                    ))
                  : activities.map((a, i) => (
                      <List.Item.Action
                        key={a.rad}
                        onClick={() => router.push(`/growthHacking/aktiviteter/${a.rad}`)}
                      >
                        <List.Cell.Start>
                          <Avatar size="medium" variant="primary">
                            {i + 1}
                          </Avatar>
                        </List.Cell.Start>
                        <List.Cell.Title>
                          {a.navn}
                          <List.Cell.Title.Subline variant="description">
                            {a.harSvart ? `Ditt svar: ${a.mittSvar}%` : "Ikke svart ennå"}
                          </List.Cell.Title.Subline>
                        </List.Cell.Title>
                        <List.Cell.End>
                          <StatusBadge locked={a.locked} />
                        </List.Cell.End>
                      </List.Item.Action>
                    ))}
              </List.Container>
              {!loading && activities.length === 0 && !error && (
                <P top="small">Ingen aktiviteter funnet i regnearket ennå.</P>
              )}
            </Skeleton>

            <div style={{ marginTop: "2rem" }}>
              <Button
                variant="primary"
                text="Logg ut"
                onClick={() => {
                  clearSession();
                  router.replace("/growthHacking");
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </Theme>
  );
}
