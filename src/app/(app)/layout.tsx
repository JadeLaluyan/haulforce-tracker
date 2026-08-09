import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { PeriodFilter } from "@/components/layout/period-filter";
import { TabNav } from "@/components/layout/tab-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="no-print">
        <AppHeader
          user={{ name: session.name, email: session.email, role: session.role }}
        />
        <Suspense>
          <PeriodFilter />
          <TabNav />
        </Suspense>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <footer className="no-print border-t py-4 text-center text-xs text-muted-foreground">
        Haulforce Trucking · Trucking Business Management System
      </footer>
    </div>
  );
}
