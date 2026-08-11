import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { helperSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const helper = await prisma.helper.findUnique({ where: { id } });
    if (!helper) return Response.json({ error: "Helper not found" }, { status: 404 });
    return Response.json({ data: helper });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = helperSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const h = parsed.data;
    const helper = await prisma.helper.update({
      where: { id },
      data: {
        ...(h.name !== undefined ? { name: h.name } : {}),
        ...(h.contact !== undefined ? { contact: h.contact || null } : {}),
        ...(h.address !== undefined ? { address: h.address || null } : {}),
        ...(h.active !== undefined ? { active: h.active } : {}),
      },
    });
    return Response.json({ data: helper });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const tripCount = await prisma.trip.count({ where: { helperId: id } });
    if (tripCount > 0) {
      return Response.json(
        { error: "Cannot delete a helper with recorded trips. Mark them inactive instead." },
        { status: 409 }
      );
    }
    await prisma.helper.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
