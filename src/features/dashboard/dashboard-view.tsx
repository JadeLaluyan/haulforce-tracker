"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Banknote,
  PlusCircle,
  Receipt,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/hooks/use-period";
import { api } from "@/lib/api";
import { peso, pesoWhole, formatDate } from "@/lib/format";
import type { DashboardStats } from "@/types";

const PIE_COLORS = ["#c0392b", "#1e5fa8", "#2980b9", "#e74c3c", "#16a085", "#f39c12", "#8e44ad"];

const CARD_STYLES = [
  "from-red-700 to-red-600",
  "from-blue-800 to-blue-600",
  "from-teal-700 to-teal-600",
  "from-indigo-800 to-indigo-600",
  "from-emerald-700 to-emerald-600",
  "from-cyan-800 to-cyan-600",
];

function StatCard({
  title,
  value,
  sub,
  icon,
  gradient,
  index,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`rounded-lg bg-gradient-to-br ${gradient} p-4 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">{title}</p>
        {icon}
      </div>
      <p className="mt-1 truncate text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/70">{sub}</p>
    </motion.div>
  );
}

export function DashboardView() {
  const { queryString } = usePeriod();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<DashboardStats>(`/api/dashboard?${queryString}`);
      setStats(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: pesoWhole(stats.totalRevenue),
      sub: "Trip income for period",
      icon: <TrendingUp className="h-4 w-4 text-white/70" />,
    },
    {
      title: "Total Expenses",
      value: pesoWhole(stats.totalExpenses),
      sub: "Operational costs",
      icon: <TrendingDown className="h-4 w-4 text-white/70" />,
    },
    {
      title: "Net Profit",
      value: pesoWhole(stats.netProfit),
      sub: "Revenue less expenses",
      icon: <Wallet className="h-4 w-4 text-white/70" />,
    },
    {
      title: "Accounts Receivable",
      value: pesoWhole(stats.accountsReceivable),
      sub: "Outstanding balances",
      icon: <AlertTriangle className="h-4 w-4 text-white/70" />,
    },
    {
      title: "Payments Received",
      value: pesoWhole(stats.paymentsReceived),
      sub: "Collections for period",
      icon: <Banknote className="h-4 w-4 text-white/70" />,
    },
    {
      title: "Total Trips",
      value: String(stats.totalTrips),
      sub: `${stats.activeDrivers} active drivers`,
      icon: <Truck className="h-4 w-4 text-white/70" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((c, i) => (
          <StatCard key={c.title} {...c} gradient={CARD_STYLES[i]} index={i} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="destructive" size="sm">
          <Link href="/trips">
            <PlusCircle /> Add New Trip
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/payments">
            <Banknote /> Record Payment
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/expenses">
            <Receipt /> Add Expense
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/drivers">
            <Users /> Manage Drivers
          </Link>
        </Button>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-brand-red">
              Revenue &amp; Expenses (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334" />
                <XAxis dataKey="label" stroke="#8899aa" fontSize={12} />
                <YAxis stroke="#8899aa" fontSize={11} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => peso(Number(v))}
                  contentStyle={{ background: "#1b2130", border: "1px solid #334", borderRadius: 8 }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#1e5fa8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#c0392b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-brand-red">
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {stats.expenseBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No expenses recorded for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.expenseBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {stats.expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => peso(Number(v))}
                    contentStyle={{ background: "#1b2130", border: "1px solid #334", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend + creditors */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-brand-red">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334" />
                <XAxis dataKey="label" stroke="#8899aa" fontSize={12} />
                <YAxis stroke="#8899aa" fontSize={11} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => peso(Number(v))}
                  contentStyle={{ background: "#1b2130", border: "1px solid #334", borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#e74c3c" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#2980b9" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Top Creditors (Outstanding Balance)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCreditors.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No outstanding balances. All caught up!
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {stats.topCreditors.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Billed: {peso(c.billed)} · Paid: {peso(c.paid)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-amber-400">{peso(c.outstanding)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest trips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-brand-red">
            Latest Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTrips.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No trips recorded for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Trip ID</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Driver</th>
                    <th className="px-2 py-2">Customer</th>
                    <th className="px-2 py-2">Route</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTrips.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="px-2 py-2 font-mono text-xs">{t.tripCode}</td>
                      <td className="px-2 py-2">{formatDate(t.date)}</td>
                      <td className="px-2 py-2">{t.driver}</td>
                      <td className="px-2 py-2">{t.customer}</td>
                      <td className="px-2 py-2">{t.route}</td>
                      <td className="px-2 py-2 text-right font-semibold">{peso(t.amount)}</td>
                      <td className="px-2 py-2">
                        <Badge
                          variant={
                            t.status === "COMPLETED"
                              ? "success"
                              : t.status === "IN_TRANSIT"
                                ? "default"
                                : "warning"
                          }
                        >
                          {t.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
