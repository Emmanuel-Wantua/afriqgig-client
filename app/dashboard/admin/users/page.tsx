import { Suspense } from "react";
import AdminUsersContent from "./AdminUsersClient"; // Import the client component
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminUsersContent />
    </Suspense>
  );
}