import { Suspense } from "react";
import AdminFeedbackContent from "./AdminFeedbackClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminFeedbackContent />
    </Suspense>
  );
}