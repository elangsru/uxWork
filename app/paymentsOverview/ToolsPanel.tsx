"use client";

import { useEffect } from "react";
import { Button, Switch } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";
import { close, filter } from "@dnb/eufemia/icons";

export type ToolsToggle = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/**
 * Overlegg for utprøving — ikke en del av DNB-designet. Skrur på varsler,
 * ubekreftede eFakturaer og dark mode under demoing.
 *
 * Merk: dette er ikke en Eufemia `Dialog`/`Drawer`. Et bytte dit ville endret
 * utseendet, så panelet er beholdt som det er; det som er rettet er at Escape
 * lukker det, og at lukkeknappen er en Eufemia-`Button` (fokusring og
 * treffflate) i stedet for et nakent <button>.
 */
export default function ToolsPanel({
  open,
  onOpenChange,
  toggles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggles: ToolsToggle[];
}) {
  // Escape lukker. setState skjer i en event-callback, ikke synkront i
  // effect-kroppen, som er nettopp mønsteret react-hooks/set-state-in-effect
  // ber om: abonner på en ekstern kilde og sett state fra callbacken.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <>
      <div className="po-tools__button">
        <Button
          variant="secondary"
          icon={filter}
          aria-label="Tools menu"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
        />
      </div>

      {open && (
        <div className="po-tools__panel" role="group" aria-label="Configurations">
          <div className="po-tools__header">
            <div className="po-tools__header-top">
              <P size="basis" className="po-tools__title">
                Configurations
              </P>
              <Button
                variant="tertiary"
                icon={close}
                size="small"
                aria-label="Lukk"
                onClick={() => onOpenChange(false)}
              />
            </div>
            <P size="basis">For experimenting purposes only...</P>
          </div>

          {toggles.map((t) => (
            <div key={t.label} className="po-tools__row">
              <P size="basis">{t.label}</P>
              <Switch
                label={t.label}
                labelSrOnly
                checked={t.checked}
                onChange={({ checked }) => t.onChange(checked)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
