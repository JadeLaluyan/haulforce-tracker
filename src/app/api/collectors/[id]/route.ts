import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { collectorSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const collector = await prisma.collector.findUnique({ where: { id } });
    if (!collector) return Response.json({ error: "Collector not found" }, { status: 404 });
    return Response.json({ data: collector });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = collectorSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const collector = await prisma.collector.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.contact !== undefined ? { contact: d.contact || null } : {}),
        ...(d.address !== undefined ? { address: d.address || null } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
      },
    });

    return Response.json({ data: collector });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.collector.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
