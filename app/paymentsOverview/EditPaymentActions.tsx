"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Flex } from "@dnb/eufemia/components";
import { SubmitIndicator } from "@dnb/eufemia/extensions/forms/Form";
import { Hr } from "@dnb/eufemia/elements";
import { refresh, stop, trash } from "@dnb/eufemia/icons";

import { APPROVE_DELAY_MS } from "./data";

/**
 * Knapperaden nederst i betalingsmodalen, delt av EditPaymentForm og
 * EditDomesticPaymentForm. Går over hele modalens bredde (ikke bare 488px-
 * feltene), så «Slett» flukter med «Lukk» oppe til høyre.
 *
 * Ingen av knappene lagrer, stopper eller sletter ennå. Lagre viser spinner
 * like lenge som «Godkjenn» på en eFaktura og lukker så modalen; Slett lukker
 * med en gang; Stopp veksler bare til «Reaktiver» og tilbake, slik at modalen blir
 * stående og brukeren ser at betalingen er stoppet. Tilstanden eies av
 * skjemaet, som også viser varselet under mottakeren.
 */
export default function EditPaymentActions({
  onClose,
  stopped,
  onToggleStop,
  locked = false,
}: {
  onClose: () => void;
  stopped: boolean;
  onToggleStop: () => void;
  /** Stopp og Slett er ikke tillatt (avdrag på lån). Knappene vises
   *  deaktivert, så det er tydelig at handlingene finnes men er sperret. */
  locked?: boolean;
}) {
  const [saving, setSaving] = useState(false);

  // Modalen kan lukkes (Lukk, Escape) mens Lagre venter. Uten opprydding ville
  // timeren kalt onClose på et skjema som allerede er borte.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (saveTimer.current !== null) clearTimeout(saveTimer.current);
    },
    [],
  );

  const save = () => {
    setSaving(true);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      onClose();
    }, APPROVE_DELAY_MS);
  };

  // Fragment: skillelinjen og knapperaden blir egne elementer i skjemaets
  // flex-kolonne, så de får samme 32px-gap som feltene.
  return (
    <>
      <Hr space={0} />
      <Flex.Horizontal align="center">
        {/* Samme oppsett som «Godkjenn» i TransactionRow: deaktivert mens
            SubmitIndicator går, så den ikke kan trykkes to ganger. */}
        <Button variant="primary" disabled={saving} onClick={save}>
          Lagre
          <SubmitIndicator state={saving ? "pending" : "complete"} />
        </Button>
        <Button
          variant="tertiary"
          text={stopped ? "Reaktiver" : "Stopp"}
          icon={stopped ? refresh : stop}
          iconPosition="left"
          disabled={locked}
          // Bare på Stopp — Reaktiver har ikke fått noen tekst ennå. Ingen
          // tooltip på deaktivert knapp, den kan ikke få hover eller fokus.
          tooltip={stopped || locked ? undefined : "Stopper betalingen til du gjenopptar"}
          onClick={onToggleStop}
          // marginLeft: auto skyver Stopp og Slett sammen helt til høyre.
          style={{ marginLeft: "auto" }}
        />
        {/* status="error" er Eufemias destruktive variant av tertiærknappen. */}
        <Button
          variant="tertiary"
          status="error"
          text="Slett"
          icon={trash}
          iconPosition="left"
          disabled={locked}
          tooltip={locked ? undefined : "Sletter betalingen permanent"}
          onClick={onClose}
        />
      </Flex.Horizontal>
    </>
  );
}
