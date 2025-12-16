import { Suspense } from "react";
import AboutContent from "./AboutClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AboutContent />
    </Suspense>
  );
}