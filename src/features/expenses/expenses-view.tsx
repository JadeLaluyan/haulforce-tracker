"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Receipt, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { usePeriod } from "@/hooks/use-period";
import { api, type Paginated } from "@/lib/api";
import { expenseSchema, type ExpenseInput } from "@/lib/validation";
import { peso, formatDate, toDateInput } from "@/lib/format";
import type { DriverDTO, ExpenseDTO } from "@/types";

const PAGE_SIZE = 10;

const CATEGORY_LABELS: Record<ExpenseDTO["category"], string> = {
  FUEL: "Fuel",
  MAINTENANCE: "Maintenance",
  TOLL: "Toll",
  SALARY: "Salary",
  PERMITS_LICENSES: "Permits & Licenses",
  OFFICE: "Office",
  OTHER: "Other",
};

interface ExpensesResponse extends Paginated<ExpenseDTO> {
  sumAmount: number;
}

export function ExpensesView() {
  const { queryString } = usePeriod();
  const table = useTableState("date");
  const [rows, setRows] = useState<ExpenseDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [sumAmount, setSumAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [drivers, setDrivers] = useState<DriverDTO[]>([]);
  const [editing, setEditing] = useState<ExpenseDTO | null>(null);
  const [deleting, setDeleting] = useState<ExpenseDTO | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: toDateInput(new Date()),
      category: "FUEL",
      description: "",
      amount: 0,
      driverId: "",
      notes: "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const d = await api<{ data: DriverDTO[] }>("/api/drivers?all=1");
        setDrivers(d.data);
      } catch {
        /* non-fatal */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(queryString);
      params.set("page", String(table.page));
      params.set("pageSize", String(PAGE_SIZE));
      if (category !== "ALL") params.set("category", category);
      if (table.debouncedSearch) params.set("search", table.debouncedSearch);
      if (table.sortKey) {
        params.set("sortKey", table.sortKey);
        params.set("sortDir", table.sortDir);
      }
      const res = await api<ExpensesResponse>(`/api/expenses?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
      setSumAmount(res.sumAmount);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [queryString, category, table.page, table.debouncedSearch, table.sortKey, table.sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (editing) {
      reset({
        date: editing.date.slice(0, 10),
        category: editing.category,
        description: editing.description,
        amount: Number(editing.amount),
        driverId: editing.driverId ?? "",
        notes: editing.notes ?? "",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editing, reset]);

  async function onSubmit(values: ExpenseInput) {
    setSaveLoading(true);
    try {
      if (editing) {
        await api(`/api/expenses/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Expense updated");
      } else {
        await api("/api/expenses", { method: "POST", body: JSON.stringify(values) });
        toast.success("Expense saved");
      }
      setEditing(null);
      reset({
        date: toDateInput(new Date()),
        category: "FUEL",
        description: "",
        amount: 0,
        driverId: "",
        notes: "",
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save expense");
    } finally {
      setSaveLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/expenses/${deleting.id}`, { method: "DELETE" });
      toast.success("Expense deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete expense");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<ExpenseDTO>[] = [
    { key: "date", header: "Date", sortable: true, render: (x) => formatDate(x.date) },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (x) => <Badge variant="secondary">{CATEGORY_LABELS[x.category]}</Badge>,
    },
    { key: "description", header: "Description" },
    { key: "driver", header: "Driver", render: (x) => x.driver?.name ?? "-" },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      className: "text-right",
      render: (x) => <span className="font-semibold text-red-400">{peso(x.amount)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
            <Receipt className="h-4 w-4" />
            {editing ? "Edit Expense" : "Add Expense"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="edate">Date *</Label>
                <Input id="edate" type="date" {...register("date")} />
                {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={watch("category")}
                  onValueChange={(v) =>
                    setValue("category", v as ExpenseInput["category"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eamount">Amount (₱) *</Label>
                <Input id="eamount" type="number" step="0.01" min="0" {...register("amount")} />
                {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edesc">Description *</Label>
                <Input id="edesc" placeholder="e.g. Change oil - Truck 1" {...register("description")} />
                {errors.description && (
                  <p className="text-xs text-red-400">{errors.description.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Driver (optional)</Label>
                <Select
                  value={watch("driverId") || "none"}
                  onValueChange={(v) => setValue("driverId", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enotes">Notes</Label>
              <Textarea id="enotes" rows={2} {...register("notes")} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={saveLoading}>
                {saveLoading ? <Loader2 className="animate-spin" /> : <Save />}
                {saveLoading ? "Saving..." : editing ? "Update Expense" : "Save Expense"}
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

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-red">
            Expense Records
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Period total:{" "}
              <span className="font-bold text-red-400">{peso(sumAmount)}</span>
            </span>
            <Select value={category} onValueChange={(v) => { setCategory(v); table.setPage(1); }}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
          emptyTitle="No expenses found"
          emptyDescription="Record your first expense using the form above."
          onSearchChange={table.setSearch}
          onPageChange={table.setPage}
          onSortChange={table.onSortChange}
          actions={[
            { label: "Edit", icon: <Pencil />, onClick: (x) => setEditing(x) },
            { label: "Delete", icon: <Trash2 />, destructive: true, onClick: (x) => setDeleting(x) },
          ]}
        />
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this expense?</DialogTitle>
            <DialogDescription>
              {deleting && `${CATEGORY_LABELS[deleting.category]} · ${peso(deleting.amount)} — `}
              this action cannot be undone.
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
