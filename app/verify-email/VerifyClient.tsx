"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

export default function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token })
                });

                if (res.ok) setStatus('success');
                else setStatus('error');
            } catch (e) {
                setStatus('error');
            }
        };

        verify();
    }, [token]);

    if (status === 'loading') return <PageLoader />;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-navy p-6 font-sans">
            <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
                {status === 'success' ? (
                    <div className="animate-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                            <CheckCircleFill />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
                        <p className="text-gray-500 mb-8">Your account has been successfully active. You can now log in.</p>
                        <Link href="/login" className="block w-full py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors">
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <div className="animate-in zoom-in">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                            <XCircleFill />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                        <p className="text-gray-500 mb-8">The link is invalid or has expired.</p>
                        <Link href="/login" className="block w-full py-3 bg-gray-100 text-navy font-bold rounded-xl hover:bg-gray-200 transition-colors">
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}