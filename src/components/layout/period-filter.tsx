"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { PERIODS, type PeriodKey } from "@/lib/period";
import { usePeriod } from "@/hooks/use-period";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PeriodFilter() {
  const { period, from, to, setPeriod } = usePeriod();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [showCustom, setShowCustom] = useState(period === "custom");

  function onSelect(key: PeriodKey) {
    if (key === "custom") {
      setShowCustom(true);
      if (customFrom && customTo) setPeriod("custom", customFrom, customTo);
      return;
    }
    setShowCustom(false);
    setPeriod(key);
  }

  return (
    <div className="border-b border-white/10 bg-brand-blue/90">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
            Filter Period:
          </span>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => onSelect(p.key)}
              className={cn(
                "rounded px-3 py-1 text-xs font-semibold transition-colors",
                period === p.key
                  ? "bg-white text-brand-bluedark shadow"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {p.key === "custom" && <CalendarRange className="mr-1 inline h-3 w-3" />}
              {p.label}
            </button>
          ))}
          {showCustom && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-7 w-36 border-white/20 bg-white/10 text-xs text-white"
              />
              <span className="text-xs text-blue-100">to</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-7 w-36 border-white/20 bg-white/10 text-xs text-white"
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                disabled={!customFrom || !customTo}
                onClick={() => setPeriod("custom", customFrom, customTo)}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
