"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle, Save } from "lucide-react";
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
import { api } from "@/lib/api";
import { tripSchema, type TripInput } from "@/lib/validation";
import { toDateInput } from "@/lib/format";
import type { DriverDTO, HelperDTO, CollectorDTO, CustomerDTO, TripDTO } from "@/types";

interface TripFormProps {
  editing?: TripDTO | null;
  onSaved: () => void;
  onCancelEdit?: () => void;
}

const CARGO_TYPES = [
  "General Cargo",
  "Construction Materials",
  "Agricultural Products",
  "Consumer Goods",
  "Beverages",
  "Frozen Goods",
  "Equipment",
  "Other",
];

export function TripForm({ editing, onSaved, onCancelEdit }: TripFormProps) {
  const [drivers, setDrivers] = useState<DriverDTO[]>([]);
  const [helpers, setHelpers] = useState<HelperDTO[]>([]);
  const [collectors, setCollectors] = useState<CollectorDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripInput>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      date: toDateInput(new Date()),
      driverId: "",
      helperId: "",
      helperIds: [],
      collectorId: "",
      customerId: "",
      origin: "",
      destination: "",
      zone: "",
      cargoType: "General Cargo",
      weightKg: 0,
      tripRate: 0,
      fuelCost: 0,
      tollFee: 0,
      mealAllowance: 0,
      otherExpenses: 0,
      driverFee: 0,
      helperFee: 0,
      notes: "",
      status: "COMPLETED",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const [d, h, cl, c] = await Promise.all([
          api<{ data: DriverDTO[] }>("/api/drivers?all=1"),
          api<{ data: HelperDTO[] }>("/api/helpers?all=1"),
          api<{ data: CollectorDTO[] }>("/api/collectors?all=1"),
          api<{ data: CustomerDTO[] }>("/api/customers?all=1"),
        ]);
        setDrivers(d.data.filter((x) => x.active));
        setHelpers(h.data.filter((x) => x.active));
        setCollectors(cl.data.filter((x) => x.active));
        setCustomers(c.data);
      } catch {
        toast.error("Failed to load drivers/helpers/collectors/customers");
      }
    })();
  }, []);

  const selectedHelperIds = watch("helperIds") ?? [];
  const helper1Id = selectedHelperIds[0] ?? "";
  const helper2Id = selectedHelperIds[1] ?? "";

  useEffect(() => {
    if (editing) {
      const helperIds = editing.helperIds?.length
        ? editing.helperIds
        : editing.helperId
          ? [editing.helperId]
          : [];

      reset({
        date: editing.date.slice(0, 10),
        driverId: editing.driverId,
        helperId: helperIds[0] ?? "",
        helperIds,
        collectorId: editing.collectorId ?? "",
        customerId: editing.customerId,
        origin: editing.origin,
        destination: editing.destination,
        zone: editing.zone ?? "",
        cargoType: editing.cargoType,
        weightKg: Number(editing.weightKg),
        tripRate: Number(editing.tripRate),
        fuelCost: Number(editing.fuelCost),
        tollFee: Number(editing.tollFee),
        mealAllowance: Number(editing.mealAllowance),
        otherExpenses: Number(editing.otherExpenses),
        driverFee: Number(editing.driverFee),
        helperFee: Number(editing.helperFee),
        notes: editing.notes ?? "",
        status: editing.status,
      });
    }
  }, [editing, reset]);

  function applyHelperSelection(primaryId: string, secondaryId: string) {
    const next = [primaryId, secondaryId].filter(Boolean);
    const deduped = Array.from(new Set(next)).slice(0, 2);

    if (next.length > deduped.length) {
      toast.error("You can select up to 2 helpers per trip.");
    }

    setValue("helperIds", deduped, { shouldValidate: true });
    setValue("helperId", deduped[0] ?? "", { shouldValidate: true });
  }

  async function onSubmit(values: TripInput) {
    setLoading(true);
    try {
      const helperIds = values.helperIds ?? [];
      const payload = {
        ...values,
        helperIds,
        helperId: helperIds[0] ?? "",
        collectorId: values.collectorId || "",
        zone: values.zone?.trim() || "",
      };

      if (editing) {
        await api(`/api/trips/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Trip updated");
      } else {
        await api("/api/trips", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Trip saved with BIR invoice");
      }
      reset({
        date: toDateInput(new Date()),
        driverId: "",
        helperId: "",
        helperIds: [],
        collectorId: "",
        customerId: "",
        origin: "",
        destination: "",
        zone: "",
        cargoType: "General Cargo",
        weightKg: 0,
        tripRate: 0,
        fuelCost: 0,
        tollFee: 0,
        mealAllowance: 0,
        otherExpenses: 0,
        driverFee: 0,
        helperFee: 0,
        notes: "",
        status: "COMPLETED",
      });
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save trip");
    } finally {
      setLoading(false);
    }
  }

  const driverId = watch("driverId");
  const customerId = watch("customerId");
  const status = watch("status");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
          <PlusCircle className="h-4 w-4" />
          {editing ? `Edit Trip ${editing.tripCode}` : "Add New Trip"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Driver *</Label>
              <Select value={driverId} onValueChange={(v) => setValue("driverId", v, { shouldValidate: true })}>
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
              {errors.driverId && <p className="text-xs text-red-400">{errors.driverId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Helpers (optional, max 2)</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  value={helper1Id || "none"}
                  onValueChange={(v) => {
                    const nextPrimary = v === "none" ? "" : v;
                    const nextSecondary = nextPrimary && nextPrimary === helper2Id ? "" : helper2Id;
                    applyHelperSelection(nextPrimary, nextSecondary);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Helper 1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {helpers.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={helper2Id || "none"}
                  onValueChange={(v) => {
                    const nextSecondary = v === "none" ? "" : v;
                    applyHelperSelection(helper1Id, nextSecondary);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Helper 2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {helpers
                      .filter((h) => h.id !== helper1Id)
                      .map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.helperIds && (
                <p className="text-xs text-red-400">{errors.helperIds.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Collector (optional)</Label>
              <Select
                value={watch("collectorId") || "none"}
                onValueChange={(v) => setValue("collectorId", v === "none" ? "" : v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {collectors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.collectorId && (
                <p className="text-xs text-red-400">{errors.collectorId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={(v) => setValue("customerId", v, { shouldValidate: true })}>
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
              <Label htmlFor="origin">Origin *</Label>
              <Input id="origin" placeholder="e.g. Bulacan" {...register("origin")} />
              {errors.origin && <p className="text-xs text-red-400">{errors.origin.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination *</Label>
              <Input id="destination" placeholder="e.g. Cebu" {...register("destination")} />
              {errors.destination && (
                <p className="text-xs text-red-400">{errors.destination.message}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="zone">Zone</Label>
              <Textarea
                id="zone"
                placeholder="Optional destination description or identifier (max 200 chars)"
                maxLength={200}
                {...register("zone")}
              />
              <p className="text-[11px] text-slate-500">
                {watch("zone")?.length ?? 0}/200 characters
              </p>
              {errors.zone && <p className="text-xs text-red-400">{errors.zone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Cargo Type *</Label>
              <Select
                value={watch("cargoType")}
                onValueChange={(v) => setValue("cargoType", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  {CARGO_TYPES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input id="weightKg" type="number" step="0.01" min="0" {...register("weightKg")} />
              {errors.weightKg && <p className="text-xs text-red-400">{errors.weightKg.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tripRate">Trip Rate (₱)</Label>
              <Input
                id="tripRate"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                {...register("tripRate")}
              />
              {errors.tripRate && <p className="text-xs text-red-400">{errors.tripRate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fuelCost">Fuel Cost (₱)</Label>
              <Input id="fuelCost" type="number" step="0.01" min="0" {...register("fuelCost")} />
              {errors.fuelCost && <p className="text-xs text-red-400">{errors.fuelCost.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tollFee">Toll Fee (₱)</Label>
              <Input id="tollFee" type="number" step="0.01" min="0" {...register("tollFee")} />
              {errors.tollFee && <p className="text-xs text-red-400">{errors.tollFee.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mealAllowance">Meal Allowance (₱)</Label>
              <Input id="mealAllowance" type="number" step="0.01" min="0" {...register("mealAllowance")} />
              {errors.mealAllowance && (
                <p className="text-xs text-red-400">{errors.mealAllowance.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driverFee">Driver Fee (₱)</Label>
              <Input id="driverFee" type="number" step="0.01" min="0" {...register("driverFee")} />
              {errors.driverFee && <p className="text-xs text-red-400">{errors.driverFee.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="helperFee">Helper Fee (₱)</Label>
              <Input id="helperFee" type="number" step="0.01" min="0" {...register("helperFee")} />
              {errors.helperFee && <p className="text-xs text-red-400">{errors.helperFee.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="otherExpenses">Other Expenses (₱)</Label>
              <Input id="otherExpenses" type="number" step="0.01" min="0" {...register("otherExpenses")} />
              {errors.otherExpenses && (
                <p className="text-xs text-red-400">{errors.otherExpenses.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Trip Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setValue("status", v as TripInput["status"], { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} placeholder="unpaid, priority, etc." {...register("notes")} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Save />}
              {loading ? "Saving..." : editing ? "Update Trip" : "Save Trip"}
            </Button>
            {editing && onCancelEdit && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
