import { Suspense } from "react";
import NotificationsContent from "./NotificationsClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <NotificationsContent />
    </Suspense>
  );
}