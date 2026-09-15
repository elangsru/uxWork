"use client";

import { useEffect, useRef, useState } from "react";
import { SubmitIndicator } from "@dnb/eufemia/extensions/forms/Form";
import { Avatar, Badge, Button, CountryFlag, FormStatus, Icon, List } from "@dnb/eufemia/components";
import { Span } from "@dnb/eufemia/elements";
import { edit, loan_medium, office_buildings, transfer_medium } from "@dnb/eufemia/icons";

import { fmtNok, type Transaction } from "./data";

/** Hvor lenge «Godkjenn» viser spinner før fakturaen regnes som bekreftet.
 *  Rent demo-tidsforbruk. */
const APPROVE_DELAY_MS = 5000;

export default function TransactionRow({
  tx,
  overline,
  balanceAfter,
  warning,
  isConfirmed,
  onConfirm,
}: {
  tx: Transaction;
  overline: string;
  balanceAfter?: number;
  warning?: string;
  isConfirmed?: boolean;
  onConfirm?: () => void;
}) {
  const [approving, setApproving] = useState(false);

  // Raden kan forsvinne mens godkjenningen pågår — tabbytte, endret filter, eller
  // at den forrige godkjenningen fjernet den fra listen. Uten opprydding kjører
  // timeren videre og kaller setApproving/onConfirm på en avmontert rad.
  const approveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (approveTimer.current !== null) clearTimeout(approveTimer.current);
    },
    [],
  );

  const negativeBalance = balanceAfter !== undefined && balanceAfter < 0;
  const effectivelyUnconfirmed = tx.unconfirmed && !isConfirmed;

  const className = [
    "po-row",
    balanceAfter !== undefined && (negativeBalance ? "row-balance-negative" : "row-balance-positive"),
    effectivelyUnconfirmed && "po-row--unconfirmed",
  ]
    .filter(Boolean)
    .join(" ");

  // Eufemia: person får bokstavversjonen, selskap får ikonversjonen. Bokstaven
  // sendes IKKE inn ferdig utregnet — Avatar tar charAt(0).toUpperCase() av
  // children selv, og legger hele strengen i en .dnb-sr-only. Sender vi bare «K»
  // blir skjermlesertekst «K» i stedet for «Kim Olsen».
  // aria-hidden fordi radens tittel alt viser mottakernavnet: avataren er
  // dekorativ her, og duplisert opplesing ville vært støy. hasLabel forteller
  // Eufemia at merkingen er håndtert utenfor komponenten — kilden sjekker
  // `if (!avatarGroupContext && !hasLabel)`, så aria-hidden alene demper ikke
  // «Avatar group required». Docs peker på nettopp aria-hidden som gyldig grunn
  // til å sette hasLabel i stedet for å pakke hver rad i en Avatar.Group.
  const avatarNode =
    tx.avatarKind === "company" ? (
      <Avatar size="small" variant="primary" icon={office_buildings} hasLabel aria-hidden />
    ) : tx.avatarKind === "person" ? (
      <Avatar size="small" variant="primary" hasLabel aria-hidden>
        {tx.recipient}
      </Avatar>
    ) : null;

  let startNode: React.ReactNode;
  if (tx.flagIso && avatarNode) {
    startNode = (
      <Badge
        content={<CountryFlag iso={tx.flagIso} size="xx-small" />}
        vertical="bottom"
        horizontal="right"
        variant="content"
      >
        {avatarNode}
      </Badge>
    );
  } else if (avatarNode) {
    startNode = avatarNode;
  } else if (tx.icon) {
    startNode = <Icon icon={tx.icon === "transfer" ? transfer_medium : loan_medium} />;
  }

  // Beløpsteksten utledes av amountNok, slik at tallet som regnes med og teksten
  // som vises alltid er samme kilde. amountDisplay overstyrer bare når raden er i
  // en annen valuta.
  const amountText = tx.amountDisplay ?? fmtNok(tx.amountNok);

  const endNode = tx.nokEquivalent ? (
    <div className="po-row__amount">
      <Span size="x-small" weight="medium">
        {tx.nokEquivalent}
      </Span>
      <span>{amountText}</span>
    </div>
  ) : (
    amountText
  );

  return (
    <List.Item.Action className={className} chevronPosition="right">
      <List.Cell.Start>{startNode}</List.Cell.Start>
      <List.Cell.Title>
        <List.Cell.Title.Overline>{overline}</List.Cell.Title.Overline>
        {tx.recipient}
        {tx.badge && (
          <List.Cell.Title.Subline>
            <Badge status="neutral" subtle content={tx.badge} />
          </List.Cell.Title.Subline>
        )}
      </List.Cell.Title>
      <List.Cell.End>{endNode}</List.Cell.End>
      {effectivelyUnconfirmed && (
        <List.Cell.Footer>
          <div className="po-row__actions">
            <Button variant="tertiary" text="Rediger" icon={edit} iconPosition="left" />
            <Button
              variant="secondary"
              disabled={approving}
              onClick={() => {
                setApproving(true);
                approveTimer.current = setTimeout(() => {
                  approveTimer.current = null;
                  setApproving(false);
                  onConfirm?.();
                }, APPROVE_DELAY_MS);
              }}
            >
              Godkjenn
              <SubmitIndicator state={approving ? "pending" : "complete"} />
            </Button>
          </div>
        </List.Cell.Footer>
      )}
      {warning && (
        <List.Cell.Footer className="warning-footer">
          <FormStatus state="warning" text={warning} stretch />
        </List.Cell.Footer>
      )}
    </List.Item.Action>
  );
}
