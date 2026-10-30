"use client";

import { Button, Flex } from "@dnb/eufemia/components";
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
}: {
  onClose: () => void;
  stopped: boolean;
  onToggleStop: () => void;
}) {
  return (
    <Flex.Horizontal align="center">
      <Button variant="primary" text="Lagre" onClick={onClose} />
      <Button
        variant="tertiary"
        text={stopped ? "Gjenoppta" : "Stopp"}
        icon={stopped ? refresh : stop}
        iconPosition="left"
        // Bare på Stopp — Gjenoppta har ikke fått noen tekst ennå.
        tooltip={stopped ? undefined : "Stopper betalingen til du gjenopptar"}
        onClick={onToggleStop}
      />
      {/* status="error" er Eufemias destruktive variant av tertiærknappen.
          marginLeft: auto skyver den helt til høyre. */}
      <Button
        variant="tertiary"
        status="error"
        text="Slett"
        icon={trash}
        iconPosition="left"
        tooltip="Sletter betalingen permanent"
        onClick={onClose}
        style={{ marginLeft: "auto" }}
      />
    </Flex.Horizontal>
  );
}
