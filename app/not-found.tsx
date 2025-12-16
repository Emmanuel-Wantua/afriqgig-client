import { Suspense } from "react";
import NotFoundContent from "./NotFoundClient";

// ✅ FORCE DYNAMIC: Fixes the build error for the 404 page
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}