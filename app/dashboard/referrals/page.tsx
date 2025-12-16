import { Suspense } from "react";
import ReferralContent from "./ReferralClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function ReferralPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ReferralContent />
    </Suspense>
  );
}