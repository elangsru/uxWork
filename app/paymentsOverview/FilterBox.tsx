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
 *
 * `layout="row"` legger feltene i én flex-rad i stedet for gridet, f.eks. når
 * en celle skal ta resten av bredden og en annen bare det den trenger.
 */
export default function FilterBox({
  fields,
  children,
  layout = "grid",
}: {
  fields: React.ReactNode[];
  children?: React.ReactNode;
  layout?: "grid" | "row";
}) {
  if (layout === "row") {
    return (
      <div className="po-filterbox">
        <div className="po-filterbox__row">{fields}</div>
        {children}
      </div>
    );
  }
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
