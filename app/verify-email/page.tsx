import { Suspense } from "react";
import VerifyContent from "./VerifyClient";
import PageLoader from "@/components/PageLoader";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <VerifyContent />
        </Suspense>
    );
}