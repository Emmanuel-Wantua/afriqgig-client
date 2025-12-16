import { Suspense } from "react";
import MessagesContent from "./MessagesClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MessagesContent />
    </Suspense>
  );
}