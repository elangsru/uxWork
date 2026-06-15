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

  const num = Number(input);
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
      <main style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "100vh", padding: "48px" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column" }}>
            <style>{listOverrides}</style>

            <H1 size="x-large" top={false} bottom={false} suppressHydrationWarning>
              Growth hacking Konto og Kort
            </H1>
            <H2 size="large" top="large" bottom={false} suppressHydrationWarning>
              {locked ? "Resultater" : "Tipp resultatet"}
            </H2>
            <P top="small" bottom={false}>
              {locked
                ? `Viser fasit og resultatet${activityName ? ` fra ${activityName}` : ""}`
                : `Avgi eller endre ditt anslag${activityName ? ` for ${activityName}` : ""}`}
            </P>

            <Skeleton show={loading} top="large">
              {!locked && (
                <div style={{ maxWidth: "360px", display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <Input
                    label="Ditt anslag (%)"
                    value={input}
                    stretch
                    inputMode="numeric"
                    suffix="%"
                    placeholder="0–100"
                    onChange={({ value }: { value: string }) =>
                      setInput(value.replace(/\D/g, "").slice(0, 3))
                    }
                  />
                  {error && <FormStatus state="error" stretch text={error} />}
                  <Button
                    variant="primary"
                    text={saving ? "Lagrer …" : myAnswer != null ? "Endre svar" : "Bekreft svar"}
                    disabled={!canSubmit}
                    onClick={onSubmit}
                    style={{ alignSelf: "flex-start" }}
                  />
                </div>
              )}

              {locked && error && <FormStatus state="error" stretch text={error} bottom="large" />}

              {locked && (
                <List.Container>
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
                <List.Container>
                  {participants.map((p, i) => {
                    const dev = p.verdi != null && fasit != null ? p.verdi - fasit : null;
                    const label = p.isMe ? `${p.navn} (deg)` : p.navn;

                    if (locked) {
                      return (
                        <List.Item.Basic key={`${p.navn}-${i}`}>
                          <List.Cell.Start>
                            <Avatar size="medium" variant="primary">
                              {i + 1}
                            </Avatar>
                          </List.Cell.Start>
                          <List.Cell.Title>
                            {label}
                            <List.Cell.Title.Subline variant="description">
                              {p.harSvart ? `Svar: ${p.verdi}%` : "Ikke svart"}
                            </List.Cell.Title.Subline>
                          </List.Cell.Title>
                          <List.Cell.End>
                            {dev == null ? "Ikke svart" : `${dev > 0 ? "+" : ""}${dev}% avvik`}
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
