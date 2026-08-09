import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { expenseSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = expenseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const ex = parsed.data;
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(ex.date ? { date: new Date(ex.date) } : {}),
        ...(ex.category ? { category: ex.category } : {}),
        ...(ex.description !== undefined ? { description: ex.description } : {}),
        ...(ex.amount !== undefined ? { amount: ex.amount } : {}),
        ...(ex.driverId !== undefined ? { driverId: ex.driverId || null } : {}),
        ...(ex.notes !== undefined ? { notes: ex.notes || null } : {}),
      },
    });
    return Response.json({ data: expense });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
