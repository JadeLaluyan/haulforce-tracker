import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { expenseSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search, sortKey, sortDir, range } = parseListParams(req);
    const category = req.nextUrl.searchParams.get("category");
    const where: Prisma.ExpenseWhereInput = {
      ...(range ? { date: { gte: range.from, lte: range.to } } : {}),
      ...(category && category !== "ALL"
        ? { category: category as Prisma.EnumExpenseCategoryFilter["equals"] }
        : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { notes: { contains: search, mode: "insensitive" } },
              { driver: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.ExpenseOrderByWithRelationInput =
      sortKey === "date" || sortKey === "amount" || sortKey === "category"
        ? { [sortKey]: sortDir }
        : { date: "desc" };

    const [data, total, sum] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { driver: { select: { id: true, name: true } } },
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);
    return Response.json({
      data,
      total,
      page,
      pageSize,
      sumAmount: Number(sum._sum.amount ?? 0),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const ex = parsed.data;
    const expense = await prisma.expense.create({
      data: {
        date: new Date(ex.date),
        category: ex.category,
        description: ex.description,
        amount: ex.amount,
        driverId: ex.driverId || null,
        notes: ex.notes || null,
      },
    });
    return Response.json({ data: expense }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
