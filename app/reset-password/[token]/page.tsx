import { Suspense, use } from "react";
import ResetPasswordContent from "./ResetPasswordClient";

// ✅ FORCE DYNAMIC: Prevents build errors for this route
export const dynamic = "force-dynamic";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  // Unwrap params using React's use() hook
  const { token } = use(params);

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordContent token={token} />
    </Suspense>
  );
}

