/**
 * Seed script — realistic Philippine trucking sample data.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VAT = 0.12;

function d(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8, 0, 0, 0);
  return date;
}

async function main() {
  console.log("Seeding database...");

  // Clean slate (order matters for FKs)
  await prisma.payment.deleteMany();
  await prisma.payrollInvoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      email: "admin@haulforce.ph",
      passwordHash,
      name: "Clarence",
      role: "MANAGER",
    },
  });

  // Drivers
  const [rey, marlon, jun] = await Promise.all(
    [
      { name: "Rey Santos", licenseNo: "N01-23-456789", contact: "0917 111 2233", address: "Bulacan" },
      { name: "Marlon Dela Cruz", licenseNo: "N02-34-567890", contact: "0918 222 3344", address: "Quezon City" },
      { name: "Jun Villanueva", licenseNo: "N03-45-678901", contact: "0919 333 4455", address: "Cavite" },
      { name: "Dante Ramos", licenseNo: "N04-56-789012", contact: "0920 444 5566", address: "Laguna", active: false },
    ].map((data) => prisma.driver.create({ data }))
  );

  // Customers
  const [ana, urc, sanmig, reynah, longalo] = await Promise.all(
    [
      { name: "Ana Reyes", company: "URC Distribution", address: "Bulacan", contact: "0917 555 1111", tin: "201-334-556-000", terms: "COD", email: "ana.reyes@urc.ph" },
      { name: "Carlos Tan", company: "MetroGro Foods", address: "Valenzuela", contact: "0917 555 2222", tin: "202-445-667-000", terms: "15 days", email: "carlos@metrogro.ph" },
      { name: "Liza Uy", company: "San Miguel Logistics", address: "Pasig", contact: "0917 555 3333", tin: "203-556-778-000", terms: "30 days", email: "liza.uy@sml.ph" },
      { name: "Reynah Bautista", company: "Reynah Hardware", address: "Cabanatuan", contact: "0917 555 4444", tin: "204-667-889-000", terms: "COD" },
      { name: "Reynalin Dona Longalo", company: null, address: "Tarlac", contact: "0917 555 5555", tin: null, terms: "7 days" },
    ].map((data) => prisma.customer.create({ data }))
  );

  // Trips (+ invoices)
  const tripSeeds = [
    { daysAgo: 2, driver: rey, customer: ana, origin: "Bulacan", destination: "Cebu (RORO)", cargo: "Consumer Goods", weight: 12000, rate: 72000, fuel: 18500, toll: 3200, meal: 1500, other: 2500, fee: 6000, status: "COMPLETED", paid: 0 },
    { daysAgo: 4, driver: marlon, customer: urc, origin: "Valenzuela", destination: "Batangas", cargo: "Beverages", weight: 8000, rate: 24000, fuel: 5200, toll: 1100, meal: 500, other: 0, fee: 2500, status: "COMPLETED", paid: 26880 },
    { daysAgo: 6, driver: jun, customer: sanmig, origin: "Pasig", destination: "Pampanga", cargo: "General Cargo", weight: 6500, rate: 18000, fuel: 4100, toll: 950, meal: 500, other: 300, fee: 2000, status: "COMPLETED", paid: 10000 },
    { daysAgo: 9, driver: rey, customer: reynah, origin: "Manila", destination: "Cabanatuan", cargo: "Construction Materials", weight: 15000, rate: 35000, fuel: 8800, toll: 1800, meal: 500, other: 1000, fee: 3500, status: "COMPLETED", paid: 0 },
    { daysAgo: 12, driver: marlon, customer: longalo, origin: "Manila", destination: "Tarlac", cargo: "Agricultural Products", weight: 9000, rate: 26000, fuel: 6200, toll: 1400, meal: 500, other: 0, fee: 2800, status: "COMPLETED", paid: 0 },
    { daysAgo: 15, driver: jun, customer: ana, origin: "Bulacan", destination: "Baguio", cargo: "Consumer Goods", weight: 7000, rate: 30000, fuel: 7500, toll: 1600, meal: 800, other: 500, fee: 3000, status: "COMPLETED", paid: 33600 },
    { daysAgo: 18, driver: rey, customer: sanmig, origin: "Pasig", destination: "Naga", cargo: "Beverages", weight: 10000, rate: 42000, fuel: 11800, toll: 2400, meal: 1000, other: 800, fee: 4200, status: "COMPLETED", paid: 20000 },
    { daysAgo: 22, driver: marlon, customer: urc, origin: "Valenzuela", destination: "Dagupan", cargo: "Consumer Goods", weight: 8500, rate: 28000, fuel: 6900, toll: 1500, meal: 500, other: 0, fee: 2900, status: "COMPLETED", paid: 31360 },
    { daysAgo: 26, driver: jun, customer: reynah, origin: "Manila", destination: "Cabanatuan", cargo: "Construction Materials", weight: 14000, rate: 34000, fuel: 8600, toll: 1800, meal: 500, other: 700, fee: 3400, status: "COMPLETED", paid: 0 },
    { daysAgo: 1, driver: rey, customer: urc, origin: "Valenzuela", destination: "Silang - Leyte", cargo: "General Cargo", weight: 11000, rate: 18000, fuel: 5000, toll: 1000, meal: 500, other: 4000, fee: 3500, status: "IN_TRANSIT", paid: 0 },
    { daysAgo: 0, driver: marlon, customer: sanmig, origin: "Pasig", destination: "Ilocos", cargo: "Frozen Goods", weight: 5000, rate: 38000, fuel: 0, toll: 0, meal: 0, other: 0, fee: 3800, status: "PENDING", paid: 0 },
    { daysAgo: 40, driver: rey, customer: ana, origin: "Bulacan", destination: "Davao (RORO)", cargo: "Consumer Goods", weight: 13000, rate: 95000, fuel: 26500, toll: 4100, meal: 2000, other: 3000, fee: 8000, status: "COMPLETED", paid: 106400 },
    { daysAgo: 45, driver: jun, customer: urc, origin: "Valenzuela", destination: "Cagayan", cargo: "Consumer Goods", weight: 9500, rate: 46000, fuel: 12800, toll: 2300, meal: 1200, other: 900, fee: 4600, status: "COMPLETED", paid: 51520 },
    { daysAgo: 52, driver: marlon, customer: sanmig, origin: "Pasig", destination: "Bicol", cargo: "Beverages", weight: 10500, rate: 44000, fuel: 12100, toll: 2500, meal: 1200, other: 600, fee: 4400, status: "COMPLETED", paid: 49280 },
    { daysAgo: 70, driver: rey, customer: reynah, origin: "Manila", destination: "Cabanatuan", cargo: "Construction Materials", weight: 15000, rate: 35000, fuel: 8700, toll: 1800, meal: 500, other: 900, fee: 3500, status: "COMPLETED", paid: 39200 },
    { daysAgo: 100, driver: jun, customer: longalo, origin: "Manila", destination: "Tarlac", cargo: "Agricultural Products", weight: 8800, rate: 25000, fuel: 6000, toll: 1400, meal: 500, other: 0, fee: 2700, status: "COMPLETED", paid: 0 },
  ] as const;

  let tripNo = 0;
  let invNo = 0;
  for (const t of tripSeeds) {
    tripNo += 1;
    invNo += 1;
    const subtotal = t.rate;
    const vatAmount = subtotal * VAT;
    const total = subtotal + vatAmount;
    const paid = t.paid;
    const paymentStatus = paid <= 0 ? "UNPAID" : paid + 0.005 >= total ? "PAID" : "PARTIAL";

    const trip = await prisma.trip.create({
      data: {
        tripCode: `TRP-${String(tripNo).padStart(4, "0")}`,
        date: d(t.daysAgo),
        driverId: t.driver.id,
        customerId: t.customer.id,
        origin: t.origin,
        destination: t.destination,
        cargoType: t.cargo,
        weightKg: t.weight,
        tripRate: t.rate,
        fuelCost: t.fuel,
        tollFee: t.toll,
        mealAllowance: t.meal,
        otherExpenses: t.other,
        driverFee: t.fee,
        status: t.status,
        paymentStatus,
        notes: paymentStatus === "UNPAID" ? "unpaid" : null,
        invoice: {
          create: {
            invoiceNo: `INV-${new Date().getFullYear()}-${String(invNo).padStart(4, "0")}`,
            invoiceDate: d(t.daysAgo),
            paymentTerms: t.customer.terms,
            vatRate: 12,
            subtotal,
            vatAmount,
            total,
          },
        },
      },
      include: { invoice: true },
    });

    if (paid > 0) {
      await prisma.payment.create({
        data: {
          date: d(Math.max(0, t.daysAgo - 3)),
          customerId: t.customer.id,
          tripId: trip.id,
          invoiceId: trip.invoice!.id,
          amount: paid,
          method: paid > 40000 ? "BANK_TRANSFER" : "CASH",
          refNo: paid > 40000 ? `BT-${String(tripNo).padStart(5, "0")}` : null,
        },
      });
    }
  }

  // General expenses
  const expenseSeeds = [
    { daysAgo: 3, category: "MAINTENANCE", description: "Change oil + filters - Truck 1", amount: 4500, driver: rey },
    { daysAgo: 5, category: "MAINTENANCE", description: "Brake pads replacement - Truck 2", amount: 6800, driver: marlon },
    { daysAgo: 8, category: "PERMITS_LICENSES", description: "LTFRB franchise renewal fees", amount: 5200, driver: null },
    { daysAgo: 10, category: "OFFICE", description: "Internet + mobile load", amount: 2100, driver: null },
    { daysAgo: 14, category: "SALARY", description: "Helper weekly wage", amount: 4000, driver: null },
    { daysAgo: 20, category: "FUEL", description: "Fuel top-up (yard genset)", amount: 1800, driver: null },
    { daysAgo: 28, category: "MAINTENANCE", description: "Tire replacement x2 - Truck 1", amount: 19000, driver: rey },
    { daysAgo: 42, category: "PERMITS_LICENSES", description: "LTO registration - Truck 2", amount: 8400, driver: null },
    { daysAgo: 55, category: "OTHER", description: "Parking and yard rental", amount: 6000, driver: null },
  ] as const;

  for (const e of expenseSeeds) {
    await prisma.expense.create({
      data: {
        date: d(e.daysAgo),
        category: e.category,
        description: e.description,
        amount: e.amount,
        driverId: e.driver?.id ?? null,
      },
    });
  }

  // One sample payroll invoice
  const payrollTrips = await prisma.trip.findMany({
    where: { driverId: rey.id, date: { gte: d(30) }, status: { not: "CANCELLED" } },
  });
  const payrollEarnings = payrollTrips.reduce(
    (s, t) => s + Number(t.driverFee) + Number(t.mealAllowance),
    0
  );
  await prisma.payrollInvoice.create({
    data: {
      payrollNo: `PAY-${new Date().getFullYear()}-0001`,
      driverId: rey.id,
      periodStart: d(30),
      periodEnd: d(0),
      totalTrips: payrollTrips.length,
      totalEarnings: payrollEarnings,
      advanceDeduction: 0,
      netPay: payrollEarnings,
    },
  });

  const counts = {
    users: await prisma.user.count(),
    drivers: await prisma.driver.count(),
    customers: await prisma.customer.count(),
    trips: await prisma.trip.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    expenses: await prisma.expense.count(),
    payroll: await prisma.payrollInvoice.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
