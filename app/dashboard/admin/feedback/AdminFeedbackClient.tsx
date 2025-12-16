"use client";

import { useState, useEffect } from "react";
import { ChatQuote, PersonCircle, Calendar3, ArrowLeft } from "react-bootstrap-icons";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

export default function AdminFeedbackContent() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await fetch("/api/feedback");
                const data = await res.json();
                if (Array.isArray(data)) setFeedbacks(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-6">
            
            {/* Header */}
            <div>
                <Link href="/dashboard/admin" className="text-gray-400 hover:text-navy text-sm font-bold flex items-center gap-2 mb-4">
                    <ArrowLeft /> Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                    <ChatQuote className="text-gold" /> User Feedback
                    <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{feedbacks.length}</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">Suggestions and bug reports from the landing page.</p>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {feedbacks.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        No feedback received yet.
                    </div>
                ) : (
                    feedbacks.map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                        {item.user?.avatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.user.avatar} className="w-full h-full object-cover rounded-full"/>
                                        ) : <PersonCircle className="text-2xl" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-navy text-sm">
                                            {item.user ? item.user.name : "Anonymous Visitor"}
                                        </h4>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar3 /> {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {item.user && (
                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                        {item.user.role}
                                    </span>
                                )}
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-gray-100">
                                "{item.content}"
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}