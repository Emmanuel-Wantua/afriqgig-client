"use client";

import { useEffect, useState, useRef } from "react"; // Added useRef
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircleFill, XCircleFill, } from "react-bootstrap-icons";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

export default function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    
    // Track if we have already attempted verification (Fixes double-call/expired bug)
    const verificationAttempted = useRef(false);
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        // FIX: Prevent double execution
        if (verificationAttempted.current) return;
        verificationAttempted.current = true;

        const verify = async () => {
            try {
                const res = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token })
                });

                if (res.ok) {
                    setStatus('success');
                    // FIX: Auto-redirect to Login after 2 seconds
                    setTimeout(() => {
                        router.push("/login?verified=true"); 
                    }, 2000);
                } else {
                    setStatus('error');
                }
            } catch (e) {
                setStatus('error');
            }
        };

        verify();
    }, [token, router]);

    if (status === 'loading') return <PageLoader />;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-navy p-6 font-sans">
            <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full animate-in zoom-in">
                {status === 'success' ? (
                    <>
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                            <CheckCircleFill />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verified!</h1>
                        <p className="text-gray-500 mb-6">Redirecting you to login...</p>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy"></div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                            <XCircleFill />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Link Expired or Invalid</h1>
                        <p className="text-gray-500 mb-8">
                            This link may have already been used. <br/> Try logging in directly.
                        </p>
                        <Link href="/login" className="block w-full py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors">
                            Go to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}