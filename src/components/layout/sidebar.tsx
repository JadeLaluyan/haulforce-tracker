"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Banknote,
  Users,
  HardHat,
  Building2,
  Receipt,
  Calculator,
  Wallet,
  FileBarChart,
  X,
} from "lucide-react";
import { COMPANY } from "@/lib/config";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { href: "/trips", label: "Trips", icon: Truck },
      { href: "/payments", label: "Payments", icon: Banknote },
      { href: "/calculator", label: "Calculator", icon: Calculator },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/drivers", label: "Drivers", icon: Users },
      { href: "/helpers", label: "Helpers", icon: HardHat },
      { href: "/collectors", label: "Collectors", icon: Users },
      { href: "/customers", label: "Customers", icon: Building2 },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/payroll", label: "Payroll", icon: Wallet },
      { href: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
] as const;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
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
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-brand-bluedark text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Haulforce logo"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-md"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold uppercase tracking-wider">
                {COMPANY.name}
              </p>
              <p className="truncate text-[10px] text-blue-200">Advanced Tracker</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="rounded p-1 text-blue-200 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-blue-300/70">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={withPeriod(item.href)}
                      onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white",
                        active && "bg-brand-red text-white shadow"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-3 text-center text-[10px] text-blue-300/70">
          Haulforce Trucking
        </div>
      </aside>
    </>
  );
}
