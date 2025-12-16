import { Suspense } from "react";
import FindTalentContent from "./FindTalentClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function FindTalentPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FindTalentContent />
    </Suspense>
  );
}