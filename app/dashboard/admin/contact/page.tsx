import { Suspense } from "react";
import AdminContactContent from "./AdminContactClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function AdminContactMessagesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminContactContent />
    </Suspense>
  );
}