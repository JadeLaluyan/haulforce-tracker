import { Suspense } from "react";
import { PayrollView } from "@/features/payroll/payroll-view";

export default function PayrollPage() {
  return (
    <Suspense>
      <PayrollView />
    </Suspense>
  );
}
