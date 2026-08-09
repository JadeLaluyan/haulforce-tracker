"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, Pencil, PlusCircle, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { customerSchema, type CustomerInput } from "@/lib/validation";
import { peso } from "@/lib/format";
import type { CustomerDTO } from "@/types";

const PAGE_SIZE = 10;

function parseTerms(terms: string): { mode: "COD" | "NET"; days: number } {
  const m = /^(\d+)\s*days?$/i.exec(terms.trim());
  return m ? { mode: "NET", days: parseInt(m[1], 10) } : { mode: "COD", days: 15 };
}

export function CustomersView() {
  const table = useTableState("name");
  const [rows, setRows] = useState<CustomerDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerDTO | null>(null);
  const [deleting, setDeleting] = useState<CustomerDTO | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [termsMode, setTermsMode] = useState<"COD" | "NET">("COD");
  const [termsDays, setTermsDays] = useState(15);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      company: "",
      address: "",
      contact: "",
      email: "",
      tin: "",
      terms: "COD",
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(table.page));
      params.set("pageSize", String(PAGE_SIZE));
      if (table.debouncedSearch) params.set("search", table.debouncedSearch);
      if (table.sortKey) {
        params.set("sortKey", table.sortKey);
        params.set("sortDir", table.sortDir);
      }
      const res = await api<Paginated<CustomerDTO>>(`/api/customers?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [table.page, table.debouncedSearch, table.sortKey, table.sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    reset({ name: "", company: "", address: "", contact: "", email: "", tin: "", terms: "COD" });
    setTermsMode("COD");
    setTermsDays(15);
    setDialogOpen(true);
  }

  function openEdit(c: CustomerDTO) {
    setEditing(c);
    reset({
      name: c.name,
      company: c.company ?? "",
      address: c.address ?? "",
      contact: c.contact ?? "",
      email: c.email ?? "",
      tin: c.tin ?? "",
      terms: c.terms,
    });
    const parsed = parseTerms(c.terms);
    setTermsMode(parsed.mode);
    setTermsDays(parsed.days);
    setDialogOpen(true);
  }

  async function onSubmit(values: CustomerInput) {
    values.terms = termsMode === "COD" ? "COD" : String(Math.max(1, termsDays)) + " days";
    setSaveLoading(true);
    try {
      if (editing) {
        await api(`/api/customers/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Customer updated");
      } else {
        await api("/api/customers", { method: "POST", body: JSON.stringify(values) });
        toast.success("Customer added");
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save customer");
    } finally {
      setSaveLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/customers/${deleting.id}`, { method: "DELETE" });
      toast.success("Customer deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete customer");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<CustomerDTO>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    { key: "company", header: "Company", sortable: true, render: (c) => c.company ?? "-" },
    { key: "address", header: "Address", render: (c) => c.address ?? "-" },
    { key: "contact", header: "Contact", render: (c) => c.contact ?? "-" },
    { key: "terms", header: "Terms" },
    {
      key: "outstanding",
      header: "Outstanding",
      className: "text-right",
      render: (c) =>
        (c.outstanding ?? 0) > 0 ? (
          <span className="font-semibold text-amber-400">{peso(c.outstanding)}</span>
        ) : (
          <span className="text-emerald-400">{peso(0)}</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
          <Building2 className="h-4 w-4" /> Customers
        </h2>
        <Button variant="destructive" size="sm" onClick={openCreate}>
          <PlusCircle /> Add Customer
        </Button>
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
        emptyTitle="No customers found"
        emptyDescription="Add your first customer to start billing trips."
        onSearchChange={table.setSearch}
        onPageChange={table.setPage}
        onSortChange={table.onSortChange}
        actions={[
          { label: "Edit", icon: <Pencil />, onClick: openEdit },
          { label: "Delete", icon: <Trash2 />, destructive: true, onClick: setDeleting },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update customer details." : "Register a new customer."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cname">Name *</Label>
                <Input id="cname" {...register("name")} />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ccompany">Company</Label>
                <Input id="ccompany" {...register("company")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="caddress">Address</Label>
              <Input id="caddress" {...register("address")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ccontact">Contact</Label>
                <Input id="ccontact" {...register("contact")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cemail">Email</Label>
                <Input id="cemail" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ctin">TIN</Label>
                <Input id="ctin" placeholder="000-000-000-000" {...register("tin")} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <div className="flex gap-2">
                  <Select
                    value={termsMode}
                    onValueChange={(v) => setTermsMode(v as "COD" | "NET")}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COD">COD</SelectItem>
                      <SelectItem value="NET">Net (days)</SelectItem>
                    </SelectContent>
                  </Select>
                  {termsMode === "NET" && (
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={termsDays}
                      onChange={(e) => setTermsDays(parseInt(e.target.value, 10) || 1)}
                      className="w-24"
                      aria-label="Number of days"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {termsMode === "COD" ? "Cash on delivery" : "Payment due " + termsDays + " days after invoice"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={saveLoading}>
                {saveLoading ? <Loader2 className="animate-spin" /> : <Save />}
                {saveLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              Customers with recorded trips cannot be deleted.
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
