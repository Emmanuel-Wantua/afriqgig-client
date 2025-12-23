import { Suspense } from "react";
import AnalyticsContent from "./AnalyticsClient";
import PageLoader from "@/components/PageLoader";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics | AfriqGig Admin",
};

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AnalyticsContent />
    </Suspense>
  );
}