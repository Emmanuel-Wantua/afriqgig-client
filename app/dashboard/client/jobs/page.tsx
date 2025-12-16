import { Suspense } from "react";
import ClientJobsContent from "./ClientJobsClient"; // Import the client component
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function ClientJobsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ClientJobsContent />
    </Suspense>
  );
}