"use client";

import { Button, Radio } from "@dnb/eufemia/components";
import { chevron_down, chevron_up } from "@dnb/eufemia/icons";

/**
 * «Gruppering: …» til venstre og «Åpne alle»/«Lukk alle» til høyre. Var duplisert
 * i begge tabbene med ulike valg men identisk oppsett.
 *
 * labelDirection="horizontal" gir samme side-ved-side-oppsett som en flex-wrapper,
 * men med labelen programmatisk koblet til gruppen.
 */
export default function GroupingRow({
  value,
  onChange,
  options,
  allOpen,
  onToggleAll,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  allOpen: boolean;
  onToggleAll: () => void;
}) {
  return (
    <div className="po-grouping">
      <Radio.Group
        label="Gruppering:"
        labelDirection="horizontal"
        layoutDirection="row"
        value={value}
        onChange={({ value }) => onChange(String(value))}
      >
        {options.map((o) => (
          <Radio key={o.value} label={o.label} value={o.value} />
        ))}
      </Radio.Group>
      <Button
        variant="tertiary"
        text={allOpen ? "Lukk alle" : "Åpne alle"}
        icon={allOpen ? chevron_up : chevron_down}
        iconPosition="right"
        onClick={onToggleAll}
      />
    </div>
  );
}
