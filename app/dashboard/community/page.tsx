import { Suspense } from "react";
import CommunityContent from "./CommunityClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error 100%
export const dynamic = "force-dynamic";

export default function CommunityPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CommunityContent />
    </Suspense>
  );
}