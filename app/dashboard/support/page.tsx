import { Suspense } from "react";
import SupportContent from "./SupportClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function HelpPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SupportContent />
    </Suspense>
  );
}