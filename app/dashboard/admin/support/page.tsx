import { Suspense } from "react";
import AdminSupportContent from "./AdminSupportClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error 100%
export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminSupportContent />
    </Suspense>
  );
}