import { NextRequest } from "next/server";
import { monthLabel, startOfMonth, subMonths } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { resolvePeriod } from "@/lib/period";
import { handleError } from "@/lib/server/query";
import type { DashboardStats } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const range = resolvePeriod(sp.get("period"), sp.get("from"), sp.get("to"));
    const dateFilter = { gte: range.from, lte: range.to };

    const [trips, expenses, payments, allTripsWithPayments, activeDrivers] =
      await Promise.all([
        prisma.trip.findMany({
          where: { date: dateFilter, status: { not: "CANCELLED" } },
          include: { customer: true, driver: true },
          orderBy: { date: "desc" },
        }),
        prisma.expense.findMany({ where: { date: dateFilter } }),
        prisma.payment.findMany({ where: { date: dateFilter } }),
        prisma.trip.findMany({
          where: { status: { not: "CANCELLED" } },
          include: { payments: true, customer: true },
        }),
        prisma.driver.count({ where: { active: true } }),
      ]);

    const totalRevenue = trips.reduce((s, t) => s + Number(t.tripRate), 0);
    const tripExpenses = trips.reduce(
      (s, t) =>
        s +
        Number(t.fuelCost) +
        Number(t.tollFee) +
        Number(t.mealAllowance) +
        Number(t.otherExpenses) +
        Number(t.driverFee),
      0
    );
    const generalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalExpenses = tripExpenses + generalExpenses;
    const paymentsReceived = payments.reduce((s, p) => s + Number(p.amount), 0);

    // Accounts receivable across all time (billed - paid per customer)
    const byCustomer = new Map<
      string,
      { id: string; name: string; billed: number; paid: number }
    >();
    for (const t of allTripsWithPayments) {
      const key = t.customerId;
      const entry =
        byCustomer.get(key) ??
        ({
          id: t.customerId,
          name: t.customer.company || t.customer.name,
          billed: 0,
          paid: 0,
        } as { id: string; name: string; billed: number; paid: number });
      const vat = Number(t.tripRate) * 0.12;
      entry.billed += Number(t.tripRate) + vat;
      entry.paid += t.payments.reduce((s, p) => s + Number(p.amount), 0);
      byCustomer.set(key, entry);
    }
    const creditors = Array.from(byCustomer.values())
      .map((c) => ({ ...c, outstanding: Math.max(0, c.billed - c.paid) }))
      .filter((c) => c.outstanding > 0.005)
      .sort((a, b) => b.outstanding - a.outstanding);
    const accountsReceivable = creditors.reduce((s, c) => s + c.outstanding, 0);

    // 6-month trend
    const monthly: DashboardStats["monthly"] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(new Date(), i));
      const mEnd = startOfMonth(subMonths(new Date(), i - 1));
      const [mTrips, mExpenses] = await Promise.all([
        prisma.trip.findMany({
          where: { date: { gte: mStart, lt: mEnd }, status: { not: "CANCELLED" } },
        }),
        prisma.expense.aggregate({
          where: { date: { gte: mStart, lt: mEnd } },
          _sum: { amount: true },
        }),
      ]);
      const rev = mTrips.reduce((s, t) => s + Number(t.tripRate), 0);
      const exp =
        mTrips.reduce(
          (s, t) =>
            s +
            Number(t.fuelCost) +
            Number(t.tollFee) +
            Number(t.mealAllowance) +
            Number(t.otherExpenses) +
            Number(t.driverFee),
          0
        ) + Number(mExpenses._sum.amount ?? 0);
      monthly.push({ label: monthLabel(mStart), revenue: rev, expenses: exp });
    }

    // Expense breakdown for pie chart (period)
    const breakdown = new Map<string, number>();
    breakdown.set("Fuel", trips.reduce((s, t) => s + Number(t.fuelCost), 0));
    breakdown.set("Toll Fees", trips.reduce((s, t) => s + Number(t.tollFee), 0));
    breakdown.set(
      "Meal Allowance",
      trips.reduce((s, t) => s + Number(t.mealAllowance), 0)
    );
    breakdown.set("Driver Fees", trips.reduce((s, t) => s + Number(t.driverFee), 0));
    for (const e of expenses) {
      const label = e.category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      breakdown.set(label, (breakdown.get(label) ?? 0) + Number(e.amount));
    }
    const expenseBreakdown = Array.from(breakdown.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0);

    const stats: DashboardStats = {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      accountsReceivable,
      paymentsReceived,
      totalTrips: trips.length,
      activeDrivers,
      monthly,
      expenseBreakdown,
      topCreditors: creditors.slice(0, 5),
      recentTrips: trips.slice(0, 8).map((t) => ({
        id: t.id,
        tripCode: t.tripCode,
        date: t.date.toISOString(),
        driver: t.driver.name,
        customer: t.customer.company || t.customer.name,
        route: `${t.origin} → ${t.destination}`,
        amount: Number(t.tripRate),
        status: t.status,
      })),
    };

    return Response.json(stats);
  } catch (e) {
    return handleError(e);
  }
}
