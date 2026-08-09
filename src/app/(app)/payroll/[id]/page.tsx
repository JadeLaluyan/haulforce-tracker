import { PayrollInvoiceView } from "@/features/payroll/payroll-invoice-view";

export default async function PayrollInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PayrollInvoiceView payrollId={id} />;
}
