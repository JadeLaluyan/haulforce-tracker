import { Suspense } from "react";
import { PaymentsView } from "@/features/payments/payments-view";

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsView />
    </Suspense>
  );
}
