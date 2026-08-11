import { Suspense } from "react";
import { HelpersView } from "@/features/helpers/helpers-view";

export default function HelpersPage() {
  return (
    <Suspense>
      <HelpersView />
    </Suspense>
  );
}
