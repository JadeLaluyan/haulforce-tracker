import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseListParams, handleError } from "@/lib/server/query";
import { tripSchema } from "@/lib/validation";
import { COMPANY } from "@/lib/config";

const SORTABLE: Record<string, string> = {
  tripCode: "tripCode",
  date: "date",
  origin: "origin",
  destination: "destination",
  tripRate: "tripRate",
  status: "status",
};

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, search, sortKey, sortDir, range } = parseListParams(req);
    const where: Prisma.TripWhereInput = {
      ...(range ? { date: { gte: range.from, lte: range.to } } : {}),
      ...(search
        ? {
            OR: [
              { tripCode: { contains: search, mode: "insensitive" } },
              { origin: { contains: search, mode: "insensitive" } },
              { destination: { contains: search, mode: "insensitive" } },
              { cargoType: { contains: search, mode: "insensitive" } },
              { driver: { name: { contains: search, mode: "insensitive" } } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
              { customer: { company: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.TripOrderByWithRelationInput =
      sortKey && SORTABLE[sortKey] ? { [SORTABLE[sortKey]]: sortDir } : { date: "desc" };

    const [data, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          driver: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, company: true } },
          invoice: { select: { id: true, invoiceNo: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return Response.json({ data, total, page, pageSize });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = tripSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new Error("Customer not found");
      const tripCount = await tx.trip.count();
      const tripCode = `TRP-${String(tripCount + 1).padStart(4, "0")}`;
      const year = new Date().getFullYear();
      const invoiceCount = await tx.invoice.count();
      const invoiceNo = `INV-${year}-${String(invoiceCount + 1).padStart(4, "0")}`;

      const subtotal = input.tripRate;
      const vatAmount = (subtotal * COMPANY.vatRate) / 100;
      const total = subtotal + vatAmount;

      const trip = await tx.trip.create({
        data: {
          tripCode,
          date: new Date(input.date),
          driverId: input.driverId,
          customerId: input.customerId,
          origin: input.origin,
          destination: input.destination,
          cargoType: input.cargoType,
          weightKg: input.weightKg,
          tripRate: input.tripRate,
          fuelCost: input.fuelCost,
          tollFee: input.tollFee,
          mealAllowance: input.mealAllowance,
          otherExpenses: input.otherExpenses,
          driverFee: input.driverFee,
          notes: input.notes || null,
          status: input.status,
          invoice: {
            create: {
              invoiceNo,
              invoiceDate: new Date(input.date),
              paymentTerms: customer.terms || input.paymentTerms,
              vatRate: COMPANY.vatRate,
              subtotal,
              vatAmount,
              total,
            },
          },
        },
        include: { invoice: true },
      });
      return trip;
    });

    return Response.json({ data: result }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
