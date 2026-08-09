import { Suspense } from "react";
import { CustomersView } from "@/features/customers/customers-view";

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersView />
    </Suspense>
  );
}
