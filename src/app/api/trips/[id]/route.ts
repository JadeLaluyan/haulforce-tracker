import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { tripSchema } from "@/lib/validation";
import { COMPANY } from "@/lib/config";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        driver: true,
        helper: true,
        customer: true,
        invoice: true,
        payments: { orderBy: { date: "desc" } },
      },
    });
    if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });
    return Response.json({ data: trip });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = tripSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;
    const existing = await prisma.trip.findUnique({ where: { id }, include: { invoice: true } });
    if (!existing) return Response.json({ error: "Trip not found" }, { status: 404 });

    const trip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: {
          ...(input.date ? { date: new Date(input.date) } : {}),
          ...(input.driverId ? { driverId: input.driverId } : {}),
          ...(input.helperId !== undefined ? { helperId: input.helperId || null } : {}),
          ...(input.customerId ? { customerId: input.customerId } : {}),
          ...(input.origin !== undefined ? { origin: input.origin } : {}),
          ...(input.destination !== undefined ? { destination: input.destination } : {}),
          ...(input.cargoType !== undefined ? { cargoType: input.cargoType } : {}),
          ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
          ...(input.tripRate !== undefined ? { tripRate: input.tripRate } : {}),
          ...(input.fuelCost !== undefined ? { fuelCost: input.fuelCost } : {}),
          ...(input.tollFee !== undefined ? { tollFee: input.tollFee } : {}),
          ...(input.mealAllowance !== undefined ? { mealAllowance: input.mealAllowance } : {}),
          ...(input.otherExpenses !== undefined ? { otherExpenses: input.otherExpenses } : {}),
          ...(input.driverFee !== undefined ? { driverFee: input.driverFee } : {}),
          ...(input.helperFee !== undefined ? { helperFee: input.helperFee } : {}),
          ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
          ...(input.status ? { status: input.status } : {}),
        },
      });
      if (input.tripRate !== undefined && existing.invoice) {
        const subtotal = input.tripRate;
        const vatAmount = (subtotal * COMPANY.vatRate) / 100;
        await tx.invoice.update({
          where: { id: existing.invoice.id },
          data: { subtotal, vatAmount, total: subtotal + vatAmount },
        });
      }
      return updated;
    });

    return Response.json({ data: trip });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.trip.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
