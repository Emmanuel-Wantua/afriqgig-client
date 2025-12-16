import { Suspense } from "react";
import SettingsContent from "./SettingsClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SettingsContent />
    </Suspense>
  );
}