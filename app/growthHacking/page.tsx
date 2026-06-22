"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Theme from "@dnb/eufemia/shared/Theme";
import { Button, Input, FormStatus } from "@dnb/eufemia/components";
import { H1, H2, P } from "@dnb/eufemia/elements";
import { gh, setSession } from "./shared";

export default function GrowthHackingLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim() !== "" && code.trim().length === 4;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const res = await gh("login", { email: email.trim(), code: code.trim() });
    setLoading(false);
    if (res.ok && res.name) {
      setSession({ email: email.trim(), code: code.trim(), name: res.name });
      router.push("/growthHacking/aktiviteter");
    } else if (res.error === "missing_env") {
      setError("Tjenesten er ikke konfigurert ennå (mangler Apps Script-URL/secret).");
    } else {
      setError("Fant ingen deltaker med denne kombinasjonen av epost og kode.");
    }
  }

  return (
    <Theme colorScheme="light">
      <main className="gh-main" style={{ background: "var(--token-color-background-neutral-subtle)", minHeight: "100vh" }}>
        <style>{`.gh-main { padding: 48px; } @media (max-width: 768px) { .gh-main { padding: 16px; } }`}</style>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column" }}>
            <H1 size="x-large" top={false} bottom={false} suppressHydrationWarning>Growth hacking</H1>
            <H2 size="large" top="large" bottom={false} suppressHydrationWarning>Logg inn</H2>
            <P top="small" bottom={false}>Benytt kode du har mottatt på din DNB-epost</P>

            <div style={{ marginTop: "2rem", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "2rem" }}>
              <Input
                label="E-post"
                type="email"
                placeholder="navn@dnb.no"
                value={email}
                stretch
                onChange={({ value }: { value: string }) => { setEmail(value); setError(null); }}
                onSubmit={() => {
                  if (canSubmit) onSubmit();
                }}
              />

              <Input
                label="Kode (4 siffer)"
                placeholder="1234"
                value={code}
                stretch
                type="password"
                inputMode="numeric"
                maxLength={4}
                onChange={({ value }: { value: string }) => {
                  setCode(value.replace(/\D/g, "").slice(0, 4));
                  setError(null);
                }}
                onSubmit={() => {
                  if (canSubmit) onSubmit();
                }}
              />

              {error && <FormStatus state="error" stretch text={error} />}

              <Button
                variant="primary"
                text={loading ? "Logger inn …" : "Logg inn"}
                disabled={!canSubmit || loading}
                onClick={onSubmit}
                style={{ alignSelf: "flex-start" }}
              />
            </div>
          </div>
        </div>
      </main>
    </Theme>
  );
}
