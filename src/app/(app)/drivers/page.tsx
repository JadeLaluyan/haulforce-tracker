import { Suspense } from "react";
import { DriversView } from "@/features/drivers/drivers-view";

export default function DriversPage() {
  return (
    <Suspense>
      <DriversView />
    </Suspense>
  );
}
