import { Suspense } from "react";
import ContactContent from "./ContactClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ContactContent />
    </Suspense>
  );
}