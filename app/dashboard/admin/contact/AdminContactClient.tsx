"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, EnvelopeOpen, Clock, Person } from "react-bootstrap-icons";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";
import { useLanguage } from "@/context/LanguageContext"; // Import Context

export default function AdminContactContent() {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/contact")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMessages(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6">
            <div>
                <Link href="/dashboard/admin" className="text-gray-400 hover:text-navy text-sm font-bold flex items-center gap-2 mb-4">
                    <ArrowLeft /> {t.admin.backToDashboard}
                </Link>
                <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                    <EnvelopeOpen className="text-gold" /> {t.admin.contactMessages}
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs">{messages.length}</span>
                </h1>
            </div>

            <div className="grid gap-4">
                {messages.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        {t.admin.noMessages}
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"><Person /></div>
                                    <div>
                                        <h4 className="font-bold text-navy text-sm">{msg.name}</h4>
                                        <a href={`mailto:${msg.email}`} className="text-xs text-blue-600 hover:underline">{msg.email}</a>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock /> {new Date(msg.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">{msg.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}