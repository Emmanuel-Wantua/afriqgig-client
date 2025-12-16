import { Suspense, use } from "react";
import ContractClient from "./ContractClient";
import PageLoader from "@/components/PageLoader";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React's use() hook (Next.js 15 standard)
  const { id } = use(params);

  return (
    <Suspense fallback={<PageLoader />}>
      <ContractClient id={id} />
    </Suspense>
  );
}