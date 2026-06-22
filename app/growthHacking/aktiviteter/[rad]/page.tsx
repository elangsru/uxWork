"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Input, FormStatus, Skeleton, List, Avatar, Badge } from "@dnb/eufemia/components";
import { H1, H2, P } from "@dnb/eufemia/elements";
import { chevron_left, goal_medium } from "@dnb/eufemia/icons";
import { gh, getSession, clearSession, type Participant } from "../../shared";

const listOverrides = `
  .dnb-list__item:has(.dnb-list__item__subline) .dnb-list__item__start { place-self: center !important; }
  .dnb-list__item:has(.dnb-list__item__subline) .dnb-list__item__end { place-self: center !important; }
  @media screen and (max-width: 40em) {
    .gh-results-list .dnb-list__item:has(.dnb-list__item__start):has(.dnb-list__item__title) {
      --item-grid-template-areas: 'chevron-left start icon title center end chevron-right'
        'footer footer footer footer footer footer footer';
    }
  }
  @media screen and (max-width: 25em) {
    .gh-results-list .dnb-list__item:has(.dnb-list__item__start):has(.dnb-list__item__title) {
      --item-grid-template-areas: 'chevron-left start icon title center end chevron-right'
        'footer footer footer footer footer footer footer';
    }
  }
`;

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams<{ rad: string }>();
  const rad = Number(params.rad);

  const [activityName, setActivityName] = useState("");
  const [locked, setLocked] = useState(false);
  const [fasit, setFasit] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) {
      router.replace("/growthHacking");
      return;
    }
    const res = await gh("participants", { email: session.email, code: session.code, rad });
    setLoading(false);
    if (res.ok) {
      setActivityName(res.navn ?? "");
      setLocked(Boolean(res.locked));
      setFasit(typeof res.fasit === "number" ? res.fasit : null);
      setParticipants(res.participants ?? []);
      setMyAnswer(res.mittSvar ?? null);
      setInput(res.mittSvar != null ? String(res.mittSvar) : "");
    } else if (res.error === "no_match") {
      clearSession();
      router.replace("/growthHacking");
    } else {
      setError("Kunne ikke hente aktiviteten.");
    }
  }, [rad, router]);

  useEffect(() => {
    load();
  }, [load]);

  const num = Number(input.replace(",", "."));
  const canSubmit =
    !locked && input.trim() !== "" && !isNaN(num) && num >= 0 && num <= 100 && !saving;

  async function onSubmit() {
    const session = getSession();
    if (!session) return;
    setError(null);
    setSaving(true);
    const res = await gh("submit", { email: session.email, code: session.code, rad, verdi: num });
    if (!res.ok) {
      setSaving(false);
      setError(
        res.error === "locked"
          ? "Aktiviteten er lukket og kan ikke endres."
          : "Kunne ikke lagre svaret."
      );
      return;
    }
    await load();
    setSaving(false);
  }

  return (
    <Theme colorScheme="light">
      <main className="gh-main" style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "100vh" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column" }}>
            <style>{listOverrides}</style>

            <H1 size="x-large" top={false} bottom={false} suppressHydrationWarning>
              Growth hacking
            </H1>
            <H2 size="large" top="large" bottom={false} suppressHydrationWarning>
              {locked ? "Resultater - konto og kort" : "Tipp resultatet"}
            </H2>
            <P top="small" bottom={false}>
              {locked
                ? `Viser fasit og resultatet${activityName ? ` fra ${activityName}` : ""}`
                : `Avgi eller endre ditt anslag${activityName ? ` for ${activityName}` : ""}`}
            </P>

            <Skeleton show={loading} top="large">
              {!locked && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "fit-content" }}>
                  <Input
                    label="Ditt anslag (%)"
                    value={input}
                    inputMode="numeric"
                    placeholder="0–100"
                    onChange={({ value }: { value: string }) =>
                      setInput(value.replace(/[^\d,]/g, "").slice(0, 5))
                    }
                  />
                  {error && <FormStatus state="error" stretch text={error} />}
                  <Button
                    variant="primary"
                    text={saving ? "Lagrer …" : myAnswer != null ? "Endre svar" : "Bekreft svar"}
                    disabled={!canSubmit}
                    onClick={onSubmit}
                  />
                </div>
              )}

              {locked && error && <FormStatus state="error" stretch text={error} bottom="large" />}

              {locked && (
                <List.Container className="gh-results-list">
                  <List.Item.Basic title="Fasit">
                    <List.Cell.Start>
                      <Avatar size="medium" variant="primary" icon={goal_medium} />
                    </List.Cell.Start>
                    <List.Cell.End>{fasit != null ? `${fasit}%` : "–"}</List.Cell.End>
                  </List.Item.Basic>
                </List.Container>
              )}

              {!locked && (
                <P top="large" bottom="x-small" style={{ fontWeight: 500 }}>
                  Deltakere
                </P>
              )}

              <div style={{ marginTop: locked ? "2rem" : 0 }}>
                <List.Container className="gh-results-list">
                  {participants.filter(p => locked ? p.harSvart : true).map((p, i) => {
                    const dev = p.verdi != null && fasit != null ? p.verdi - fasit : null;
                    const label = p.isMe ? `${p.navn} (deg)` : p.navn;

                    if (locked) {
                      return (
                        <List.Item.Basic key={`${p.navn}-${i}`}>
                          <List.Cell.Start>
                            {i < 3 ? (
                              <span style={{ fontSize: "2rem", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem" }}>
                                {(["🥇", "🥈", "🥉"] as const)[i]}
                              </span>
                            ) : (
                              <Avatar size="medium" variant="primary">{i + 1}</Avatar>
                            )}
                          </List.Cell.Start>
                          <List.Cell.Title>
                            {label}
                            <List.Cell.Title.Subline variant="description">
                              {p.harSvart ? `Svar: ${p.verdi}%` : "Ikke svart"}
                            </List.Cell.Title.Subline>
                          </List.Cell.Title>
                          <List.Cell.End>
                            {dev == null ? "–" : `${dev > 0 ? "+" : ""}${parseFloat(dev.toFixed(2))}`}
                          </List.Cell.End>
                        </List.Item.Basic>
                      );
                    }

                    return (
                      <List.Item.Basic key={`${p.navn}-${i}`} title={label}>
                        <List.Cell.Start>
                          <Avatar size="medium" variant="primary">
                            {p.navn.charAt(0)}
                          </Avatar>
                        </List.Cell.Start>
                        <List.Cell.End>
                          <Badge
                            content={p.harSvart ? "Svart" : "Ikke svart"}
                            status={p.harSvart ? "positive" : "neutral"}
                            subtle
                          />
                        </List.Cell.End>
                      </List.Item.Basic>
                    );
                  })}
                </List.Container>
                {!loading && participants.length === 0 && (
                  <P top="small">Ingen deltakere ennå.</P>
                )}
              </div>
            </Skeleton>

            <Button
              variant="tertiary"
              text="Tilbake"
              icon={chevron_left}
              iconPosition="left"
              onClick={() => router.push("/growthHacking/aktiviteter")}
              top="large"
              style={{ alignSelf: "flex-start" }}
            />
          </div>
        </div>
      </main>
    </Theme>
  );
}
