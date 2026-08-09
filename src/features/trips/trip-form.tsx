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
import type { DriverDTO, CustomerDTO, TripDTO } from "@/types";

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
      customerId: "",
      origin: "",
      destination: "",
      cargoType: "General Cargo",
      weightKg: 0,
      tripRate: 0,
      fuelCost: 0,
      tollFee: 0,
      mealAllowance: 0,
      otherExpenses: 0,
      driverFee: 0,
      notes: "",
      status: "COMPLETED",
      paymentTerms: "COD",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const [d, c] = await Promise.all([
          api<{ data: DriverDTO[] }>("/api/drivers?all=1"),
          api<{ data: CustomerDTO[] }>("/api/customers?all=1"),
        ]);
        setDrivers(d.data.filter((x) => x.active));
        setCustomers(c.data);
      } catch {
        toast.error("Failed to load drivers/customers");
      }
    })();
  }, []);

  useEffect(() => {
    if (editing) {
      reset({
        date: editing.date.slice(0, 10),
        driverId: editing.driverId,
        customerId: editing.customerId,
        origin: editing.origin,
        destination: editing.destination,
        cargoType: editing.cargoType,
        weightKg: Number(editing.weightKg),
        tripRate: Number(editing.tripRate),
        fuelCost: Number(editing.fuelCost),
        tollFee: Number(editing.tollFee),
        mealAllowance: Number(editing.mealAllowance),
        otherExpenses: Number(editing.otherExpenses),
        driverFee: Number(editing.driverFee),
        notes: editing.notes ?? "",
        status: editing.status,
        paymentTerms: "COD",
      });
    }
  }, [editing, reset]);

  async function onSubmit(values: TripInput) {
    setLoading(true);
    try {
      if (editing) {
        await api(`/api/trips/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Trip updated");
      } else {
        await api("/api/trips", { method: "POST", body: JSON.stringify(values) });
        toast.success("Trip saved with BIR invoice");
      }
      reset({
        date: toDateInput(new Date()),
        driverId: "",
        customerId: "",
        origin: "",
        destination: "",
        cargoType: "General Cargo",
        weightKg: 0,
        tripRate: 0,
        fuelCost: 0,
        tollFee: 0,
        mealAllowance: 0,
        otherExpenses: 0,
        driverFee: 0,
        notes: "",
        status: "COMPLETED",
        paymentTerms: "COD",
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
              <Label htmlFor="tripRate">Trip Rate (₱) *</Label>
              <Input id="tripRate" type="number" step="0.01" min="0" {...register("tripRate")} />
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
