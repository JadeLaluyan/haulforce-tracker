"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HandCoins, HardHat, Loader2, Pencil, PlusCircle, Save, Trash2 } from "lucide-react";
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
import { helperSchema, type HelperInput } from "@/lib/validation";
import { formatDate, peso } from "@/lib/format";
import { CashAdvancesDialog, type CashAdvanceParty } from "@/features/shared/cash-advances-dialog";
import type { HelperDTO } from "@/types";

const PAGE_SIZE = 10;

export function HelpersView() {
  const table = useTableState("name");
  const [rows, setRows] = useState<HelperDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HelperDTO | null>(null);
  const [deleting, setDeleting] = useState<HelperDTO | null>(null);
  const [advancesFor, setAdvancesFor] = useState<CashAdvanceParty | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HelperInput>({
    resolver: zodResolver(helperSchema),
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
      const res = await api<Paginated<HelperDTO>>(`/api/helpers?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load helpers");
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

  function openEdit(h: HelperDTO) {
    setEditing(h);
    reset({
      name: h.name,
      contact: h.contact ?? "",
      address: h.address ?? "",
      active: h.active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: HelperInput) {
    setSaveLoading(true);
    try {
      if (editing) {
        await api(`/api/helpers/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Helper updated");
      } else {
        await api("/api/helpers", { method: "POST", body: JSON.stringify(values) });
        toast.success("Helper added");
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save helper");
    } finally {
      setSaveLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/helpers/${deleting.id}`, { method: "DELETE" });
      toast.success("Helper deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete helper");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<HelperDTO>[] = [
    {
      key: "name",
      header: "Helper Name",
      sortable: true,
      render: (h) => <span className="font-medium">{h.name}</span>,
    },
    { key: "contact", header: "Contact", render: (h) => h.contact ?? "-" },
    { key: "address", header: "Address", render: (h) => h.address ?? "-" },
    {
      key: "tripCount",
      header: "Trips",
      className: "text-right",
      render: (h) => h.tripCount ?? 0,
    },
    {
      key: "advanceOutstanding",
      header: "Cash Advance",
      className: "text-right",
      render: (h) =>
        (h.advanceOutstanding ?? 0) > 0 ? (
          <span className="font-semibold text-amber-400">{peso(h.advanceOutstanding)}</span>
        ) : (
          <span className="text-muted-foreground">{peso(0)}</span>
        ),
    },
    {
      key: "active",
      header: "Status",
      render: (h) => (
        <Badge variant={h.active ? "success" : "secondary"}>
          {h.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Added",
      sortable: true,
      render: (h) => formatDate(h.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
          <HardHat className="h-4 w-4" /> Helpers
        </h2>
        <Button variant="destructive" size="sm" onClick={openCreate}>
          <PlusCircle /> Add Helper
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
        emptyTitle="No helpers found"
        emptyDescription="Add your first helper to assign them to trips."
        onSearchChange={table.setSearch}
        onPageChange={table.setPage}
        onSortChange={table.onSortChange}
        actions={[
          {
            label: "Cash Advances",
            icon: <HandCoins />,
            onClick: (h) => setAdvancesFor({ id: h.id, name: h.name, kind: "helper" }),
          },
          { label: "Edit", icon: <Pencil />, onClick: openEdit },
          { label: "Delete", icon: <Trash2 />, destructive: true, onClick: setDeleting },
        ]}
      />

      <CashAdvancesDialog
        party={advancesFor}
        onClose={() => setAdvancesFor(null)}
        onChanged={load}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Helper" : "Add Helper"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update helper details." : "Register a new helper."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="hname">Name *</Label>
              <Input id="hname" {...register("name")} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hcontact">Contact</Label>
              <Input id="hcontact" {...register("contact")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="haddress">Address</Label>
              <Input id="haddress" {...register("address")} />
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
              Helpers with recorded trips cannot be deleted — mark them inactive instead.
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
