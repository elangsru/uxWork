import { Button } from "@dnb/eufemia/components";
import { H1, P } from "@dnb/eufemia/elements";

export default function Home() {
  return (
    <main
      style={{
        background: "white",
        minHeight: "100vh",
        padding: "48px 96px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        alignItems: "flex-start",
      }}
    >
      <H1 size="x-large" suppressHydrationWarning>Prosjekter</H1>
      <P>On going projects by Espen Langsrud</P>
      <Button
        variant="tertiary"
        text="Pending payments"
        href="/paymentsOverview"
      />
      <Button
        variant="tertiary"
        text="Payment confirmation"
        href="/paymentConfirmation"
      />
    </main>
  );
}
