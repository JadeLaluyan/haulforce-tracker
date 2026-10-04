import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { collectorSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search, sortKey, sortDir } = parseListParams(req, {
      defaultPageSize: 10,
    });

    const where: Prisma.CollectorWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contact: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const orderBy: Prisma.CollectorOrderByWithRelationInput =
      sortKey === "name" || sortKey === "createdAt"
        ? { [sortKey]: sortDir }
        : { name: "asc" };

    const [rows, total] = await Promise.all([
      prisma.collector.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.collector.count({ where }),
    ]);

    return Response.json({ data: rows, total, page, pageSize });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = collectorSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const collector = await prisma.collector.create({
      data: {
        name: parsed.data.name,
        contact: parsed.data.contact || null,
        address: parsed.data.address || null,
        active: parsed.data.active,
      },
    });

    return Response.json({ data: collector }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
