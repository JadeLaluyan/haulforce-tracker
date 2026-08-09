import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "@/lib/dates";

export const PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "this_month", label: "This Month" },
  { key: "this_year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["key"];

export interface DateRange {
  from: Date;
  to: Date;
}

export function resolvePeriod(
  period: string | null | undefined,
  from?: string | null,
  to?: string | null
): DateRange {
  const now = new Date();
  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "last7":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "custom": {
      const f = from ? startOfDay(new Date(from)) : startOfMonth(now);
      const t = to ? endOfDay(new Date(to)) : endOfDay(now);
      return { from: f, to: t };
    }
    case "this_month":
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}
