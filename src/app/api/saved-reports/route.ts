import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";

const saveSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  periodFrom: z.string().min(1),
  periodTo: z.string().min(1),
  payload: z.unknown(),
});

export async function GET() {
  try {
    const data = await prisma.savedReport.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        periodFrom: true,
        periodTo: true,
        createdAt: true,
      },
    });
    return Response.json({ data });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const r = parsed.data;
    const saved = await prisma.savedReport.create({
      data: {
        type: r.type,
        title: r.title,
        periodFrom: new Date(r.periodFrom),
        periodTo: new Date(r.periodTo),
        payload: r.payload as object,
      },
    });
    return Response.json({ data: saved }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
