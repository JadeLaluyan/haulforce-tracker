import { Suspense } from "react";
import { ReportsView } from "@/features/reports/reports-view";

export default function ReportsPage() {
  return (
    <Suspense>
      <ReportsView />
    </Suspense>
  );
}
