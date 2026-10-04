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

interface PayrollTrip {
  id: string;
  date: string;
  origin: string;
  destination: string;
  driverFee: string;
  helperFee: string;
}

interface PayrollDetail {
  id: string;
  payrollNo: string;
  periodStart: string;
  periodEnd: string;
  totalTrips: number;
  totalEarnings: string;
  advanceDeduction: string;
  netPay: string;
  createdAt: string;
  driver: { id: string; name: string; contact: string | null } | null;
  helper: { id: string; name: string; contact: string | null } | null;
  trips: PayrollTrip[];
}

export function PayrollInvoiceView({ payrollId }: { payrollId: string }) {
  const router = useRouter();
  const [payroll, setPayroll] = useState<PayrollDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: PayrollDetail }>(`/api/payroll/${payrollId}`);
      setPayroll(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load payroll invoice");
    } finally {
      setLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="font-medium">Payroll invoice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/payroll")}>
          <ArrowLeft /> Back to Payroll
        </Button>
      </div>
    );
  }

  const payee = payroll.driver ?? payroll.helper!;
  const isHelper = !!payroll.helper;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/payroll")}>
          <ArrowLeft /> Back
        </Button>
        <Button variant="destructive" size="sm" onClick={() => window.print()}>
          <Printer /> Print
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Download /> Download PDF
        </Button>
      </div>

      <div className="print-area rounded-lg bg-white p-8 text-gray-900 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">{COMPANY.name}</h1>
          <p className="text-sm text-gray-600">{COMPANY.address}</p>
          <p className="text-sm text-gray-600">TIN: {COMPANY.tin}</p>
          <h2 className="mt-4 text-lg font-bold uppercase tracking-widest">Payroll Invoice</h2>
        </div>

        <hr className="my-5 border-gray-300" />

        <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-gray-500">Invoice Date:</dt>
            <dd className="font-medium">{formatDateLong(payroll.createdAt)}</dd>
          </div>
          <div className="flex gap-2 sm:justify-end">
            <dt className="text-gray-500">Invoice Number:</dt>
            <dd className="font-semibold">{payroll.payrollNo}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500">{isHelper ? "Helper Name:" : "Driver Name:"}</dt>
            <dd className="font-semibold">{payee.name}</dd>
          </div>
          <div className="flex gap-2 sm:justify-end">
            <dt className="text-gray-500">Period:</dt>
            <dd className="font-medium">
              {formatDateLong(payroll.periodStart)} – {formatDateLong(payroll.periodEnd)}
            </dd>
          </div>
        </dl>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="border border-blue-700 px-3 py-2 text-left">Date</th>
              <th className="border border-blue-700 px-3 py-2 text-left">Route</th>
              <th className="border border-blue-700 px-3 py-2 text-right">
                {isHelper ? "Helper Fee" : "Driver Fee"}
              </th>
              <th className="border border-blue-700 px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payroll.trips.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                  No trips recorded within this period.
                </td>
              </tr>
            ) : (
              payroll.trips.map((t) => {
                const fee = isHelper ? Number(t.helperFee) : Number(t.driverFee);
                const amount = fee;
                return (
                  <tr key={t.id}>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(t.date).toLocaleDateString("en-PH")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {t.origin} - {t.destination}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{peso(fee)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                      {peso(amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
          <p className="text-gray-600">Total Trips: {payroll.totalTrips}</p>
          <div className="flex justify-between">
            <span className="text-gray-600">Gross Earnings</span>
            <span className="font-medium">{peso(payroll.totalEarnings)}</span>
          </div>
          {Number(payroll.advanceDeduction) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Cash Advance Deduction</span>
              <span className="font-medium">-{peso(payroll.advanceDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 pt-1 text-lg font-extrabold">
            <span>Net Pay</span>
            <span>{peso(payroll.netPay)}</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <div className="mx-auto w-48 border-t border-gray-400 pt-1">Prepared By</div>
          </div>
          <div>
            <div className="mx-auto w-48 border-t border-gray-400 pt-1">
              Received By: {payee.name}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          <p>This is a computer-generated document. Thank you for your service!</p>
          <p className="mt-1">
            Generated by {COMPANY.appName} on {formatDateLong(new Date())}
          </p>
        </div>
      </div>
    </div>
  );
}
