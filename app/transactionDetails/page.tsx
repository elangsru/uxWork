import { fetchPayments } from "@/lib/payments";
import PaymentDetailsView from "./PaymentDetailsView";

export const dynamic = "force-dynamic";

export default async function TransactionDetailsPage() {
  const payments = await fetchPayments();

  return <PaymentDetailsView payments={payments} />;
}
