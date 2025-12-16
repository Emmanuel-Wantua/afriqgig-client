import { Suspense } from "react";
import RegisterContent from "./SignupClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterContent />
    </Suspense>
  );
}