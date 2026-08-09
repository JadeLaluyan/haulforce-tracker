import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { customerSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search, sortKey, sortDir } = parseListParams(req);
    const all = req.nextUrl.searchParams.get("all") === "1";
    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { contact: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const orderBy: Prisma.CustomerOrderByWithRelationInput =
      sortKey === "name" || sortKey === "company" || sortKey === "createdAt"
        ? { [sortKey]: sortDir }
        : { name: "asc" };

    if (all) {
      const data = await prisma.customer.findMany({ where, orderBy });
      return Response.json({ data, total: data.length, page: 1, pageSize: data.length });
    }

    const [rows, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          trips: { where: { status: { not: "CANCELLED" } }, select: { tripRate: true } },
          payments: { select: { amount: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);
    const data = rows.map(({ trips, payments, ...c }) => {
      const billed = trips.reduce((s, t) => s + Number(t.tripRate) * 1.12, 0);
      const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
      return { ...c, outstanding: Math.max(0, billed - paid) };
    });
    return Response.json({ data, total, page, pageSize });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const c = parsed.data;
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        company: c.company || null,
        address: c.address || null,
        contact: c.contact || null,
        email: c.email || null,
        tin: c.tin || null,
        terms: c.terms,
      },
    });
    return Response.json({ data: customer }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
