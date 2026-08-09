import { NextRequest } from "next/server";
import { endOfDay, startOfDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { payrollGenerateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search } = parseListParams(req);
    const where = search
      ? {
          OR: [
            { payrollNo: { contains: search, mode: "insensitive" as const } },
            { driver: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      prisma.payrollInvoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { driver: { select: { id: true, name: true } } },
      }),
      prisma.payrollInvoice.count({ where }),
    ]);
    return Response.json({ data, total, page, pageSize });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = payrollGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { driverId, periodStart, periodEnd } = parsed.data;
    const from = startOfDay(new Date(periodStart));
    const to = endOfDay(new Date(periodEnd));
    if (from > to) {
      return Response.json({ error: "Period start must be before period end" }, { status: 400 });
    }

    const trips = await prisma.trip.findMany({
      where: { driverId, date: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      orderBy: { date: "asc" },
    });
    const totalEarnings = trips.reduce(
      (s, t) => s + Number(t.driverFee) + Number(t.mealAllowance),
      0
    );

    const payroll = await prisma.$transaction(async (tx) => {
      const count = await tx.payrollInvoice.count();
      const payrollNo = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
      return tx.payrollInvoice.create({
        data: {
          payrollNo,
          driverId,
          periodStart: from,
          periodEnd: to,
          totalTrips: trips.length,
          totalEarnings,
        },
        include: { driver: true },
      });
    });

    return Response.json({ data: payroll }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
