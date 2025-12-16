import { Suspense } from "react";
import ForgotPasswordContent from "./ForgotPasswordClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}