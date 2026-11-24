"use client";

import { useEffect } from "react";
import { Button, Dropdown, Switch } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";
import { close, filter } from "@dnb/eufemia/icons";

export type ToolsToggle = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Rad med liten nedtrekksmeny i stedet for bryter. */
export type ToolsSelect = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
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
  selects = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggles: ToolsToggle[];
  /** Vises etter bryterne. */
  selects?: ToolsSelect[];
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
          variant="primary"
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
            <P size="basis" className="po-tools__subtitle">For experimenting and simulation purpose - not visible to end user.</P>
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

          {/* Samme oppsett som nedtrekkene i Tools-menyen på International
              payments: liten Dropdown med skjult label, teksten står i raden. */}
          {selects.map((s) => (
            <div key={s.label} className="po-tools__row">
              <P size="basis">{s.label}</P>
              <Dropdown
                className="po-tools__select"
                label={s.label}
                labelSrOnly
                size="small"
                value={s.value}
                data={s.options.map((o) => ({ selectedKey: o.value, content: o.label }))}
                onChange={({ data }) => {
                  if (typeof data?.selectedKey === "string") s.onChange(data.selectedKey);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
