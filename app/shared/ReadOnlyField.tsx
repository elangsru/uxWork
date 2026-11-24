"use client";

import type { CSSProperties, ReactNode } from "react";
import { FormLabel } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";

/**
 * Utfylt felt som ikke kan endres: etikett + verdien som grå tekst (Figma
 * «Edit»-tilstand), ikke et deaktivert input. Brukt av bankinfoen i «Rediger
 * mottaker» på /internationalPayment og av «Field status» → Read only i
 * redigeringsskjemaene på /paymentsOverview.
 *
 * FormLabel har 8 px margin-bottom fra Eufemia. Den nulles, så avstanden
 * styres av gap alene — ellers ville de summert seg.
 *
 * `children` lar kalleren pakke linjene inn (f.eks. i en Skeleton), og
 * `lineStyle` legges på hver linje (f.eks. skeleton-timing).
 */
export default function ReadOnlyField({
  label,
  lines,
  lineStyle,
  children,
}: {
  label: string;
  lines: string[];
  lineStyle?: CSSProperties;
  children?: (content: ReactNode) => ReactNode;
}) {
  const content = (
    <div style={{ color: "var(--token-color-text-neutral-alternative)" }}>
      {lines.map((line, i) => (
        <P key={`${i}-${line}`} style={{ color: "inherit", ...lineStyle }}>
          {line}
        </P>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xx-small)" }}>
      <FormLabel style={{ marginBottom: 0 }}>{label}</FormLabel>
      {children ? children(content) : content}
    </div>
  );
}
