import { Suspense, use } from "react";
import ProfileContent from "./ProfileClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React's use() hook
  const { id } = use(params);

  return (
    <Suspense fallback={<PageLoader />}>
      <ProfileContent id={id} />
    </Suspense>
  );
}