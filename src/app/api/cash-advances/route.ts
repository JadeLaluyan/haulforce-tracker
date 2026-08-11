import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { cashAdvanceSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const driverId = sp.get("driverId");
    const helperId = sp.get("helperId");
    const where: Prisma.CashAdvanceWhereInput = driverId
      ? { driverId }
      : helperId
        ? { helperId }
        : {};
    const data = await prisma.cashAdvance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        driver: { select: { id: true, name: true } },
        helper: { select: { id: true, name: true } },
      },
    });
    const outstanding = data
      .filter((a) => !a.settled)
      .reduce((s, a) => s + Number(a.amount), 0);
    return Response.json({ data, outstanding });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cashAdvanceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const a = parsed.data;
    const advance = await prisma.cashAdvance.create({
      data: {
        driverId: a.driverId || null,
        helperId: a.helperId || null,
        date: new Date(a.date),
        amount: a.amount,
        reason: a.reason || null,
      },
    });
    return Response.json({ data: advance }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
