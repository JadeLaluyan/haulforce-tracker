"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator as CalculatorIcon, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePricing, type PricingBreakdown } from "@/lib/calculator";
import { peso } from "@/lib/format";

const calcSchema = z.object({
  distanceKm: z.coerce.number().positive("Distance must be greater than 0"),
  weightKg: z.coerce.number().min(0, "Must be 0 or more"),
  fuelCost: z.coerce.number().min(0, "Must be 0 or more"),
  tollFee: z.coerce.number().min(0, "Must be 0 or more"),
  mealAllowance: z.coerce.number().min(0, "Must be 0 or more"),
  otherExpenses: z.coerce.number().min(0, "Must be 0 or more"),
  marginPercent: z.coerce.number().min(0, "Must be 0 or more").max(200, "Too high"),
});

type CalcValues = z.infer<typeof calcSchema>;

export function CalculatorView() {
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CalcValues>({
    resolver: zodResolver(calcSchema),
    defaultValues: {
      distanceKm: 0,
      weightKg: 0,
      fuelCost: 0,
      tollFee: 0,
      mealAllowance: 0,
      otherExpenses: 0,
      marginPercent: 20,
    },
  });

  function onSubmit(values: CalcValues) {
    setBreakdown(calculatePricing(values));
  }

  const rows = breakdown
    ? [
        { label: "Base Rate", value: breakdown.baseRate },
        { label: "Fuel Cost", value: breakdown.fuelCost },
        { label: "Toll Fee", value: breakdown.tollFee },
        { label: "Meal Allowance", value: breakdown.mealAllowance },
        { label: "Other Expenses", value: breakdown.otherExpenses },
        { label: "Total Expenses", value: breakdown.totalExpenses },
      ]
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
            <CalculatorIcon className="h-4 w-4" />
            Trip Pricing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="distanceKm">Distance (km) *</Label>
                <Input id="distanceKm" type="number" step="1" min="0" {...register("distanceKm")} />
                {errors.distanceKm && (
                  <p className="text-xs text-red-400">{errors.distanceKm.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cweight">Weight (kg)</Label>
                <Input id="cweight" type="number" step="1" min="0" {...register("weightKg")} />
                {errors.weightKg && (
                  <p className="text-xs text-red-400">{errors.weightKg.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cfuel">Fuel Cost (₱)</Label>
                <Input id="cfuel" type="number" step="0.01" min="0" {...register("fuelCost")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ctoll">Toll Fee (₱)</Label>
                <Input id="ctoll" type="number" step="0.01" min="0" {...register("tollFee")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cmeal">Meal Allowance (₱)</Label>
                <Input id="cmeal" type="number" step="0.01" min="0" {...register("mealAllowance")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cother">Other Expenses (₱)</Label>
                <Input id="cother" type="number" step="0.01" min="0" {...register("otherExpenses")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cmargin">Target Margin (%)</Label>
                <Input id="cmargin" type="number" step="1" min="0" {...register("marginPercent")} />
                {errors.marginPercent && (
                  <p className="text-xs text-red-400">{errors.marginPercent.message}</p>
                )}
              </div>
            </div>
            <Button type="submit">
              <CalculatorIcon /> Calculate
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/20 px-5 py-3">
                <CircleDollarSign className="h-4 w-4 text-emerald-300" />
                <h3 className="text-sm font-bold uppercase tracking-wide">Pricing Breakdown</h3>
              </div>
              <div className="divide-y divide-white/10 px-5">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-blue-100">{r.label}</span>
                    <span className="font-semibold">{peso(r.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3 text-base">
                  <span className="font-bold text-amber-300">Suggested Price</span>
                  <span className="font-extrabold text-amber-300">
                    {peso(breakdown.suggestedPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 text-base">
                  <span className="font-bold text-emerald-300">Estimated Profit</span>
                  <span className="font-extrabold text-emerald-300">
                    {peso(breakdown.estimatedProfit)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
