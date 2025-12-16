import { Suspense } from "react";
import LandingContent from "./LandingClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LandingContent />
    </Suspense>
  );
}