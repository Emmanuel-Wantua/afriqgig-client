import { Suspense } from "react";
import AdminWithdrawalsContent from "./AdminWithdrawalsClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error 100%
export const dynamic = "force-dynamic";

export default function AdminWithdrawalsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminWithdrawalsContent />
    </Suspense>
  );
}