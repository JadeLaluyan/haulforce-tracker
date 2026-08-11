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
import { Badge } from "@/components/ui/badge";
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
import type { DriverDTO, HelperDTO, PayrollDTO } from "@/types";

const PAGE_SIZE = 10;

export function PayrollView() {
  const router = useRouter();
  const table = useTableState();
  const [rows, setRows] = useState<PayrollDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverDTO[]>([]);
  const [helpers, setHelpers] = useState<HelperDTO[]>([]);
  const [payeeType, setPayeeType] = useState<"driver" | "helper">("driver");
  const [outstanding, setOutstanding] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<PayrollDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PayrollGenerateInput>({
    resolver: zodResolver(payrollGenerateSchema),
    defaultValues: { driverId: "", helperId: "", periodStart: "", periodEnd: "", deductAmount: 0 },
  });

  const driverId = watch("driverId");
  const helperId = watch("helperId");
  const payeeId = payeeType === "driver" ? driverId : helperId;

  useEffect(() => {
    (async () => {
      try {
        const [d, h] = await Promise.all([
          api<{ data: DriverDTO[] }>("/api/drivers?all=1"),
          api<{ data: HelperDTO[] }>("/api/helpers?all=1"),
        ]);
        setDrivers(d.data);
        setHelpers(h.data);
      } catch {
        toast.error("Failed to load drivers/helpers");
      }
    })();
  }, []);

  // Load outstanding cash advance balance for the selected payee so the
  // deduction field can be capped and pre-filled sensibly.
  useEffect(() => {
    if (!payeeId) {
      setOutstanding(0);
      return;
    }
    (async () => {
      try {
        const param = payeeType === "driver" ? "driverId" : "helperId";
        const res = await api<{ outstanding: number }>(`/api/cash-advances?${param}=${payeeId}`);
        setOutstanding(res.outstanding);
      } catch {
        setOutstanding(0);
      }
    })();
  }, [payeeId, payeeType]);

  function onPayeeTypeChange(next: "driver" | "helper") {
    setPayeeType(next);
    setValue("driverId", "");
    setValue("helperId", "");
    setValue("deductAmount", 0);
  }

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
      reset({ driverId: "", helperId: "", periodStart: "", periodEnd: "", deductAmount: 0 });
      setOutstanding(0);
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
    {
      key: "payee",
      header: "Paid To",
      render: (p) => (
        <span>
          {p.driver?.name ?? p.helper?.name}{" "}
          {p.helper && <Badge variant="secondary" className="ml-1">Helper</Badge>}
        </span>
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (p) => `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`,
    },
    { key: "totalTrips", header: "Trips", className: "text-right" },
    {
      key: "advanceDeduction",
      header: "Advance Deducted",
      className: "text-right",
      render: (p) =>
        Number(p.advanceDeduction) > 0 ? (
          <span className="text-amber-400">-{peso(p.advanceDeduction)}</span>
        ) : (
          <span className="text-muted-foreground">{peso(0)}</span>
        ),
    },
    {
      key: "netPay",
      header: "Net Pay",
      className: "text-right",
      render: (p) => <span className="font-semibold text-emerald-400">{peso(p.netPay)}</span>,
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
                <Label>Payee Type</Label>
                <Select value={payeeType} onValueChange={(v) => onPayeeTypeChange(v as "driver" | "helper")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="helper">Helper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Select {payeeType === "driver" ? "Driver" : "Helper"} *</Label>
                <Select
                  value={payeeId}
                  onValueChange={(v) =>
                    setValue(payeeType === "driver" ? "driverId" : "helperId", v, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${payeeType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(payeeType === "driver" ? drivers : helpers).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
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
              <div className="space-y-1.5">
                <Label htmlFor="deductAmount">Deduct Cash Advance (₱)</Label>
                <Input
                  id="deductAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={outstanding}
                  {...register("deductAmount")}
                />
                <p className="text-xs text-muted-foreground">
                  Outstanding balance: <span className="font-semibold text-amber-400">{peso(outstanding)}</span>
                </p>
                {errors.deductAmount && (
                  <p className="text-xs text-red-400">{errors.deductAmount.message}</p>
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
