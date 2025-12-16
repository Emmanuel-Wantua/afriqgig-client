"use client";

import { useState, useEffect } from "react";
import { X } from "react-bootstrap-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function HireModal({ 
    freelancer, 
    onClose 
}: { 
    freelancer: any, 
    onClose: () => void 
}) {
    const { t, user, convertPrice } = useLanguage();
    const router = useRouter();
    const [myJobs, setMyJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Fetch all jobs and filter client-side (or use client-specific endpoint)
                const res = await fetch("/api/jobs", { cache: "no-store" });
                const allJobs = await res.json();
                
                // Filter: Created by Me AND Status is Open
                const openJobs = allJobs.filter((j: any) => {
                    const clientId = typeof j.client === 'object' ? j.client._id : j.client;
                    return clientId === user._id && j.status === 'open';
                });
                
                setMyJobs(openJobs);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchJobs();
    }, [user]);

    const sendInvite = async (jobId: string, jobTitle: string) => {
        if (!user || !freelancer) return;

        // TAG: [JOB_INVITE:ID]
        // Note: The message content itself is dynamic user input so we don't translate it here, 
        // but the receiver will see it translated if they use the translate button in chat.
        const inviteMessage = `Hi ${freelancer.name}, I noticed your profile and I think you would be a great fit for my job: "${jobTitle}".\n\n[JOB_INVITE:${jobId}]`;

        try {
            await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender: user._id,
                    receiver: freelancer._id,
                    content: inviteMessage
                })
            });

            onClose();
            router.push(`/dashboard/messages?chatWith=${freelancer._id}`);
            
        } catch (error) {
            alert("Failed to send invitation.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-navy">{t.manage.hire} {freelancer.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">
                        <X className="text-2xl" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">{t.manage.selectJobToInvite}</p>
                    
                    {loading ? (
                        <div className="text-center py-4 text-gray-400">Loading jobs...</div>
                    ) : myJobs.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-xs text-gray-400 mb-2">{t.manage.noOpenJobs}</p>
                            <Link href="/dashboard/client/post-job" className="text-blue-600 font-bold text-sm hover:underline">
                                {t.dashboard.postFirstJob}
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {myJobs.map(job => (
                                <button 
                                    key={job._id}
                                    onClick={() => sendInvite(job._id, job.title)}
                                    className="w-full text-left p-3 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                                >
                                    <h4 className="font-bold text-navy text-sm group-hover:text-blue-700">{job.title}</h4>
                                    <p className="text-xs text-gray-500">{convertPrice(job.budget)} • {job.type || "Fixed Price"}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}