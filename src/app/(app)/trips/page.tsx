import { Suspense } from "react";
import { TripsView } from "@/features/trips/trips-view";

export default function TripsPage() {
  return (
    <Suspense>
      <TripsView />
    </Suspense>
  );
}
