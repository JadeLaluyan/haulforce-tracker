import type { PrismaClient } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export async function recalcTripPaymentStatus(tx: Tx, tripId: string): Promise<void> {
  const trip = await tx.trip.findUnique({
    where: { id: tripId },
    include: { payments: true, invoice: true },
  });
  if (!trip) return;
  const due = trip.invoice ? Number(trip.invoice.total) : Number(trip.tripRate) * 1.12;
  const paid = trip.payments.reduce((s, p) => s + Number(p.amount), 0);
  const status = paid <= 0.005 ? "UNPAID" : paid + 0.005 >= due ? "PAID" : "PARTIAL";
  await tx.trip.update({ where: { id: tripId }, data: { paymentStatus: status } });
}
