"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { useTableState } from "@/hooks/use-table-state";
import { api, type Paginated } from "@/lib/api";
import { payrollGenerateSchema, type PayrollGenerateInput } from "@/lib/validation";
import { peso, formatDate } from "@/lib/format";
import type { DriverDTO, PayrollDTO } from "@/types";

const PAGE_SIZE = 10;

export function PayrollView() {
  const router = useRouter();
  const table = useTableState();
  const [rows, setRows] = useState<PayrollDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverDTO[]>([]);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<PayrollDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PayrollGenerateInput>({
    resolver: zodResolver(payrollGenerateSchema),
    defaultValues: { driverId: "", periodStart: "", periodEnd: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const d = await api<{ data: DriverDTO[] }>("/api/drivers?all=1");
        setDrivers(d.data);
      } catch {
        toast.error("Failed to load drivers");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(table.page));
      params.set("pageSize", String(PAGE_SIZE));
      if (table.debouncedSearch) params.set("search", table.debouncedSearch);
      const res = await api<Paginated<PayrollDTO>>(`/api/payroll?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load payroll invoices");
    } finally {
      setLoading(false);
    }
  }, [table.page, table.debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(values: PayrollGenerateInput) {
    setGenerating(true);
    try {
      const res = await api<{ data: PayrollDTO }>("/api/payroll", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(`Payroll invoice ${res.data.payrollNo} generated`);
      router.push(`/payroll/${res.data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/payroll/${deleting.id}`, { method: "DELETE" });
      toast.success("Payroll invoice deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete payroll invoice");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<PayrollDTO>[] = [
    {
      key: "payrollNo",
      header: "Invoice #",
      render: (p) => <span className="font-mono text-xs">{p.payrollNo}</span>,
    },
    { key: "driver", header: "Driver", render: (p) => p.driver.name },
    {
      key: "period",
      header: "Period",
      render: (p) => `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`,
    },
    { key: "totalTrips", header: "Trips", className: "text-right" },
    {
      key: "totalEarnings",
      header: "Total Earnings",
      className: "text-right",
      render: (p) => (
        <span className="font-semibold text-emerald-400">{peso(p.totalEarnings)}</span>
      ),
    },
    { key: "createdAt", header: "Generated", render: (p) => formatDate(p.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
            <Wallet className="h-4 w-4" />
            Generate Payroll Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Select Driver *</Label>
                <Select
                  value={watch("driverId")}
                  onValueChange={(v) => setValue("driverId", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.driverId && (
                  <p className="text-xs text-red-400">{errors.driverId.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="periodStart">Period Start *</Label>
                <Input id="periodStart" type="date" {...register("periodStart")} />
                {errors.periodStart && (
                  <p className="text-xs text-red-400">{errors.periodStart.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="periodEnd">Period End *</Label>
                <Input id="periodEnd" type="date" {...register("periodEnd")} />
                {errors.periodEnd && (
                  <p className="text-xs text-red-400">{errors.periodEnd.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={generating}>
              {generating ? <Loader2 className="animate-spin" /> : <FileText />}
              {generating ? "Generating..." : "Generate Payroll Invoice"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-red">
          Payroll History
        </h2>
        <DataTable
          columns={columns}
          data={rows}
          total={total}
          page={table.page}
          pageSize={PAGE_SIZE}
          search={table.search}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          loading={loading}
          emptyTitle="No payroll invoices yet"
          emptyDescription="Generate a payroll invoice using the form above."
          onSearchChange={table.setSearch}
          onPageChange={table.setPage}
          onSortChange={table.onSortChange}
          actions={[
            {
              label: "View Invoice",
              icon: <FileText />,
              onClick: (p) => router.push(`/payroll/${p.id}`),
            },
            {
              label: "Delete",
              icon: <Trash2 />,
              destructive: true,
              onClick: (p) => setDeleting(p),
            },
          ]}
        />
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.payrollNo}?</DialogTitle>
            <DialogDescription>
              This removes the payroll invoice record. Trips are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
