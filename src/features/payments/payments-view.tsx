"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Loader2, Pencil, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { useTableState } from "@/hooks/use-table-state";
import { usePeriod } from "@/hooks/use-period";
import { api, type Paginated } from "@/lib/api";
import { paymentSchema, type PaymentInput } from "@/lib/validation";
import { peso, formatDate, toDateInput } from "@/lib/format";
import type { CustomerDTO, PaymentDTO, TripDTO } from "@/types";

const PAGE_SIZE = 10;

const METHOD_LABELS: Record<PaymentDTO["method"], string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  GCASH: "GCash",
  CHECK: "Check",
};

export function PaymentsView() {
  const { queryString } = usePeriod();
  const table = useTableState("date");
  const [rows, setRows] = useState<PaymentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [trips, setTrips] = useState<TripDTO[]>([]);
  const [editing, setEditing] = useState<PaymentDTO | null>(null);
  const [deleting, setDeleting] = useState<PaymentDTO | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: toDateInput(new Date()),
      customerId: "",
      tripId: "",
      amount: 0,
      method: "CASH",
      refNo: "",
      notes: "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([
          api<{ data: CustomerDTO[] }>("/api/customers?all=1"),
          api<Paginated<TripDTO>>("/api/trips?page=1&pageSize=100"),
        ]);
        setCustomers(c.data);
        setTrips(t.data);
      } catch {
        toast.error("Failed to load reference data");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(queryString);
      params.set("page", String(table.page));
      params.set("pageSize", String(PAGE_SIZE));
      if (table.debouncedSearch) params.set("search", table.debouncedSearch);
      if (table.sortKey) {
        params.set("sortKey", table.sortKey);
        params.set("sortDir", table.sortDir);
      }
      const res = await api<Paginated<PaymentDTO>>(`/api/payments?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [queryString, table.page, table.debouncedSearch, table.sortKey, table.sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (editing) {
      reset({
        date: editing.date.slice(0, 10),
        customerId: editing.customerId,
        tripId: editing.tripId ?? "",
        amount: Number(editing.amount),
        method: editing.method,
        refNo: editing.refNo ?? "",
        notes: editing.notes ?? "",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editing, reset]);

  async function onSubmit(values: PaymentInput) {
    setSaveLoading(true);
    try {
      if (editing) {
        await api(`/api/payments/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Payment updated");
      } else {
        await api("/api/payments", { method: "POST", body: JSON.stringify(values) });
        toast.success("Payment recorded");
      }
      setEditing(null);
      reset({
        date: toDateInput(new Date()),
        customerId: "",
        tripId: "",
        amount: 0,
        method: "CASH",
        refNo: "",
        notes: "",
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save payment");
    } finally {
      setSaveLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/payments/${deleting.id}`, { method: "DELETE" });
      toast.success("Payment deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete payment");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<PaymentDTO>[] = [
    { key: "date", header: "Date", sortable: true, render: (p) => formatDate(p.date) },
    {
      key: "customer",
      header: "Customer",
      render: (p) => p.customer.name,
    },
    {
      key: "trip",
      header: "Trip",
      render: (p) =>
        p.trip ? <span className="font-mono text-xs">{p.trip.tripCode}</span> : "-",
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      className: "text-right",
      render: (p) => <span className="font-semibold text-emerald-400">{peso(p.amount)}</span>,
    },
    {
      key: "method",
      header: "Method",
      sortable: true,
      render: (p) => <Badge variant="secondary">{METHOD_LABELS[p.method]}</Badge>,
    },
    { key: "refNo", header: "Ref #", render: (p) => p.refNo ?? "-" },
  ];

  const customerId = watch("customerId");
  const tripId = watch("tripId");
  const method = watch("method");
  const customerTrips = trips.filter((t) => !customerId || t.customerId === customerId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
            <Banknote className="h-4 w-4" />
            {editing ? "Edit Payment" : "Record Payment"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pdate">Date *</Label>
                <Input id="pdate" type="date" {...register("date")} />
                {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Customer *</Label>
                <Select
                  value={customerId}
                  onValueChange={(v) => setValue("customerId", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company ? `${c.name} (${c.company})` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-xs text-red-400">{errors.customerId.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Apply to Trip (optional)</Label>
                <Select
                  value={tripId || "none"}
                  onValueChange={(v) => setValue("tripId", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {customerTrips.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.tripCode} · {t.origin}→{t.destination} ({peso(t.tripRate)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (₱) *</Label>
                <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
                {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select
                  value={method}
                  onValueChange={(v) =>
                    setValue("method", v as PaymentInput["method"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METHOD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="refNo">Reference #</Label>
                <Input id="refNo" placeholder="OR / bank ref" {...register("refNo")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pnotes">Notes</Label>
              <Textarea id="pnotes" rows={2} {...register("notes")} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={saveLoading}>
                {saveLoading ? <Loader2 className="animate-spin" /> : <Save />}
                {saveLoading ? "Saving..." : editing ? "Update Payment" : "Save Payment"}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-red">
          Payment History
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
          emptyTitle="No payments found"
          emptyDescription="Record your first payment using the form above."
          onSearchChange={table.setSearch}
          onPageChange={table.setPage}
          onSortChange={table.onSortChange}
          actions={[
            { label: "Edit", icon: <Pencil />, onClick: (p) => setEditing(p) },
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
            <DialogTitle>Delete this payment?</DialogTitle>
            <DialogDescription>
              {deleting && `${peso(deleting.amount)} from ${deleting.customer.name}. `}
              The related trip&apos;s payment status will be recalculated.
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
