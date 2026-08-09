import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  settled: z.boolean().optional(),
  amount: z.coerce.number().positive().optional(),
  date: z.string().optional(),
  reason: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const a = parsed.data;
    const advance = await prisma.cashAdvance.update({
      where: { id },
      data: {
        ...(a.settled !== undefined
          ? { settled: a.settled, settledAt: a.settled ? new Date() : null }
          : {}),
        ...(a.amount !== undefined ? { amount: a.amount } : {}),
        ...(a.date ? { date: new Date(a.date) } : {}),
        ...(a.reason !== undefined ? { reason: a.reason || null } : {}),
      },
    });
    return Response.json({ data: advance });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.cashAdvance.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
