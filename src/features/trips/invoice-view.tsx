"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { peso, formatDateLong } from "@/lib/format";
import { COMPANY } from "@/lib/config";
import type { TripDTO } from "@/types";

interface FullTrip extends TripDTO {
  driver: { id: string; name: string; contact?: string | null };
  helper: { id: string; name: string; contact?: string | null } | null;
  customer: {
    id: string;
    name: string;
    company: string | null;
    address?: string | null;
    contact?: string | null;
    tin?: string | null;
  };
  invoice: {
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    paymentTerms: string;
    vatRate: string;
    subtotal: string;
    vatAmount: string;
    total: string;
  } | null;
}

export function InvoiceView({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<FullTrip | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: FullTrip }>(`/api/trips/${tripId}`);
      setTrip(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!trip || !trip.invoice) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="font-medium">Invoice not found</p>
        <p className="mb-4 text-sm text-muted-foreground">
          This trip has no BIR invoice attached.
        </p>
        <Button variant="outline" onClick={() => router.push("/trips")}>
          <ArrowLeft /> Back to Trips
        </Button>
      </div>
    );
  }

  const inv = trip.invoice;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/trips")}>
          <ArrowLeft /> Back
        </Button>
        <Button variant="destructive" size="sm" onClick={() => window.print()}>
          <Printer /> Print
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Download /> Download PDF
        </Button>
        <span className="text-xs text-muted-foreground">
          Tip: choose &quot;Save as PDF&quot; in the print dialog to download.
        </span>
      </div>

      <div className="print-area rounded-lg bg-white p-8 text-gray-900 shadow-xl">
        {/* Letterhead */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">{COMPANY.name}</h1>
          <p className="text-sm text-gray-600">{COMPANY.address}</p>
          <p className="text-sm text-gray-600">TIN: {COMPANY.tin} · {COMPANY.contact}</p>
          <h2 className="mt-4 text-lg font-bold uppercase tracking-widest">
            Official Receipt / Invoice
          </h2>
          <p className="text-xs text-gray-500">BIR-Compliant Format</p>
        </div>

        <hr className="my-5 border-gray-300" />

        {/* Bill To / Invoice details */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              Bill To
            </h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Customer:</dt>
                <dd className="font-medium">{trip.customer.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Company:</dt>
                <dd className="font-medium">{trip.customer.company ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Address:</dt>
                <dd className="font-medium">{trip.customer.address ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Contact:</dt>
                <dd className="font-medium">{trip.customer.contact ?? "-"}</dd>
              </div>
              {trip.customer.tin && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">TIN:</dt>
                  <dd className="font-medium">{trip.customer.tin}</dd>
                </div>
              )}
            </dl>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              Invoice Details
            </h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Invoice #:</dt>
                <dd className="font-semibold">{inv.invoiceNo}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Invoice Date:</dt>
                <dd className="font-medium">{formatDateLong(inv.invoiceDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Trip Date:</dt>
                <dd className="font-medium">{formatDateLong(trip.date)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Payment Terms:</dt>
                <dd className="font-medium">{inv.paymentTerms}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Service details */}
        <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-gray-500">
          Service Details
        </h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="border border-blue-700 px-3 py-2 text-left">Description</th>
              <th className="border border-blue-700 px-3 py-2 text-left">Route</th>
              <th className="border border-blue-700 px-3 py-2 text-right">Weight (kg)</th>
              <th className="border border-blue-700 px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2">
                Hauling Services - {trip.cargoType}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {trip.origin} → {trip.destination}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                {Number(trip.weightKg).toLocaleString()}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                {peso(inv.subtotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Sub-total (VATable):</span>
            <span className="font-medium">{peso(inv.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">VAT ({Number(inv.vatRate)}%):</span>
            <span className="font-medium">{peso(inv.vatAmount)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-gray-800 pt-2 text-base font-extrabold">
            <span>TOTAL AMOUNT DUE:</span>
            <span>{peso(inv.total)}</span>
          </div>
        </div>

        {/* Additional info */}
        <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-gray-500">
          Additional Information
        </h3>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-gray-500">Payment Status: </span>
            <span className="font-semibold">
              {trip.paymentStatus === "PAID"
                ? "Paid"
                : trip.paymentStatus === "PARTIAL"
                  ? "Partially Paid"
                  : "Pending"}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Trip Status: </span>
            <span className="font-semibold">
              {trip.status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </p>
          <p className="sm:col-span-2">
            <span className="text-gray-500">Notes: </span>
            <span className="font-medium">{trip.notes || "-"}</span>
          </p>
          <p>
            <span className="text-gray-500">Driver: </span>
            <span className="font-medium">{trip.driver.name}</span>
          </p>
          {trip.helper && (
            <p>
              <span className="text-gray-500">Helper: </span>
              <span className="font-medium">{trip.helper.name}</span>
            </p>
          )}
        </div>

        <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          <p className="font-semibold">THIS IS AN OFFICIAL RECEIPT</p>
          <p>This document is valid for claiming input tax. Keep this receipt for your records.</p>
          <p className="mt-1">
            Generated by {COMPANY.appName} on {formatDateLong(new Date())}
          </p>
        </div>
      </div>
    </div>
  );
}
