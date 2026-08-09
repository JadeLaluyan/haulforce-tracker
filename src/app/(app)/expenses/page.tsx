import { Suspense } from "react";
import { ExpensesView } from "@/features/expenses/expenses-view";

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesView />
    </Suspense>
  );
}
