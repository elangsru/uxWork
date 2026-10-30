"use client";

import { Button, Flex } from "@dnb/eufemia/components";
import { Hr } from "@dnb/eufemia/elements";
import { refresh, stop, trash } from "@dnb/eufemia/icons";

/**
 * Knapperaden nederst i betalingsmodalen, delt av EditPaymentForm og
 * EditDomesticPaymentForm. Går over hele modalens bredde (ikke bare 488px-
 * feltene), så «Slett» flukter med «Lukk» oppe til høyre.
 *
 * Ingen av knappene lagrer, stopper eller sletter ennå. Lagre og Slett lukker
 * modalen; Stopp veksler bare til Gjenoppta og tilbake, slik at modalen blir
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
  // Fragment: skillelinjen og knapperaden blir egne elementer i skjemaets
  // flex-kolonne, så de får samme 32px-gap som feltene.
  return (
    <>
      <Hr space={0} />
      <Flex.Horizontal align="center">
        <Button variant="primary" text="Lagre" onClick={onClose} />
        <Button
          variant="tertiary"
          text={stopped ? "Gjenoppta" : "Stopp"}
          icon={stopped ? refresh : stop}
          iconPosition="left"
          disabled={locked}
          // Bare på Stopp — Gjenoppta har ikke fått noen tekst ennå. Ingen
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
