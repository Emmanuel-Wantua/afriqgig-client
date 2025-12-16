import { Suspense } from "react";
import ContractsContent from "./ContractsClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error
export const dynamic = "force-dynamic";

export default function ContractsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ContractsContent />
    </Suspense>
  );
}