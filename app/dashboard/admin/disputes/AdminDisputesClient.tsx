"use client";

import { useState, useEffect } from "react";
import { 
    CheckCircleFill, XCircleFill, PersonCircle, ArrowLeft, 
    Envelope, Telephone, ExclamationTriangleFill, ShieldCheck
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

export default function AdminDisputesContent() {
  const { convertPrice, user } = useLanguage();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // --- MODAL STATES ---
  const [confirmAction, setConfirmAction] = useState<{ id: string, type: "refund_client" | "release_freelancer" } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error", message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
      try {
          const res = await fetch("/api/admin/disputes/list"); 
          const data = await res.json();
          if(Array.isArray(data)) setDisputes(data);
      } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleExecuteResolution = async () => {
      if (!confirmAction || !user) return;
      setIsProcessing(true);

      try {
          const res = await fetch("/api/admin/disputes/resolve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                  disputeId: confirmAction.id, 
                  resolution: confirmAction.type, 
                  adminId: user._id 
              })
          });

          const data = await res.json(); // Parse response

          if (res.ok) {
              setFeedback({ type: "success", message: "Dispute resolved successfully." });
              fetchDisputes(); // Refresh list
          } else {
              // Show the ACTUAL error message from backend
              setFeedback({ type: "error", message: data.message || "Failed to resolve dispute." });
          }
      } catch (error) {
          setFeedback({ type: "error", message: "Network error occurred." });
      } finally {
          setIsProcessing(false);
          setConfirmAction(null); // Close confirm modal
      }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Cases...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-gray-400 hover:text-navy"><ArrowLeft /></Link>
            <h1 className="text-2xl font-bold text-navy">Dispute Resolution Center</h1>
        </div>

        {disputes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed text-gray-400">
                No active disputes. All good!
            </div>
        ) : (
            disputes.map(dispute => (
                <div key={dispute._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded uppercase">{dispute.reason.replace("_", " ")}</span>
                            <span className="text-xs text-gray-500">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm font-bold text-navy">
                            Disputed Amount: {convertPrice(dispute.contract?.amount || 0)}
                        </div>
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-8">
                        {/* LEFT: Case Details */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">The Case</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl mb-4 italic">
                                "{dispute.description}"
                            </p>
                            
                            {dispute.evidence?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-navy mb-2">Evidence:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {dispute.evidence.map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 block hover:opacity-80">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Parties & Action */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">The Parties</h4>
                            
                            {/* Initiator */}
                            <div className="p-3 border border-red-100 bg-red-50/30 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <PersonCircle className="text-red-400 text-xl" />
                                    <div>
                                        <p className="text-xs font-bold text-navy">Initiator (Complainer)</p>
                                        <p className="text-sm font-medium text-navy">{dispute.initiator?.name}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-xs text-gray-500 pl-8">
                                    <div className="flex items-center gap-1"><Envelope/> {dispute.initiator?.email}</div>
                                    {dispute.initiator?.phone && <div className="flex items-center gap-1"><Telephone/> {dispute.initiator.phone}</div>}
                                </div>
                            </div>

                            {/* Opponent */}
                            <div className="p-3 border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <PersonCircle className="text-gray-400 text-xl" />
                                    <div>
                                        <p className="text-xs font-bold text-navy">Opponent</p>
                                        <p className="text-sm font-medium text-navy">{dispute.opponent?.name}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-xs text-gray-500 pl-8">
                                    <div className="flex items-center gap-1"><Envelope/> {dispute.opponent?.email}</div>
                                    {dispute.opponent?.phone && <div className="flex items-center gap-1"><Telephone/> {dispute.opponent.phone}</div>}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setConfirmAction({ id: dispute._id, type: "refund_client" })}
                                    className="py-3 bg-white border border-red-200 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <XCircleFill /> Refund Client
                                </button>
                                <button 
                                    onClick={() => setConfirmAction({ id: dispute._id, type: "release_freelancer" })}
                                    className="py-3 bg-navy text-white font-bold text-xs rounded-xl hover:bg-navy-light flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <CheckCircleFill /> Pay Freelancer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}

        {/* --- CONFIRMATION MODAL --- */}
        {confirmAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl ${confirmAction.type === 'refund_client' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <ExclamationTriangleFill />
                    </div>
                    
                    <h3 className="text-lg font-bold text-navy mb-2">
                        {confirmAction.type === 'refund_client' ? "Refund Client?" : "Release to Freelancer?"}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-6">
                        Are you sure you want to proceed? This action will immediately move the funds and <strong>cannot be undone</strong>.
                    </p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setConfirmAction(null)} 
                            className="flex-1 py-2 text-gray-500 font-bold bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleExecuteResolution} 
                            disabled={isProcessing}
                            className={`flex-1 py-2 text-white font-bold rounded-lg shadow-lg ${confirmAction.type === 'refund_client' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isProcessing ? "Processing..." : "Confirm"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- FEEDBACK MODAL --- */}
        {feedback && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in zoom-in">
                <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {feedback.type === 'success' ? <ShieldCheck /> : <ExclamationTriangleFill />}
                    </div>
                    <h3 className="font-bold text-navy mb-1">{feedback.type === 'success' ? 'Success' : 'Error'}</h3>
                    <p className="text-sm text-gray-500 mb-6">{feedback.message}</p>
                    <button 
                        onClick={() => setFeedback(null)} 
                        className="w-full py-2 bg-gray-100 text-navy font-bold rounded-lg hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}

    </div>
  );
}