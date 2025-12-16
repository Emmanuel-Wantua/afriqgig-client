"use client";

import { useState, useEffect } from "react";
import { Briefcase, ChatDots, CheckCircleFill, Eye, Clock, CheckAll, Archive, Search } from "react-bootstrap-icons";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PageLoader from "@/components/PageLoader";

export default function ContractsContent() {
  const { t, convertPrice, user } = useLanguage();
  
  // State
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [allJobs, setAllJobs] = useState<any[]>([]); 
  const [filteredList, setFilteredList] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Debug Counters
  const [counts, setCounts] = useState({ active: 0, completed: 0 });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        console.log("🔍 CONTRACTS: Fetching from API...");
        const res = await fetch("/api/jobs", { cache: "no-store" });
        const data = await res.json();
        
        if(Array.isArray(data) && user) {
            // 1. Filter MY contracts
            const myContracts = data.filter((job: any) => {
                const hiredId = String(job.hiredFreelancer?._id || job.hiredFreelancer);
                return hiredId === String(user._id);
            });

            // 2. Debug Statuses
            let aCount = 0;
            let cCount = 0;

            myContracts.forEach((j: any) => {
                const s = (j.status || "").toLowerCase();
                if (s === 'completed') cCount++;
                else aCount++;
            });

            setCounts({ active: aCount, completed: cCount });
            setAllJobs(myContracts);
        }
      } catch (error) { 
          console.error("❌ CONTRACTS ERROR:", error); 
      } finally { 
          setLoading(false); 
      }
    };
    if (user) fetchJobs();
  }, [user]);

  // --- Filtering Logic ---
  useEffect(() => {
      let result = allJobs;

      // 1. Search Filter
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          result = result.filter(job => 
              (job.title?.toLowerCase() || "").includes(lower) || 
              (job.client?.name?.toLowerCase() || "").includes(lower)
          );
      }

      // 2. Tab Filter
      if (activeTab === "active") {
          result = result.filter(j => (j.status || "").toLowerCase() !== 'completed');
      } else {
          result = result.filter(j => (j.status || "").toLowerCase() === 'completed');
      }

      setFilteredList(result);

  }, [searchTerm, allJobs, activeTab]);


  // --- Reusable Card Component ---
  const ContractCard = ({ job, isCompleted }: { job: any, isCompleted?: boolean }) => (
    <div key={job._id} className={`p-5 rounded-2xl border shadow-sm transition-all relative ${isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-100 ring-1 ring-blue-50 hover:shadow-md'}`}>
        <div className="absolute -top-3 -right-3">
            {isCompleted ? (
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-white">
                    <CheckAll className="text-lg" /> {t.workspace.completed}
                </span>
            ) : (
                <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-white animate-pulse">
                    <CheckCircleFill /> {t.workspace.active}
                </span>
            )}
        </div>

        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className={`font-bold text-lg mb-1 ${isCompleted ? 'text-gray-600' : 'text-navy'}`}>{job.title}</h3>
                <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Briefcase /> {job.client?.name || "Client"}</span>
                    <span className="flex items-center gap-1"><Clock /> {t.workspace.started}: {new Date(job.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <div className={`font-bold text-lg ${isCompleted ? 'text-gray-400' : 'text-green'}`}>
                {convertPrice(job.budget)}
            </div>
            <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex ml-4">
                <Link href={`/dashboard/messages?chatWith=${job.client?._id || job.client}`} className="w-full">
                    <button className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                        <ChatDots className="text-lg" /> {t.manage.chat}
                    </button>
                </Link>
                <Link href={`/dashboard/contracts/${job._id}`} className="w-full">
                    <button className={`w-full px-3 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-colors ${isCompleted ? "bg-gray-200 text-gray-600" : "bg-navy text-white hover:bg-navy-light"}`}>
                        <Eye className="text-lg" /> {t.manage.view}
                    </button>
                </Link>
            </div>
        </div>
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 pb-20">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h1 className="text-2xl font-bold text-navy">{t.manage.myContracts}</h1>
                <p className="text-gray-500 text-sm">{t.manage.manageActive}</p>
            </div>
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder={t.community?.placeholder || "Search..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all"
                />
            </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-fit">
            <button 
                onClick={() => setActiveTab("active")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "active" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"}`}
            >
                {t.workspace.active} ({counts.active})
            </button>
            <button 
                onClick={() => setActiveTab("completed")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "completed" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"}`}
            >
                {t.manage.history} ({counts.completed})
            </button>
        </div>

        {/* --- JOB LIST --- */}
        <div className="space-y-4">
            {loading ? (
                [1,2].map(i => <div key={i} className="bg-white h-32 rounded-2xl animate-pulse shadow-sm"></div>)
            ) : filteredList.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-dashed text-center">
                    {activeTab === "active" ? (
                        <>
                            <Briefcase className="text-4xl mx-auto mb-3 text-gray-200" />
                            <p className="text-gray-400 text-sm">{t.manage.noActiveContracts}</p>
                        </>
                    ) : (
                        <>
                            <Archive className="text-4xl mx-auto mb-3 text-gray-200" />
                            <p className="text-gray-400 text-sm">{t.manage.noHistory}</p>
                        </>
                    )}
                </div>
            ) : (
                filteredList.map(job => (
                    <ContractCard key={job._id} job={job} isCompleted={activeTab === "completed"} />
                ))
            )}
        </div>

    </div>
  );
}