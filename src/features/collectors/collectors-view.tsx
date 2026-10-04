"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, PlusCircle, Save, Trash2, Users } from "lucide-react";
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
import { collectorSchema, type CollectorInput } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import type { CollectorDTO } from "@/types";

const PAGE_SIZE = 10;

export function CollectorsView() {
  const table = useTableState("name");
  const [rows, setRows] = useState<CollectorDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CollectorDTO | null>(null);
  const [deleting, setDeleting] = useState<CollectorDTO | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CollectorInput>({
    resolver: zodResolver(collectorSchema),
    defaultValues: { name: "", contact: "", address: "", active: true },
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
      const res = await api<Paginated<CollectorDTO>>(`/api/collectors?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load collectors");
    } finally {
      setLoading(false);
    }
  }, [table.page, table.debouncedSearch, table.sortKey, table.sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    reset({ name: "", contact: "", address: "", active: true });
    setDialogOpen(true);
  }

  function openEdit(c: CollectorDTO) {
    setEditing(c);
    reset({
      name: c.name,
      contact: c.contact ?? "",
      address: c.address ?? "",
      active: c.active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: CollectorInput) {
    setSaveLoading(true);
    try {
      if (editing) {
        await api(`/api/collectors/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Collector updated");
      } else {
        await api("/api/collectors", { method: "POST", body: JSON.stringify(values) });
        toast.success("Collector added");
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save collector");
    } finally {
      setSaveLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/collectors/${deleting.id}`, { method: "DELETE" });
      toast.success("Collector deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete collector");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<CollectorDTO>[] = [
    {
      key: "name",
      header: "Collector Name",
      sortable: true,
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    { key: "contact", header: "Contact", render: (c) => c.contact ?? "-" },
    { key: "address", header: "Address", render: (c) => c.address ?? "-" },
    {
      key: "active",
      header: "Status",
      render: (c) => (
        <Badge variant={c.active ? "success" : "secondary"}>
          {c.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Added",
      sortable: true,
      render: (c) => formatDate(c.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
          <Users className="h-4 w-4" /> Collectors
        </h2>
        <Button variant="destructive" size="sm" onClick={openCreate}>
          <PlusCircle /> Add Collector
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
        emptyTitle="No collectors found"
        emptyDescription="Add your first collector to start managing collections."
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
            <DialogTitle>{editing ? "Edit Collector" : "Add Collector"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update collector details." : "Register a new collector."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="cname">Name *</Label>
              <Input id="cname" {...register("name")} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ccontact">Contact</Label>
                <Input id="ccontact" {...register("contact")} />
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="caddress">Address</Label>
              <Input id="caddress" {...register("address")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={saveLoading}>
                {saveLoading ? <Loader2 className="animate-spin" /> : <Save />}
                {saveLoading ? "Saving..." : editing ? "Update Collector" : "Save Collector"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collector</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleting?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
