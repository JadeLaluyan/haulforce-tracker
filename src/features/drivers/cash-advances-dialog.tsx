"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, HandCoins, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { peso, formatDate, toDateInput } from "@/lib/format";
import type { CashAdvanceDTO, DriverDTO } from "@/types";

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CashAdvancesDialogProps {
  driver: DriverDTO | null;
  onClose: () => void;
  onChanged: () => void;
}

export function CashAdvancesDialog({ driver, onClose, onChanged }: CashAdvancesDialogProps) {
  const [advances, setAdvances] = useState<CashAdvanceDTO[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: toDateInput(new Date()), amount: 0, reason: "" },
  });

  const load = useCallback(async () => {
    if (!driver) return;
    setLoading(true);
    try {
      const res = await api<{ data: CashAdvanceDTO[]; outstanding: number }>(
        `/api/cash-advances?driverId=${driver.id}`
      );
      setAdvances(res.data);
      setOutstanding(res.outstanding);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load cash advances");
    } finally {
      setLoading(false);
    }
  }, [driver]);

  useEffect(() => {
    if (driver) {
      reset({ date: toDateInput(new Date()), amount: 0, reason: "" });
      load();
    }
  }, [driver, load, reset]);

  async function onSubmit(values: FormValues) {
    if (!driver) return;
    setSaveLoading(true);
    try {
      await api("/api/cash-advances", {
        method: "POST",
        body: JSON.stringify({ ...values, driverId: driver.id }),
      });
      toast.success("Cash advance recorded");
      reset({ date: toDateInput(new Date()), amount: 0, reason: "" });
      load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save cash advance");
    } finally {
      setSaveLoading(false);
    }
  }

  async function toggleSettled(a: CashAdvanceDTO) {
    try {
      await api(`/api/cash-advances/${a.id}`, {
        method: "PUT",
        body: JSON.stringify({ settled: !a.settled }),
      });
      toast.success(!a.settled ? "Marked as settled" : "Marked as outstanding");
      load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update advance");
    }
  }

  async function remove(a: CashAdvanceDTO) {
    try {
      await api(`/api/cash-advances/${a.id}`, { method: "DELETE" });
      toast.success("Cash advance deleted");
      load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete advance");
    }
  }

  return (
    <Dialog open={!!driver} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-amber-400" />
            Cash Advances — {driver?.name}
          </DialogTitle>
          <DialogDescription>
            Outstanding balance:{" "}
            <span className="font-bold text-amber-400">{peso(outstanding)}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Add form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 rounded-md border bg-secondary/30 p-3 sm:grid-cols-[1fr_1fr_2fr_auto]"
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="adate">Date *</Label>
            <Input id="adate" type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="aamount">Amount (₱) *</Label>
            <Input id="aamount" type="number" step="0.01" min="0" {...register("amount")} />
            {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="areason">Reason</Label>
            <Input id="areason" placeholder="e.g. emergency, fuel advance" {...register("reason")} />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="destructive" disabled={saveLoading}>
              {saveLoading ? <Loader2 className="animate-spin" /> : <HandCoins />}
              Add
            </Button>
          </div>
        </form>

        {/* List */}
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {loading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : advances.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No cash advances recorded for this driver.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-accent/40">
                    <td className="px-3 py-2">{formatDate(a.date)}</td>
                    <td className="px-3 py-2">{a.reason ?? "-"}</td>
                    <td className="px-3 py-2 text-right font-semibold">{peso(a.amount)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={a.settled ? "success" : "warning"}>
                        {a.settled ? "Settled" : "Outstanding"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title={a.settled ? "Mark as outstanding" : "Mark as settled"}
                          onClick={() => toggleSettled(a)}
                        >
                          {a.settled ? (
                            <RotateCcw className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400"
                          title="Delete"
                          onClick={() => remove(a)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
