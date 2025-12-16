import { Suspense } from "react";
import FaqContent from "./FaqClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function FAQPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FaqContent />
    </Suspense>
  );
}