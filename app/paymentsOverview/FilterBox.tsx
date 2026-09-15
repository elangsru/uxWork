"use client";

import { Children } from "react";
import { Grid } from "@dnb/eufemia/components";

/**
 * Filterboksen over gruppene. Var duplisert ordrett i begge tabbene — samme
 * ramme, samme 2-kolonners grid, samme responsive span.
 *
 * `fields` legges i grid-cellene (én kolonne hver på store skjermer, full bredde
 * på mindre). `children` legges under gridet, som søsken i boksens flex-kolonne;
 * «Til forfall» bruker det til betalingstype-filteret.
 */
export default function FilterBox({
  fields,
  children,
}: {
  fields: React.ReactNode[];
  children?: React.ReactNode;
}) {
  return (
    <div className="po-filterbox">
      <Grid.Container
        columns={{ small: 1, medium: 1, large: 2 }}
        columnGap="medium"
        rowGap="medium"
      >
        {Children.toArray(fields).map((field, i) => (
          <Grid.Item
            key={i}
            span={{ small: "full", medium: "full", large: [i + 1, i + 1] }}
          >
            {field}
          </Grid.Item>
        ))}
      </Grid.Container>
      {children}
    </div>
  );
}
