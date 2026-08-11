import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { helperSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search, sortKey, sortDir } = parseListParams(req, {
      defaultPageSize: 10,
    });
    const all = req.nextUrl.searchParams.get("all") === "1";
    const where: Prisma.HelperWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contact: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const orderBy: Prisma.HelperOrderByWithRelationInput =
      sortKey === "name" || sortKey === "createdAt"
        ? { [sortKey]: sortDir }
        : { name: "asc" };

    if (all) {
      const data = await prisma.helper.findMany({ where, orderBy });
      return Response.json({ data, total: data.length, page: 1, pageSize: data.length });
    }

    const [rows, total] = await Promise.all([
      prisma.helper.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { trips: true } },
          advances: { where: { settled: false }, select: { amount: true } },
        },
      }),
      prisma.helper.count({ where }),
    ]);
    const data = rows.map(({ _count, advances, ...h }) => ({
      ...h,
      tripCount: _count.trips,
      advanceOutstanding: advances.reduce((s, a) => s + Number(a.amount), 0),
    }));
    return Response.json({ data, total, page, pageSize });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = helperSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const h = parsed.data;
    const helper = await prisma.helper.create({
      data: {
        name: h.name,
        contact: h.contact || null,
        address: h.address || null,
        active: h.active,
      },
    });
    return Response.json({ data: helper }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
