# Haulforce Advanced Tracker

Trucking Business Management System — Enhanced Edition with BIR Invoicing.
A full-stack recreation of the reference logistics tracker, branded for
Haulforce Trucking.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn/ui-style
components · Lucide icons · React Hook Form + Zod · Prisma ORM (driver-adapter
mode, no Rust engine) · PostgreSQL · Framer Motion · Recharts · Sonner toasts.

## Modules

Dashboard (stat cards, revenue/expense charts, expense pie, trend line, top
creditors, latest trips, quick actions) · Trips with auto-generated BIR-compliant
invoices (12% VAT, print / save-as-PDF) · Payments (auto-recalculates trip payment
status) · Drivers · Customers (outstanding balances) · Expenses (category filter +
period totals) · Trip Pricing Calculator · Payroll invoice generator (per-driver
period earnings, printable) · Reports (Income Statement, P&L, Trip Summary,
Expense, Customer, Drivers — print, PDF via print dialog, Excel/CSV download).

Global period filter (Today / Yesterday / Last 7 Days / This Month / This Year /
Custom Range) applies across Dashboard, Trips, Payments, Expenses, and Reports.

## Setup

### Windows desktop app flow (recommended)

This project includes an offline desktop installer that starts its own embedded PostgreSQL database and launches the app in production mode.

1. Open PowerShell in the project folder.
2. Run the installer:

   .\install.bat

3. After setup completes, start the app:

   & ".\Start Haulforce.bat"

4. The app will create its embedded database, apply migrations, and create the default admin account automatically.

   Login with the demo account: **admin@haulforce.ph / admin123**

### Manual development flow

Use this only if you want to run the app directly from the codebase with a PostgreSQL server already available.

1.  Requirements: Node 20+, PostgreSQL 14+.

2.  Install dependencies:

    npm install

3.  Configure environment — copy `.env.example` to `.env` and set:

    DATABASE_URL="postgresql://user:pass@localhost:5432/haulforce?schema=public"
    AUTH_SECRET="a-long-random-string"

4.  Create the database schema (either works):

    npx prisma migrate deploy # applies prisma/migrations

    # or: npx prisma db push

5.  Generate the client and seed sample data:

    npx prisma generate
    npm run db:seed

6.  Run:

        npm run dev

    Login with the demo account: **admin@haulforce.ph / admin123**

### Important note

If you run the project without the embedded installer, the app will fail with a Prisma database error until a valid `DATABASE_URL` points to a real PostgreSQL database and that database has already been created.

## Notes

- The Prisma client runs in `engineType = "client"` mode with the `pg` driver
  adapter (`src/lib/prisma.ts`) — no Rust query-engine binary is needed at
  runtime, which also works on serverless hosts.
- Auth is a signed JWT session cookie (jose, HS256). `src/middleware.ts` guards
  every page and API route except `/login`; the `(app)` layout re-checks
  server-side as defense in depth.
- Invoices and reports print via the browser print dialog — choose "Save as PDF"
  to download. Excel export is CSV (opens directly in Excel).
- Company branding (name, TIN, address, VAT rate) lives in `src/lib/config.ts`.

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` — ESLint (flat config)
- `npm run typecheck` — strict TypeScript, no emit
- `npm run db:seed` — reseed sample data (destructive)
