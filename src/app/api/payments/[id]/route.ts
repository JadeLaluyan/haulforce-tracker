import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { paymentSchema } from "@/lib/validation";
import { recalcTripPaymentStatus } from "@/lib/server/payments";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = paymentSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const p = parsed.data;
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Payment not found" }, { status: 404 });

    const payment = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          ...(p.date ? { date: new Date(p.date) } : {}),
          ...(p.customerId ? { customerId: p.customerId } : {}),
          ...(p.tripId !== undefined ? { tripId: p.tripId || null } : {}),
          ...(p.amount !== undefined ? { amount: p.amount } : {}),
          ...(p.method ? { method: p.method } : {}),
          ...(p.refNo !== undefined ? { refNo: p.refNo || null } : {}),
          ...(p.notes !== undefined ? { notes: p.notes || null } : {}),
        },
      });
      if (existing.tripId) await recalcTripPaymentStatus(tx, existing.tripId);
      if (updated.tripId && updated.tripId !== existing.tripId)
        await recalcTripPaymentStatus(tx, updated.tripId);
      return updated;
    });
    return Response.json({ data: payment });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Payment not found" }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });
      if (existing.tripId) await recalcTripPaymentStatus(tx, existing.tripId);
    });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
