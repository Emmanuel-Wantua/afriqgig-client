"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const refCode = searchParams.get("ref");
        if (refCode) {
            // Save to LocalStorage to use during Signup
            localStorage.setItem("afriq_referral_code", refCode);
            console.log("Referral Code Captured:", refCode);
        }
    }, [searchParams]);

    return null; // Invisible component
}