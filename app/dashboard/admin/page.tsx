import { Suspense } from "react";
import AdminDashboardContent from "./AdminClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error 100%
export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminDashboardContent />
    </Suspense>
  );
}