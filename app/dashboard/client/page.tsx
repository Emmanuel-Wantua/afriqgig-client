import { Suspense } from "react";
import ClientDashboardContent from "./ClientDashboardClient"; // Import the client component
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ClientDashboardContent />
    </Suspense>
  );
}