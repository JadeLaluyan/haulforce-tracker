import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { driverSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search, sortKey, sortDir } = parseListParams(req, {
      defaultPageSize: 10,
    });
    const all = req.nextUrl.searchParams.get("all") === "1";
    const where: Prisma.DriverWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { licenseNo: { contains: search, mode: "insensitive" } },
            { contact: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const orderBy: Prisma.DriverOrderByWithRelationInput =
      sortKey === "name" || sortKey === "createdAt"
        ? { [sortKey]: sortDir }
        : { name: "asc" };

    if (all) {
      const data = await prisma.driver.findMany({ where, orderBy });
      return Response.json({ data, total: data.length, page: 1, pageSize: data.length });
    }

    const [rows, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { trips: true } },
          advances: { where: { settled: false }, select: { amount: true } },
        },
      }),
      prisma.driver.count({ where }),
    ]);
    const data = rows.map(({ _count, advances, ...d }) => ({
      ...d,
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
    const parsed = driverSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const driver = await prisma.driver.create({
      data: {
        name: d.name,
        licenseNo: d.licenseNo || null,
        contact: d.contact || null,
        address: d.address || null,
        active: d.active,
      },
    });
    return Response.json({ data: driver }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
