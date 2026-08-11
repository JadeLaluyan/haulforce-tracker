"use client";

import { Suspense, useState } from "react";
import { LogOut, Menu, Search, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { PeriodFilter } from "@/components/layout/period-filter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppShellProps {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/trips?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="flex min-h-screen">
      <div className="no-print">
        <Suspense>
          <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        </Suspense>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print sticky top-0 z-20 border-b bg-card">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <form onSubmit={onSearch} className="relative hidden flex-1 max-w-sm sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search trips..."
                className="h-9 pl-8"
              />
            </form>

            <div className="flex-1 sm:hidden" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-auto gap-2 normal-case">
                  <UserCircle2 className="h-6 w-6" />
                  <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Suspense>
            <PeriodFilter />
          </Suspense>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <footer className="no-print border-t py-4 text-center text-xs text-muted-foreground">
          Haulforce Trucking · Trucking Business Management System
        </footer>
      </div>
    </div>
  );
}
