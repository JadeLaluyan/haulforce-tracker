"use client";

import { useCallback, useEffect, useState } from "react";
import { BookmarkPlus, Download, Eye, FileBarChart, FileSpreadsheet, Printer, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/hooks/use-period";
import { api } from "@/lib/api";
import { peso, formatDateLong } from "@/lib/format";
import { COMPANY } from "@/lib/config";
import { cn } from "@/lib/utils";

interface ReportSection {
  title: string;
  rows: { label: string; value: number; bold?: boolean; indent?: boolean }[];
}

interface ReportPayload {
  type: string;
  title: string;
  period: { from: string; to: string };
  sections?: ReportSection[];
  table?: { headers: string[]; rows: (string | number)[][] };
  totals?: { label: string; value: number }[];
}

const REPORT_TYPES = [
  { key: "income-statement", label: "Income Statement" },
  { key: "profit-loss", label: "P&L Statement" },
  { key: "trip-summary", label: "Trip Summary" },
  { key: "expense-report", label: "Expense Report" },
  { key: "customer-report", label: "Customer Report" },
  { key: "driver-report", label: "Drivers Report" },
] as const;

interface SavedReportMeta {
  id: string;
  type: string;
  title: string;
  periodFrom: string;
  periodTo: string;
  createdAt: string;
}

const MONEY_HEADERS = new Set([
  "Rate",
  "Costs",
  "Profit",
  "Amount",
  "Billed (VAT incl.)",
  "Paid",
  "Balance",
  "Revenue Generated",
  "Driver Earnings",
]);

export function ReportsView() {
  const { queryString } = usePeriod();
  const [type, setType] = useState<string>("income-statement");
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<SavedReportMeta[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [viewingSaved, setViewingSaved] = useState<SavedReportMeta | null>(null);

  const loadSaved = useCallback(async () => {
    try {
      const res = await api<{ data: SavedReportMeta[] }>("/api/saved-reports");
      setSaved(res.data);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const load = useCallback(async () => {
    setViewingSaved(null);
    setLoading(true);
    try {
      const res = await api<{ data: ReportPayload }>(`/api/reports/${type}?${queryString}`);
      setReport(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to build report");
    } finally {
      setLoading(false);
    }
  }, [type, queryString]);

  useEffect(() => {
    load();
  }, [load]);

  function downloadExcel() {
    window.open(`/api/reports/${type}?${queryString}&format=csv`, "_blank");
  }

  async function saveReport() {
    if (!report) return;
    setSaveLoading(true);
    try {
      const label = REPORT_TYPES.find((r) => r.key === report.type)?.label ?? report.title;
      const title = `${label} — saved ${new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;
      await api("/api/saved-reports", {
        method: "POST",
        body: JSON.stringify({
          type: report.type,
          title,
          periodFrom: report.period.from,
          periodTo: report.period.to,
          payload: report,
        }),
      });
      toast.success("Report saved");
      loadSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save report");
    } finally {
      setSaveLoading(false);
    }
  }

  async function openSaved(meta: SavedReportMeta) {
    try {
      const res = await api<{ data: { payload: ReportPayload } }>(`/api/saved-reports/${meta.id}`);
      setReport(res.data.payload);
      setType(res.data.payload.type);
      setViewingSaved(meta);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open saved report");
    }
  }

  async function deleteSaved(meta: SavedReportMeta) {
    try {
      await api(`/api/saved-reports/${meta.id}`, { method: "DELETE" });
      toast.success("Saved report deleted");
      if (viewingSaved?.id === meta.id) {
        setViewingSaved(null);
        load();
      }
      loadSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete saved report");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-red">
        <FileBarChart className="h-4 w-4" />
        Comprehensive Business Reports
      </h2>

      {/* Report type selector */}
      <div className="no-print flex flex-wrap gap-2">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.key}
            onClick={() => setType(r.key)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-semibold transition-colors",
              type === r.key
                ? "bg-brand-blue text-white shadow"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="no-print flex flex-wrap gap-2">
        <Button variant="destructive" size="sm" onClick={() => window.print()}>
          <Printer /> Print Report
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Download /> Download PDF
        </Button>
        <Button variant="success" size="sm" onClick={downloadExcel}>
          <FileSpreadsheet /> Download Excel
        </Button>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh Reports
        </Button>
        <Button variant="success" size="sm" onClick={saveReport} disabled={loading || saveLoading || !!viewingSaved}>
          <BookmarkPlus /> {saveLoading ? "Saving..." : "Save Report"}
        </Button>
      </div>

      {viewingSaved && (
        <div className="no-print flex items-center justify-between rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <span>
            Viewing saved report: <span className="font-semibold">{viewingSaved.title}</span>
          </span>
          <Button variant="outline" size="sm" onClick={load}>
            Back to live report
          </Button>
        </div>
      )}

      {/* Report document */}
      {loading || !report ? (
        <Skeleton className="h-[560px]" />
      ) : (
        <div className="print-area mx-auto max-w-3xl rounded-lg bg-white p-8 text-gray-900 shadow-xl">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">{COMPANY.name}</h1>
            <h2 className="mt-1 text-lg font-bold uppercase tracking-widest">{report.title}</h2>
            <p className="text-sm text-gray-500">
              Period: {formatDateLong(report.period.from)} – {formatDateLong(report.period.to)}
            </p>
          </div>

          <hr className="my-5 border-gray-300" />

          {report.sections?.map((s) => (
            <div key={s.title} className="mb-5">
              <h3 className="mb-2 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wide">
                {s.title}
              </h3>
              <dl className="space-y-1 text-sm">
                {s.rows.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex justify-between",
                      r.indent && "pl-4",
                      r.bold && "border-t border-gray-200 pt-1 font-bold"
                    )}
                  >
                    <dt className={r.bold ? "" : "text-gray-600"}>{r.label}</dt>
                    <dd>{peso(r.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {report.table && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    {report.table.headers.map((h) => (
                      <th key={h} className="border border-blue-700 px-2 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.table.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={report.table.headers.length}
                        className="border border-gray-300 px-3 py-6 text-center text-gray-500"
                      >
                        No records within this period.
                      </td>
                    </tr>
                  ) : (
                    report.table.rows.map((row, i) => (
                      <tr key={i} className={i % 2 ? "bg-gray-50" : ""}>
                        {row.map((cell, j) => {
                          const header = report.table!.headers[j];
                          const isMoney = typeof cell === "number" && MONEY_HEADERS.has(header);
                          return (
                            <td
                              key={j}
                              className={cn(
                                "border border-gray-300 px-2 py-1.5",
                                typeof cell === "number" && "text-right"
                              )}
                            >
                              {isMoney ? peso(cell) : String(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {report.totals && (
            <div className="mt-6 ml-auto w-full max-w-sm space-y-1 border-t-2 border-gray-800 pt-3 text-sm">
              {report.totals.map((t) => (
                <div key={t.label} className="flex justify-between font-bold">
                  <span>{t.label}</span>
                  <span>{t.label === "Total Trips" ? t.value : peso(t.value)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
            <p>This is a computer-generated report.</p>
            <p className="mt-1">
              Generated by {COMPANY.appName} on {formatDateLong(new Date())}
            </p>
          </div>
        </div>
      )}

      <Card className="no-print">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-brand-red">
            Saved Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saved.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No saved reports yet. Generate a report and click &quot;Save Report&quot; to keep a
              snapshot here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {saved.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLong(m.periodFrom)} – {formatDateLong(m.periodTo)} · saved{" "}
                      {formatDateLong(m.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="outline" size="sm" onClick={() => openSaved(m)}>
                      <Eye /> View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400"
                      onClick={() => deleteSaved(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
