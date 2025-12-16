import { Suspense } from "react";
import AdminDisputesContent from "./AdminDisputesClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function AdminDisputesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminDisputesContent />
    </Suspense>
  );
}