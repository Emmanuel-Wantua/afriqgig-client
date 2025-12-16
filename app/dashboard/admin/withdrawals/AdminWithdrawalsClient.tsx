"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircleFill, XCircleFill, CashCoin, PersonCircle, X, ExclamationTriangle } from "react-bootstrap-icons";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PageLoader from "@/components/PageLoader";

export default function AdminWithdrawalsContent() {
    const { convertPrice } = useLanguage();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Feedback State
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'approve' | 'reject' } | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/admin/transactions");
            const data = await res.json();
            if (Array.isArray(data)) setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async () => {
        if (!confirmAction) return;
        
        const { id, type } = confirmAction;
        setProcessingId(id);
        setConfirmAction(null); // Close confirm modal

        try {
            const res = await fetch("/api/admin/transactions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    transactionId: id, 
                    action: type,
                    reason: type === 'reject' ? "Invalid details provided" : undefined
                })
            });

            if (res.ok) {
                setRequests(prev => prev.filter(r => r._id !== id));
                setFeedback({ type: 'success', message: `Withdrawal ${type}d successfully.` });
            } else {
                setFeedback({ type: 'error', message: "Action failed. Please try again." });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: "Connection error. Check your internet." });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6 relative">
            
            {/* Header */}
            <div>
                <Link href="/dashboard/admin" className="text-gray-400 hover:text-navy text-sm font-bold flex items-center gap-2 mb-4">
                    <ArrowLeft /> Back to Dashboard
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                            <CashCoin className="text-gold" /> Withdrawal Requests
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Review and process payouts.</p>
                    </div>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                        {requests.length} Pending
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        No pending withdrawals.
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                            
                            {/* User Info */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden">
                                    {req.user?.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={req.user.avatar} className="w-full h-full object-cover" alt="User" />
                                    ) : <PersonCircle className="text-3xl" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-navy">{req.user?.name || "Unknown User"}</h4>
                                    <p className="text-xs text-gray-500">{req.user?.email}</p>
                                    <p className="text-xs text-blue-600 font-mono mt-1 bg-blue-50 inline-block px-2 rounded">
                                        {new Date(req.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="text-center md:text-left w-full md:w-auto flex-1 md:pl-10">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-medium text-navy">{req.description}</p>
                                <p className="text-xs text-gray-500 mt-1 font-mono">{req.paymentMethod}</p>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-navy">{convertPrice(req.amount)}</span>
                                    <span className="text-[10px] text-orange-500 font-bold uppercase bg-orange-50 px-2 rounded">Pending</span>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setConfirmAction({ id: req._id, type: 'reject' })}
                                        disabled={!!processingId}
                                        className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                        title="Reject"
                                    >
                                        <XCircleFill className="text-xl" />
                                    </button>
                                    <button 
                                        onClick={() => setConfirmAction({ id: req._id, type: 'approve' })}
                                        disabled={!!processingId}
                                        className="p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                                        title="Approve (Mark Sent)"
                                    >
                                        <CheckCircleFill className="text-xl" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- CONFIRMATION MODAL --- */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 bg-gray-100 text-navy`}>
                            <ExclamationTriangle />
                        </div>
                        <h3 className="text-xl font-bold text-navy mb-2">Are you sure?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Do you want to <strong className="uppercase">{confirmAction.type}</strong> this withdrawal request?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeAction}
                                className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors ${confirmAction.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                Yes, {confirmAction.type}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FEEDBACK MODAL --- */}
            {feedback && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {feedback.type === 'success' ? <CheckCircleFill /> : <XCircleFill />}
                        </div>
                        <h3 className="text-xl font-bold text-navy mb-2">
                            {feedback.type === 'success' ? 'Success!' : 'Error'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">{feedback.message}</p>
                        <button 
                            onClick={() => setFeedback(null)}
                            className="w-full py-3 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}