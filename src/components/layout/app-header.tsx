"use client";

import { LogOut, UserCircle2, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { COMPANY } from "@/lib/config";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  user: { name: string; email: string; role: string };
}

export function AppHeader({ user }: AppHeaderProps) {
  const router = useRouter();
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
    <div className="bg-gradient-to-r from-brand-bluedark via-brand-blue to-brand-bluedark text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/logo.png" alt="Haulforce logo" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold uppercase tracking-wider sm:text-xl">
              {COMPANY.appName}
            </h1>
            <p className="hidden truncate text-xs text-blue-100 sm:block">{COMPANY.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={onSearch} className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-200" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search trips..."
              className="h-9 w-56 border-white/20 bg-white/10 pl-8 text-white placeholder:text-blue-200 focus-visible:ring-white/50"
            />
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-white hover:bg-white/10 hover:text-white normal-case">
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
      </div>
    </div>
  );
}
