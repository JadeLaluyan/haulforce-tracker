"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Banknote,
  Users,
  Building2,
  Receipt,
  Calculator,
  Wallet,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Truck },
  { href: "/payments", label: "Payments", icon: Banknote },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/payroll", label: "Payroll", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileBarChart },
] as const;

export function TabNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  function withPeriod(href: string) {
    const params = new URLSearchParams();
    if (period) params.set("period", period);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return qs ? `${href}?${qs}` : href;
  }

  return (
    <nav className="sticky top-0 z-40 bg-brand-red shadow-md">
      <div className="mx-auto max-w-7xl overflow-x-auto px-2">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={withPeriod(tab.href)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:px-4",
                  active && "bg-brand-reddark text-white shadow-inner"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
