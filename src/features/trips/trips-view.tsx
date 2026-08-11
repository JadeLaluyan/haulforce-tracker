"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TripForm } from "@/features/trips/trip-form";
import { useTableState } from "@/hooks/use-table-state";
import { usePeriod } from "@/hooks/use-period";
import { api, type Paginated } from "@/lib/api";
import { peso, formatDate } from "@/lib/format";
import type { TripDTO } from "@/types";

const PAGE_SIZE = 10;

export function TripsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { queryString } = usePeriod();
  const table = useTableState("date");
  const [rows, setRows] = useState<TripDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<TripDTO | null>(null);
  const [deleting, setDeleting] = useState<TripDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pick up global search from header (?q=)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) table.setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      const res = await api<Paginated<TripDTO>>(`/api/trips?${params.toString()}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [queryString, table.page, table.debouncedSearch, table.sortKey, table.sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/trips/${deleting.id}`, { method: "DELETE" });
      toast.success(`Trip ${deleting.tripCode} deleted`);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete trip");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnDef<TripDTO>[] = [
    {
      key: "tripCode",
      header: "Trip ID",
      sortable: true,
      render: (t) => <span className="font-mono text-xs">{t.tripCode}</span>,
    },
    { key: "date", header: "Date", sortable: true, render: (t) => formatDate(t.date) },
    { key: "driver", header: "Driver Name", render: (t) => t.driver.name },
    { key: "helper", header: "Helper", render: (t) => t.helper?.name ?? "-" },
    {
      key: "customer",
      header: "Customer Name",
      render: (t) => t.customer.company || t.customer.name,
    },
    { key: "origin", header: "Origin", sortable: true },
    { key: "destination", header: "Destination", sortable: true },
    {
      key: "tripRate",
      header: "Rate",
      sortable: true,
      className: "text-right",
      render: (t) => <span className="font-semibold">{peso(t.tripRate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => (
        <div className="flex flex-col gap-1">
          <Badge
            variant={
              t.status === "COMPLETED"
                ? "success"
                : t.status === "IN_TRANSIT"
                  ? "default"
                  : t.status === "CANCELLED"
                    ? "destructive"
                    : "warning"
            }
          >
            {t.status.replaceAll("_", " ")}
          </Badge>
          <Badge
            variant={
              t.paymentStatus === "PAID"
                ? "success"
                : t.paymentStatus === "PARTIAL"
                  ? "warning"
                  : "secondary"
            }
          >
            {t.paymentStatus}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <TripForm
        editing={editing}
        onSaved={() => {
          setEditing(null);
          load();
        }}
        onCancelEdit={() => setEditing(null)}
      />

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-red">
          Recent Trips (with BIR Invoice)
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
          emptyTitle="No trips found"
          emptyDescription="Add your first trip using the form above."
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          onSearchChange={table.setSearch}
          onPageChange={table.setPage}
          onSortChange={table.onSortChange}
          actions={[
            {
              label: "View Invoice",
              icon: <FileText />,
              onClick: (t) => router.push(`/trips/${t.id}/invoice`),
            },
            {
              label: "Edit",
              icon: <Pencil />,
              onClick: (t) => {
                setEditing(t);
                window.scrollTo({ top: 0, behavior: "smooth" });
              },
            },
            {
              label: "Delete",
              icon: <Trash2 />,
              destructive: true,
              onClick: (t) => setDeleting(t),
            },
          ]}
        />
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete trip {deleting?.tripCode}?</DialogTitle>
            <DialogDescription>
              This permanently removes the trip and its BIR invoice. This action cannot be
              undone.
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
