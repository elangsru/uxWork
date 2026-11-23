"use client";

import { useEffect, useRef, useState } from "react";
import { Form } from "@dnb/eufemia/extensions/forms";
import { SubmitIndicator } from "@dnb/eufemia/extensions/forms/Form";
import { Avatar, Badge, Button, CountryFlag, Dialog, Flex, FormStatus, Icon, List } from "@dnb/eufemia/components";
import { Span } from "@dnb/eufemia/elements";
import { funds_medium, investment_account_medium, loan_medium, office_buildings, savings_account_medium, transfer_medium } from "@dnb/eufemia/icons";

import type { ButtonClickEvent } from "@dnb/eufemia/components/button/types";

import { APPROVE_DELAY_MS, accountDetails, fmtAmount, fmtNok, type Transaction } from "./data";

/** Hvor lenge «Reaktiver» viser spinner før kvitteringen vises. */
const RESUME_DELAY_MS = 1500;

/** Samme varighet som transition på .receipt-footer--leaving i CSS-en. */
const RECEIPT_LEAVE_MS = 400;

export default function TransactionRow({
  tx,
  overline,
  balanceAfter,
  warning,
  isConfirmed,
  onConfirm,
  onConfirmReceipt,
  onReceiptDone,
  collapseOnDone,
  onClick,
}: {
  tx: Transaction;
  overline: string;
  balanceAfter?: number;
  warning?: string;
  isConfirmed?: boolean;
  onConfirm?: () => void;
  /** Kalles etter «Godkjenn» så siden kan vise kvittering. Dialogen bor i
   *  siden, ikke i raden: raden faller ut av listen når den blir bekreftet
   *  (alltid i eFaktura-fanen, og med statusfilter i «Til forfall»).
   *  Utelatt: kvitteringen vises som FormStatus i raden i stedet. */
  onConfirmReceipt?: () => void;
  /** Kalles når kvitteringen i raden er ferdig — eller raden avmonteres
   *  mens den vises. eFaktura-fanen holder raden i listen til da. */
  onReceiptDone?: () => void;
  /** Hele raden krymper bort når kvitteringen fader, ikke bare footeren.
   *  For eFaktura-fanen, der raden forsvinner fra listen etterpå. */
  collapseOnDone?: boolean;
  /** Klikk på selve raden, og på «Rediger» i footeren. */
  onClick?: () => void;
}) {
  const [approving, setApproving] = useState(false);
  // Uten onConfirmReceipt vises kvitteringen i raden: footeren blir stående
  // etter godkjenning, med en FormStatus i stedet for knappene. Fasene:
  // «shown» til brukeren klikker «Lukk», «leaving» mens den fader og raden
  // krymper, så null — footeren fjernes. Bare lokal state, så den forsvinner
  // også ved refresh.
  const [receipt, setReceipt] = useState<"shown" | "leaving" | null>(null);

  // Raden kan forsvinne mens godkjenningen pågår — tabbytte, endret filter, eller
  // at den forrige godkjenningen fjernet den fra listen. Uten opprydding kjører
  // timeren videre og kaller setApproving/onConfirm på en avmontert rad.
  const approveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningWidthRef = useRef<HTMLDivElement>(null);
  const receiptWidthRef = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      if (approveTimer.current !== null) clearTimeout(approveTimer.current);
    },
    [],
  );

  // Tabbytte eller filter kan avmontere raden midt i kvitteringen. Da må
  // siden likevel få beskjed, ellers blir raden stående i eFaktura-listen.
  const onReceiptDoneRef = useRef(onReceiptDone);
  const receiptActive = useRef(false);
  useEffect(() => {
    onReceiptDoneRef.current = onReceiptDone;
    receiptActive.current = receipt !== null;
  });

  useEffect(() => {
    if (receipt !== "leaving") return;
    const t = setTimeout(() => {
      setReceipt(null);
      onReceiptDoneRef.current?.();
    }, RECEIPT_LEAVE_MS);
    return () => clearTimeout(t);
  }, [receipt]);

  useEffect(
    () => () => {
      if (receiptActive.current) onReceiptDoneRef.current?.();
    },
    [],
  );

  // Knappene ligger inne i raden, så klikket bobler opp til radens onClick.
  // «Rediger» skal åpne det samme som raden; de andre knappene stopper boblingen.
  const edit = (e: ButtonClickEvent) => {
    e.event.stopPropagation();
    onClick?.();
  };

  const negativeBalance = balanceAfter !== undefined && balanceAfter < 0;
  const effectivelyUnconfirmed = tx.unconfirmed && !isConfirmed;

  const className = [
    "po-row",
    balanceAfter !== undefined && (negativeBalance ? "row-balance-negative" : "row-balance-positive"),
    effectivelyUnconfirmed && "po-row--unconfirmed",
    collapseOnDone && receipt && "po-row--receipt",
    collapseOnDone && receipt === "leaving" && "po-row--leaving",
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
    startNode = <Icon icon={{ transfer: transfer_medium, loan: loan_medium, savings: savings_account_medium, investment: investment_account_medium, funds: funds_medium }[tx.icon]} />;
  }

  // Beløpsteksten utledes av amountNok, slik at tallet som regnes med og teksten
  // som vises alltid er samme kilde. amountDisplay overstyrer bare når raden er i
  // en annen valuta — da vises kroneverdien over, også den fra amountNok.
  // Rader i kroner vises uten «kr»; enheten tas bare med når raden også har
  // et valutabeløp, så det er tydelig hvilket tall som er kroner.
  const amountText = tx.amountDisplay ?? fmtAmount(tx.amountNok);

  const endNode = tx.amountDisplay ? (
    <div className="po-row__amount">
      <Span size="x-small" weight="medium">
        ca {fmtNok(tx.amountNok)}
      </Span>
      <span>{amountText}</span>
    </div>
  ) : (
    amountText
  );

  return (
    <List.Item.Action className={className} chevronPosition="right" onClick={onClick}>
      <List.Cell.Start>{startNode}</List.Cell.Start>
      <List.Cell.Title>
        <List.Cell.Title.Overline>{overline}</List.Cell.Title.Overline>
        {tx.recipient}
        {/* Subline er laget for tekst og har ingen avstand; en 28 px badge
            havnet da rett under tittelen. xx-small (4 px) gir luft. */}
        {tx.badge && (
          <List.Cell.Title.Subline top="xx-small">
            <Badge status="neutral" subtle content={tx.badge} />
          </List.Cell.Title.Subline>
        )}
      </List.Cell.Title>
      <List.Cell.End>{endNode}</List.Cell.End>
      {receipt && (
        <List.Cell.Footer
          className={`actions-footer receipt-footer${receipt === "leaving" ? " receipt-footer--leaving" : ""}`}
        >
          {/* Meldingen venstrestilt, «Lukk» til høyre der «Godkjenn» stod.
              widthElement av samme grunn som på varselet: ellers låser
              FormStatus en max-width ut fra teksten ved mount, og boksen brøt
              før footeren var full. */}
          <Flex.Horizontal justify="space-between" align="center" wrap={false} style={{ width: "100%" }}>
            <div ref={receiptWidthRef} style={{ flex: 1, minWidth: 0 }}>
              <FormStatus
                state="success"
                widthElement={receiptWidthRef}
                text={
                  <>
                    Betaling godkjent og lagt til forfall.{" "}
                    {accountDetails[tx.accountKey].name} vil bli benyttet neste gang du betaler til {tx.recipient}.
                  </>
                }
              />
            </div>
            <Button
              variant="tertiary"
              text="Lukk"
              icon="close"
              iconPosition="left"
              disabled={receipt === "leaving"}
              onClick={(e: ButtonClickEvent) => {
                e.event.stopPropagation();
                setReceipt("leaving");
              }}
            />
          </Flex.Horizontal>
        </List.Cell.Footer>
      )}
      {effectivelyUnconfirmed && !receipt && (
        <List.Cell.Footer className="actions-footer">
          {/* Høyrestilt, med hovedhandlingen lengst til høyre. Footeren fyller
              ikke bredden av seg selv, så width: 100% trengs for justify. */}
          <Flex.Horizontal justify="flex-end" style={{ width: "100%" }}>
            <Button variant="tertiary" text="Rediger" icon={false} onClick={edit} />
            <Button
              variant="secondary"
              disabled={approving}
              onClick={(e: ButtonClickEvent) => {
                e.event.stopPropagation();
                setApproving(true);
                approveTimer.current = setTimeout(() => {
                  approveTimer.current = null;
                  setApproving(false);
                  onConfirm?.();
                  if (onConfirmReceipt) onConfirmReceipt();
                  else setReceipt("shown");
                }, APPROVE_DELAY_MS);
              }}
            >
              Godkjenn
              <SubmitIndicator state={approving ? "pending" : "complete"} />
            </Button>
          </Flex.Horizontal>
        </List.Cell.Footer>
      )}
      {warning && (
        <List.Cell.Footer className="warning-footer">
          {/* Varselet og knappene i samme footer, så de står samlet under raden.
              Knappene følger samme mønster som på ubekreftet eFaktura. */}
          {/* FormStatus setter inline max-width ut fra elementet i widthElement.
              Uten det måler den seg selv, så bredden kunne bare krympe ved
              resize, aldri vokse igjen. Wrapperen fyller footeren uansett. */}
          <div ref={warningWidthRef} style={{ width: "100%" }}>
            <Flex.Vertical align="stretch" gap="small">
              <FormStatus state="warning" text={warning} stretch widthElement={warningWidthRef} />
              {/* Høyrestilt med hovedhandlingen lengst til høyre, som Rediger +
                  Godkjenn på ubekreftet eFaktura. */}
              <Flex.Horizontal justify="flex-end">
                <Button variant="tertiary" text="Rediger" icon={false} onClick={edit} />
                {/* Kvitteringen er en Form.SubmitConfirmation: onSubmit svarer
                    med en customStatus, og den åpner dialogen i etterkant i
                    stedet for å spørre før. Wrapperen stopper boblingen —
                    også fra dialogen, siden React-hendelser bobler gjennom
                    portalen og ellers ville åpnet raden. */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Form.Handler
                    onSubmit={async () => {
                      await new Promise((resolve) => setTimeout(resolve, RESUME_DELAY_MS));
                      return { customStatus: "resumed" };
                    }}
                  >
                    <Form.SubmitButton variant="secondary" text="Reaktiver" icon={false} />
                    <Form.SubmitConfirmation
                      onSubmitResult={({ submitState, setConfirmationState }) => {
                        if (submitState?.customStatus) setConfirmationState("readyToBeSubmitted");
                      }}
                      renderWithState={({ connectWithDialog, cancelHandler }) => (
                        <Dialog
                          variant="confirmation"
                          title="Reaktivert"
                          description={`${tx.type === "overforing" ? "Overføringen" : "Betalingen"} er reaktivert med forfallsdato ${tx.date}.`}
                          confirmText="Lukk"
                          hideDecline
                          {...connectWithDialog}
                          // «Lukk» skal bare lukke — connectWithDialog sin
                          // onConfirm ville sendt skjemaet på nytt.
                          onConfirm={cancelHandler}
                          onClose={cancelHandler}
                        />
                      )}
                    />
                  </Form.Handler>
                </div>
              </Flex.Horizontal>
            </Flex.Vertical>
          </div>
        </List.Cell.Footer>
      )}
    </List.Item.Action>
  );
}
