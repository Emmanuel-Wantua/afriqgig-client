import { Suspense } from "react";
import ProfileContent from "./ProfileClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This prevents the "missing-suspense" build error
export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProfileContent />
    </Suspense>
  );
}