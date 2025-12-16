import { Suspense } from "react";
import PostJobContent from "./PostJobClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This prevents the build error
export const dynamic = "force-dynamic";

export default function PostJobPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PostJobContent />
    </Suspense>
  );
}