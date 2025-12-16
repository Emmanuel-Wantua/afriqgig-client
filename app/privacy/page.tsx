import { Suspense } from "react";
import PrivacyContent from "./PrivacyClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PrivacyContent />
    </Suspense>
  );
}