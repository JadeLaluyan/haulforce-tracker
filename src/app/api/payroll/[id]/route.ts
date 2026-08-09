import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const payroll = await prisma.payrollInvoice.findUnique({
      where: { id },
      include: { driver: true },
    });
    if (!payroll) return Response.json({ error: "Payroll invoice not found" }, { status: 404 });
    const trips = await prisma.trip.findMany({
      where: {
        driverId: payroll.driverId,
        date: { gte: payroll.periodStart, lte: payroll.periodEnd },
        status: { not: "CANCELLED" },
      },
      orderBy: { date: "asc" },
    });
    return Response.json({ data: { ...payroll, trips } });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.payrollInvoice.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
