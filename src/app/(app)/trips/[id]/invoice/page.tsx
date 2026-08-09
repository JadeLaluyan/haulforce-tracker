import { InvoiceView } from "@/features/trips/invoice-view";

export default async function TripInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceView tripId={id} />;
}
