import { prisma } from "@/lib/prisma";
import type { DateRange } from "@/lib/period";

export interface ReportSection {
  title: string;
  rows: { label: string; value: number; bold?: boolean; indent?: boolean }[];
}

export interface ReportTable {
  headers: string[];
  rows: (string | number)[][];
}

export interface ReportPayload {
  type: string;
  title: string;
  period: { from: string; to: string };
  sections?: ReportSection[];
  table?: ReportTable;
  totals?: { label: string; value: number }[];
}

async function loadPeriodData(range: DateRange) {
  const dateFilter = { gte: range.from, lte: range.to };
  const [trips, expenses, payments] = await Promise.all([
    prisma.trip.findMany({
      where: { date: dateFilter, status: { not: "CANCELLED" } },
      include: { driver: true, customer: true, invoice: true, payments: true },
      orderBy: { date: "asc" },
    }),
    prisma.expense.findMany({
      where: { date: dateFilter },
      include: { driver: true },
      orderBy: { date: "asc" },
    }),
    prisma.payment.findMany({
      where: { date: dateFilter },
      include: { customer: true },
      orderBy: { date: "asc" },
    }),
  ]);
  return { trips, expenses, payments };
}

const n = (v: unknown) => Number(v ?? 0);

export async function buildReport(type: string, range: DateRange): Promise<ReportPayload> {
  const { trips, expenses, payments } = await loadPeriodData(range);
  const period = { from: range.from.toISOString(), to: range.to.toISOString() };

  const freightRevenue = trips.reduce((s, t) => s + n(t.tripRate), 0);
  const paymentsReceived = payments.reduce((s, p) => s + n(p.amount), 0);
  const fuel = trips.reduce((s, t) => s + n(t.fuelCost), 0);
  const toll = trips.reduce((s, t) => s + n(t.tollFee), 0);
  const meals = trips.reduce((s, t) => s + n(t.mealAllowance), 0);
  const driverFees = trips.reduce((s, t) => s + n(t.driverFee), 0);
  const otherTrip = trips.reduce((s, t) => s + n(t.otherExpenses), 0);
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + n(e.amount));
  }
  const generalTotal = expenses.reduce((s, e) => s + n(e.amount), 0);
  const tripCostTotal = fuel + toll + meals + driverFees + otherTrip;
  const totalExpenses = tripCostTotal + generalTotal;

  const catLabel = (c: string) =>
    c.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

  switch (type) {
    case "income-statement":
      return {
        type,
        title: "INCOME STATEMENT",
        period,
        sections: [
          {
            title: "REVENUE",
            rows: [
              { label: "Freight Services", value: freightRevenue, indent: true },
              { label: "Payments Received", value: paymentsReceived, indent: true },
              { label: "Total Revenue", value: freightRevenue, bold: true },
            ],
          },
          {
            title: "COST OF SERVICES",
            rows: [
              { label: "Fuel", value: fuel, indent: true },
              { label: "Toll Fees", value: toll, indent: true },
              { label: "Meal Allowances", value: meals, indent: true },
              { label: "Driver Fees", value: driverFees, indent: true },
              { label: "Other Trip Expenses", value: otherTrip, indent: true },
              { label: "Total Cost of Services", value: tripCostTotal, bold: true },
            ],
          },
          {
            title: "OPERATING EXPENSES",
            rows: [
              ...Array.from(byCategory.entries()).map(([c, v]) => ({
                label: catLabel(c),
                value: v,
                indent: true,
              })),
              { label: "Total Operating Expenses", value: generalTotal, bold: true },
            ],
          },
        ],
        totals: [
          { label: "TOTAL EXPENSES", value: totalExpenses },
          { label: "NET INCOME", value: freightRevenue - totalExpenses },
        ],
      };

    case "profit-loss":
      return {
        type,
        title: "PROFIT AND LOSS STATEMENT",
        period,
        sections: [
          {
            title: "INCOME",
            rows: [
              { label: "Gross Freight Revenue", value: freightRevenue, indent: true },
              { label: "VAT Collected (12%)", value: freightRevenue * 0.12, indent: true },
              { label: "Gross Income", value: freightRevenue * 1.12, bold: true },
            ],
          },
          {
            title: "EXPENSES",
            rows: [
              { label: "Trip Costs (fuel, toll, meals, fees)", value: tripCostTotal, indent: true },
              { label: "Operating Expenses", value: generalTotal, indent: true },
              { label: "Total Expenses", value: totalExpenses, bold: true },
            ],
          },
        ],
        totals: [
          { label: "NET PROFIT (before VAT remittance)", value: freightRevenue * 1.12 - totalExpenses },
          { label: "NET PROFIT (net of VAT)", value: freightRevenue - totalExpenses },
        ],
      };

    case "trip-summary":
      return {
        type,
        title: "TRIP SUMMARY REPORT",
        period,
        table: {
          headers: ["Trip ID", "Date", "Driver", "Customer", "Route", "Cargo", "Rate", "Costs", "Profit"],
          rows: trips.map((t) => {
            const costs = n(t.fuelCost) + n(t.tollFee) + n(t.mealAllowance) + n(t.otherExpenses) + n(t.driverFee);
            return [
              t.tripCode,
              t.date.toISOString().slice(0, 10),
              t.driver.name,
              t.customer.company || t.customer.name,
              `${t.origin} - ${t.destination}`,
              t.cargoType,
              n(t.tripRate),
              costs,
              n(t.tripRate) - costs,
            ];
          }),
        },
        totals: [
          { label: "Total Trips", value: trips.length },
          { label: "Total Revenue", value: freightRevenue },
          { label: "Total Trip Costs", value: tripCostTotal },
          { label: "Total Profit", value: freightRevenue - tripCostTotal },
        ],
      };

    case "expense-report":
      return {
        type,
        title: "EXPENSE REPORT",
        period,
        table: {
          headers: ["Date", "Category", "Description", "Driver", "Amount"],
          rows: expenses.map((e) => [
            e.date.toISOString().slice(0, 10),
            catLabel(e.category),
            e.description,
            e.driver?.name ?? "-",
            n(e.amount),
          ]),
        },
        totals: [{ label: "Total Operating Expenses", value: generalTotal }],
      };

    case "customer-report": {
      const byCustomer = new Map<string, { name: string; trips: number; billed: number; paid: number }>();
      for (const t of trips) {
        const key = t.customerId;
        const entry = byCustomer.get(key) ?? {
          name: t.customer.company || t.customer.name,
          trips: 0,
          billed: 0,
          paid: 0,
        };
        entry.trips += 1;
        entry.billed += n(t.invoice?.total ?? n(t.tripRate) * 1.12);
        entry.paid += t.payments.reduce((s, p) => s + n(p.amount), 0);
        byCustomer.set(key, entry);
      }
      const rows = Array.from(byCustomer.values()).sort((a, b) => b.billed - a.billed);
      return {
        type,
        title: "CUSTOMER REPORT",
        period,
        table: {
          headers: ["Customer", "Trips", "Billed (VAT incl.)", "Paid", "Balance"],
          rows: rows.map((r) => [r.name, r.trips, r.billed, r.paid, r.billed - r.paid]),
        },
        totals: [
          { label: "Total Billed", value: rows.reduce((s, r) => s + r.billed, 0) },
          { label: "Total Collected", value: rows.reduce((s, r) => s + r.paid, 0) },
        ],
      };
    }

    case "driver-report": {
      const byDriver = new Map<string, { name: string; trips: number; revenue: number; earnings: number }>();
      for (const t of trips) {
        const key = t.driverId;
        const entry = byDriver.get(key) ?? { name: t.driver.name, trips: 0, revenue: 0, earnings: 0 };
        entry.trips += 1;
        entry.revenue += n(t.tripRate);
        entry.earnings += n(t.driverFee) + n(t.mealAllowance);
        byDriver.set(key, entry);
      }
      const rows = Array.from(byDriver.values()).sort((a, b) => b.revenue - a.revenue);
      return {
        type,
        title: "DRIVERS REPORT",
        period,
        table: {
          headers: ["Driver", "Trips", "Revenue Generated", "Driver Earnings"],
          rows: rows.map((r) => [r.name, r.trips, r.revenue, r.earnings]),
        },
        totals: [
          { label: "Total Revenue", value: rows.reduce((s, r) => s + r.revenue, 0) },
          { label: "Total Driver Earnings", value: rows.reduce((s, r) => s + r.earnings, 0) },
        ],
      };
    }

    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

export function reportToCsv(report: ReportPayload): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const lines: string[] = [];
  lines.push(esc(report.title));
  lines.push(
    `Period:,${report.period.from.slice(0, 10)},to,${report.period.to.slice(0, 10)}`
  );
  lines.push("");
  if (report.sections) {
    for (const s of report.sections) {
      lines.push(esc(s.title));
      for (const r of s.rows) lines.push(`${esc(r.label)},${r.value.toFixed(2)}`);
      lines.push("");
    }
  }
  if (report.table) {
    lines.push(report.table.headers.map(esc).join(","));
    for (const row of report.table.rows) lines.push(row.map(esc).join(","));
    lines.push("");
  }
  if (report.totals) {
    for (const t of report.totals) lines.push(`${esc(t.label)},${t.value.toFixed(2)}`);
  }
  return lines.join("\n");
}
