"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HandCoins, Loader2, Pencil, PlusCircle, Save, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { driverSchema, type DriverInput } from "@/lib/validation";
import { formatDate, peso } from "@/lib/format";
import { CashAdvancesDialog } from "@/features/drivers/cash-advances-dialog";
import type { DriverDTO } from "@/types";

const PAGE_SIZE = 10;

export function DriversView() {
  const table = useTableState("name");
  const [rows, setRows] = useState<DriverDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DriverDTO | null>(null);
  const [deleting, setDeleting] = useState<DriverDTO | null>(null);
  const [advancesFor, setAdvancesFor] = useState<DriverDTO | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverInput>({
    resolver: zodResolver(driverSchema),
    defaultValues: { name: "", licenseNo: "", contact: "", address: "", active: true },
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
      const res = await api<Paginated<DriverDTO>>(`/api/drivers?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, [table.page, table.debouncedSearch, table.sortKey, table.sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    reset({ name: "", licenseNo: "", contact: "", address: "", active: true });
    setDialogOpen(true);
  }

  function openEdit(d: DriverDTO) {
    setEditing(d);
    reset({
      name: d.name,
      licenseNo: d.licenseNo ?? "",
      contact: d.contact ?? "",
      address: d.address ?? "",
      active: d.active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: DriverInput) {
    setSaveLoading(true);
    try {
      if (editing) {
        await api(`/api/drivers/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Driver updated");
      } else {
        await api("/api/drivers", { method: "POST", body: JSON.stringify(values) });
        toast.success("Driver added");
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save driver");
    } finally {
      setSaveLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/drivers/${deleting.id}`, { method: "DELETE" });
      toast.success("Driver deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete driver");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<DriverDTO>[] = [
    {
      key: "name",
      header: "Driver Name",
      sortable: true,
      render: (d) => <span className="font-medium">{d.name}</span>,
    },
    { key: "licenseNo", header: "License No.", render: (d) => d.licenseNo ?? "-" },
    { key: "contact", header: "Contact", render: (d) => d.contact ?? "-" },
    { key: "address", header: "Address", render: (d) => d.address ?? "-" },
    {
      key: "tripCount",
      header: "Trips",
      className: "text-right",
      render: (d) => d.tripCount ?? 0,
    },
    {
      key: "advanceOutstanding",
      header: "Cash Advance",
      className: "text-right",
      render: (d) =>
        (d.advanceOutstanding ?? 0) > 0 ? (
          <span className="font-semibold text-amber-400">{peso(d.advanceOutstanding)}</span>
        ) : (
          <span className="text-muted-foreground">{peso(0)}</span>
        ),
    },
    {
      key: "active",
      header: "Status",
      render: (d) => (
        <Badge variant={d.active ? "success" : "secondary"}>
          {d.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Added",
      sortable: true,
      render: (d) => formatDate(d.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
          <Users className="h-4 w-4" /> Drivers
        </h2>
        <Button variant="destructive" size="sm" onClick={openCreate}>
          <PlusCircle /> Add Driver
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
        emptyTitle="No drivers found"
        emptyDescription="Add your first driver to start recording trips."
        onSearchChange={table.setSearch}
        onPageChange={table.setPage}
        onSortChange={table.onSortChange}
        actions={[
          { label: "Cash Advances", icon: <HandCoins />, onClick: setAdvancesFor },
          { label: "Edit", icon: <Pencil />, onClick: openEdit },
          { label: "Delete", icon: <Trash2 />, destructive: true, onClick: setDeleting },
        ]}
      />

      <CashAdvancesDialog
        driver={advancesFor}
        onClose={() => setAdvancesFor(null)}
        onChanged={load}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update driver details." : "Register a new driver."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="dname">Name *</Label>
              <Input id="dname" {...register("name")} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dlicense">License No.</Label>
                <Input id="dlicense" {...register("licenseNo")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dcontact">Contact</Label>
                <Input id="dcontact" {...register("contact")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daddress">Address</Label>
              <Input id="daddress" {...register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watch("active") ? "active" : "inactive"}
                onValueChange={(v) => setValue("active", v === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
              Drivers with recorded trips cannot be deleted — mark them inactive instead.
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
