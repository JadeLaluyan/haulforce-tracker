"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PeriodKey } from "@/lib/period";

export function usePeriod() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const period = (searchParams.get("period") as PeriodKey) || "this_month";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const setPeriod = useCallback(
    (next: PeriodKey, nextFrom?: string, nextTo?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", next);
      if (next === "custom") {
        if (nextFrom) params.set("from", nextFrom);
        if (nextTo) params.set("to", nextTo);
      } else {
        params.delete("from");
        params.delete("to");
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const query = new URLSearchParams({ period });
  if (period === "custom") {
    if (from) query.set("from", from);
    if (to) query.set("to", to);
  }

  return { period, from, to, setPeriod, queryString: query.toString() };
}
