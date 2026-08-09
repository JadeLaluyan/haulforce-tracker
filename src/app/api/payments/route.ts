import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { paymentSchema } from "@/lib/validation";
import { recalcTripPaymentStatus } from "@/lib/server/payments";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search, sortKey, sortDir, range } = parseListParams(req);
    const where: Prisma.PaymentWhereInput = {
      ...(range ? { date: { gte: range.from, lte: range.to } } : {}),
      ...(search
        ? {
            OR: [
              { refNo: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
              { customer: { company: { contains: search, mode: "insensitive" } } },
              { trip: { tripCode: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.PaymentOrderByWithRelationInput =
      sortKey === "date" || sortKey === "amount" || sortKey === "method"
        ? { [sortKey]: sortDir }
        : { date: "desc" };

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: { select: { id: true, name: true, company: true } },
          trip: { select: { id: true, tripCode: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    return Response.json({ data, total, page, pageSize });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const p = parsed.data;
    const payment = await prisma.$transaction(async (tx) => {
      let invoiceId: string | null = null;
      if (p.tripId) {
        const trip = await tx.trip.findUnique({
          where: { id: p.tripId },
          include: { invoice: true },
        });
        invoiceId = trip?.invoice?.id ?? null;
      }
      const created = await tx.payment.create({
        data: {
          date: new Date(p.date),
          customerId: p.customerId,
          tripId: p.tripId || null,
          invoiceId,
          amount: p.amount,
          method: p.method,
          refNo: p.refNo || null,
          notes: p.notes || null,
        },
      });
      if (p.tripId) await recalcTripPaymentStatus(tx, p.tripId);
      return created;
    });
    return Response.json({ data: payment }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
