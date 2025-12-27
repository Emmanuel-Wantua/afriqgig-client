import { Suspense } from "react";
import FinanceContent from "./FinanceClient";
import PageLoader from "@/components/PageLoader";

export const dynamic = "force-dynamic"; // ✅ Required for build

export const metadata = {
  title: "Financials | AfriqGig Admin",
};

export default function FinancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FinanceContent />
    </Suspense>
  );
}