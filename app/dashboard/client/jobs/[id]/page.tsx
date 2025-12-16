import { Suspense, use } from "react";
import JobDetailsContent from "./JobDetailsClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React's use() hook (Next.js 15 standard)
  const { id } = use(params);

  return (
    <Suspense fallback={<PageLoader />}>
      <JobDetailsContent id={id} />
    </Suspense>
  );
}