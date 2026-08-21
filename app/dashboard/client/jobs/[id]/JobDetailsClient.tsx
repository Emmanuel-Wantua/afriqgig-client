"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, PersonCircle, CheckCircleFill, ChatDots, Briefcase,
    X, ExclamationCircleFill, Wallet2, Clock
} from "react-bootstrap-icons";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import UserBadge from "@/components/UserBadge";
import PageLoader from "@/components/PageLoader";
import ProposalContent from "@/components/ProposalContent"; 

export default function JobDetailsContent({ id }: { id: string }) {
  const { t, convertPrice } = useLanguage();
  const router = useRouter();
  
  const [job, setJob] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showHireModal, setShowHireModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundErrorDetails, setFundErrorDetails] = useState({ required: 0, available: 0 });
  
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [hiringStatus, setHiringStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resJobs = await fetch("/api/jobs", { cache: "no-store" });
        const allJobs = await resJobs.json();
        const foundJob = allJobs.find((j: any) => j._id === id);
        setJob(foundJob);

        const resProposals = await fetch(`/api/proposals/job/${id}`, { cache: "no-store" });
        const foundProposals = await resProposals.json();
        setProposals(foundProposals);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const initiateHire = (proposal: any) => {
    setSelectedProposal(proposal);
    setHiringStatus("idle");
    setShowHireModal(true);
  };

  const confirmHire = async () => {
    if (!selectedProposal) return;
    setHiringStatus("loading");

    try {
        const walletRes = await fetch(`/api/wallet?userId=${job.client._id}`, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' } 
        });
        const walletData = await walletRes.json();
        
        const availableBalance = Number(walletData.balance?.available || 0);
        const contractAmount = Number(selectedProposal.bidAmount);

        if (availableBalance < contractAmount) {
            setHiringStatus("idle");
            setFundErrorDetails({ required: contractAmount, available: availableBalance });
            setShowHireModal(false);
            setShowFundModal(true);
            return;
        }

        // The server re-derives the price from the proposal and funds escrow
        // itself, so it only needs to know which job and which proposal.
        const res = await fetch("/api/contracts/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobId: job._id,
                proposalId: selectedProposal._id
            }),
        });

        // 402 is the server's authoritative "not enough funds" — the balance
        // check above is only a UX shortcut and can be out of date.
        if (res.status === 402) {
            setHiringStatus("idle");
            setFundErrorDetails({ required: contractAmount, available: availableBalance });
            setShowHireModal(false);
            setShowFundModal(true);
            return;
        }

        if (!res.ok) throw new Error("Failed to hire");

        setHiringStatus("success");
        setTimeout(() => {
            router.push("/dashboard/client/jobs");
        }, 2000);

    } catch (error) {
        console.error(error);
        setHiringStatus("error");
    }
  };

  if (loading) return <PageLoader />;
  if (!job) return <div className="p-10 text-center text-red-500">{t.manage.jobNotFound}</div>;

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div>
        <Link href="/dashboard/client/jobs" className="text-gray-400 hover:text-navy text-sm font-bold flex items-center gap-2 mb-4">
            <ArrowLeft /> {t.manage.back}
        </Link>
        
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-navy">{job.title}</h1>
                <div className="flex gap-4 text-sm mt-2 text-gray-500">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{job.category}</span>
                    <span>{t.manage.posted}: {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {job.status}
            </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-lg text-navy flex items-center gap-2">
                <Briefcase /> {t.manage.applicants} 
                <span className="bg-navy text-white text-xs px-2 py-0.5 rounded-full">{proposals.length}</span>
            </h2>
        </div>

        <div className="divide-y divide-gray-100">
            {proposals.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <PersonCircle className="text-4xl mb-3 opacity-20" />
                    <p>{t.manage.noApplications}</p>
                </div>
            ) : (
                proposals.map((prop) => (
                    <div key={prop._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-500 overflow-hidden">
                                    {prop.freelancer?.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={prop.freelancer.avatar} className="w-full h-full object-cover" alt="User" />
                                    ) : <PersonCircle />}
                                </div>
                                <div>
                                    <div className="mb-1">
                                        {prop.freelancer ? (
                                            <UserBadge user={prop.freelancer} showRating={true} />
                                        ) : (
                                            <span className="font-bold text-navy">{t.manage.unknownFreelancer}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {prop.freelancer?.skills?.[0] || "Freelancer"}
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-1">
                                        <p className="text-green-600 font-bold text-sm">
                                            {t.manage.bid}: {convertPrice(prop.bidAmount)}
                                        </p>
                                        
                                        {/* DURATION BADGE */}
                                        {prop.duration && (
                                            <p className="text-gray-500 text-sm font-medium flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                                                <Clock className="text-xs" /> {prop.duration}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {job.status === 'open' && (
                                <div className="flex items-center gap-2">
                                    <Link href={`/dashboard/messages?chatWith=${prop.freelancer?._id}`} className="p-2 text-gray-400 hover:text-navy border border-gray-200 rounded-lg transition-colors">
                                        <ChatDots className="text-xl" />
                                    </Link>
                                    <button 
                                        onClick={() => initiateHire(prop)}
                                        className="bg-navy hover:bg-navy-light text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md"
                                    >
                                        <CheckCircleFill /> {t.manage.hire}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* --- USE NEW COMPONENT HERE --- */}
                        <div className="mt-4 bg-blue-50/50 p-4 rounded-xl text-sm border border-blue-100">
                            <p className="font-bold text-[10px] text-navy mb-2 uppercase tracking-wider">{t.manage.cover}</p>
                            <ProposalContent text={prop.coverLetter || ""} />
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* --- HIRE CONFIRMATION MODAL --- */}
      {showHireModal && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                {hiringStatus === "success" ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">
                            <CheckCircleFill />
                        </div>
                        <h3 className="text-xl font-bold text-navy mb-2">{t.manage.hiredSuccess}</h3>
                        <p className="text-sm text-gray-500">{t.manage.redirecting}</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-navy">{t.manage.confirmHiring}</h3>
                            <button onClick={() => setShowHireModal(false)} className="text-gray-400 hover:text-red-500">
                                <X className="text-2xl" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gray-100 mx-auto rounded-full flex items-center justify-center text-3xl text-gray-400 mb-3 overflow-hidden border border-gray-200">
                                    {selectedProposal.freelancer?.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={selectedProposal.freelancer.avatar} className="w-full h-full object-cover" />
                                    ) : <PersonCircle />}
                                </div>
                                <p className="text-sm text-gray-500 mb-1">{t.manage.aboutToHire}</p>
                                <div className="flex justify-center">
                                    <UserBadge user={selectedProposal.freelancer} showRating={true} />
                                </div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center text-sm border border-blue-100">
                                <span className="text-blue-800 font-medium">{t.manage.contractAmount}</span>
                                <span className="font-bold text-navy text-lg">
                                    {convertPrice(selectedProposal.bidAmount)}
                                </span>
                            </div>
                            {hiringStatus === "error" && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                                    <ExclamationCircleFill /> {t.manage.hireError}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowHireModal(false)} className="flex-1 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors">{t.proposal.cancel}</button>
                            <button onClick={confirmHire} disabled={hiringStatus === "loading"} className="flex-1 py-2.5 bg-navy text-white font-bold text-sm rounded-xl hover:bg-navy-light transition-colors shadow-lg disabled:opacity-70">
                                {hiringStatus === "loading" ? t.manage.processing : t.manage.confirmHire}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

      {/* --- INSUFFICIENT FUNDS MODAL --- */}
      {showFundModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
                      <Wallet2 />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">{t.manage.insufficientFunds}</h3>
                  <p className="text-sm text-gray-500 mb-6">
                      {t.manage.fundErrorStart} <strong>{convertPrice(fundErrorDetails.required)}</strong> {t.manage.fundErrorMiddle} <span className="text-red-500 font-bold">{convertPrice(fundErrorDetails.available)}</span> {t.manage.fundErrorEnd}
                  </p>
                  
                  <div className="flex gap-3">
                      <button onClick={() => setShowFundModal(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors">
                          {t.proposal.cancel}
                      </button>
                      <button onClick={() => router.push("/dashboard/wallet")} className="flex-1 py-3 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold-light shadow-lg transition-colors">
                          {t.manage.depositFunds}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}