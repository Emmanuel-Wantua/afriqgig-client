import { Suspense } from "react";
import WalletContent from "./WalletClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: This solves the build error 100%
export const dynamic = "force-dynamic";

export default function WalletPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <WalletContent />
    </Suspense>
  );
}