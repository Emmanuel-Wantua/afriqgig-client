import { Suspense } from "react";
import FreelancerClient from "./FreelancerClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error 100%
export const dynamic = "force-dynamic";

export default function FreelancerDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FreelancerClient />
    </Suspense>
  );
}