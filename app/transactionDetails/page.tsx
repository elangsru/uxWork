import { fetchPayments } from "@/lib/payments";
import PaymentDetailsView from "./PaymentDetailsView";

export default async function TransactionDetailsPage() {
  const payments = await fetchPayments();

  return (
    <main style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem" }}>
      <h1>Transaksjonsdetaljer</h1>
      <PaymentDetailsView payments={payments} />
    </main>
  );
}
