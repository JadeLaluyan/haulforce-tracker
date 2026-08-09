import { NextRequest } from "next/server";
import { resolvePeriod, type DateRange } from "@/lib/period";

export interface ListParams {
  page: number;
  pageSize: number;
  search: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  range: DateRange | null;
}

export function parseListParams(req: NextRequest, opts?: { defaultPageSize?: number }): ListParams {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(sp.get("pageSize") ?? String(opts?.defaultPageSize ?? 10), 10) || 10)
  );
  const search = (sp.get("search") ?? "").trim();
  const sortKey = sp.get("sortKey");
  const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";
  const period = sp.get("period");
  const range = period ? resolvePeriod(period, sp.get("from"), sp.get("to")) : null;
  return { page, pageSize, search, sortKey, sortDir, range };
}

export function handleError(e: unknown): Response {
  console.error(e);
  const message = e instanceof Error ? e.message : "Internal server error";
  return Response.json({ error: message }, { status: 500 });
}
