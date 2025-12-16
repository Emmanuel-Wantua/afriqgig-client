"use client";

import { useState, useEffect } from "react";
import { PlusLg, Briefcase, People, Wallet2, Clock, ChevronRight, Eye, Search } from "react-bootstrap-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import PageLoader from "@/components/PageLoader";

export default function ClientDashboardContent() {
    const { t, convertPrice, user } = useLanguage();
    // Access dashboard translations safely
    const dashboard = (t as any).dashboard || {}; 
    const router = useRouter();
  
  // Stats & Data State
  const [stats, setStats] = useState({
      activeJobs: 0,
      totalSpent: 0,
      totalHires: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Animation State
  const { scrollY } = useScroll();
  const [isExpanded, setIsExpanded] = useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 50) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  });

  useEffect(() => {
    const fetchData = async () => {
        if (!user) {
            console.log("DASHBOARD: Waiting for user login...");
            return;
        }

        try {
            // 1. Fetch Jobs
            const resJobs = await fetch("/api/jobs", { cache: "no-store" });
            const allJobs = await resJobs.json();
            
            // 2. Fetch Wallet
            const resWallet = await fetch(`/api/wallet?userId=${user._id}`, { cache: "no-store" });
            const walletData = await resWallet.json();

            if(Array.isArray(allJobs)) {
                
                const myJobs = allJobs.filter((j: any) => {
                    const dbClientId = j.client?._id || j.client;
                    return String(dbClientId) === String(user._id);
                });

                // Calculate Stats
                const active = myJobs.filter((j: any) => j.status === 'open' || j.status === 'hired').length;
                const hires = myJobs.filter((j: any) => j.status === 'hired' || j.status === 'completed').length;
                
                let spent = 0;
                if (walletData.transactions) {
                    spent = walletData.transactions
                    .filter((tx: any) => tx.type === 'payment_release' || tx.type === 'payment_hold')
                    .reduce((sum: number, tx: any) => sum + tx.amount, 0);
                }

                setStats({ activeJobs: active, totalHires: hires, totalSpent: spent });
                setRecentJobs(myJobs.slice(0, 3)); // Show top 3 recent jobs
            }
        } catch (error) {
            console.error("DASHBOARD: Critical Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
  }, [user]);

  if (loading && recentJobs.length === 0) return <PageLoader />;

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{dashboard.welcome}, {user?.name?.split(" ")[0] || "Client"}</h1>
          <p className="text-gray-500 text-sm">{dashboard.overviewText}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            {/* Find Talent Button */}
            <Link href="/dashboard/client/freelancers" className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white border border-gray-200 text-navy px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-gray-50">
              <Search /> {dashboard.findTalentBtn}
            </Link>

            <Link href="/dashboard/client/post-job" className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-gold hover:bg-gold-light text-navy px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm">
              <PlusLg /> {t.nav.postJob}
            </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Jobs Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
           <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-bold">{dashboard.activeJobs}</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase /></div>
           </div>
           <div>
               <p className="text-3xl font-bold text-navy">{loading ? "-" : stats.activeJobs}</p>
               <p className="text-xs text-gray-400 mt-1">{dashboard.activeJobsDesc}</p>
           </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
           <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-bold">{dashboard.totalSpent}</span>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Wallet2 /></div>
           </div>
           <div>
               <p className="text-3xl font-bold text-navy">{loading ? "-" : convertPrice(stats.totalSpent)}</p>
               <p className="text-xs text-gray-400 mt-1">{dashboard.totalSpentDesc}</p>
           </div>
        </div>

        {/* Total Hires Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
           <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-bold">{dashboard.hiresMade}</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><People /></div>
           </div>
           <div>
               <p className="text-3xl font-bold text-navy">{loading ? "-" : stats.totalHires}</p>
               <p className="text-xs text-gray-400 mt-1">{dashboard.hiresMadeDesc}</p>
           </div>
        </div>
      </div>

      {/* --- RECENT ACTIVITY --- */}
      <div>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-navy">{dashboard.recentPosts}</h2>
              <Link href="/dashboard/client/jobs" className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
                  {dashboard.viewAll} <ChevronRight />
              </Link>
          </div>

          <div className="space-y-4">
              {loading ? (
                  [1,2].map(i => <div key={i} className="bg-white h-24 rounded-2xl animate-pulse shadow-sm"></div>)
              ) : recentJobs.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center">
                      <Briefcase className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">{t.manage.noJobs}</p>
                      <Link href="/dashboard/client/post-job" className="text-blue-600 text-sm font-bold mt-2 inline-block hover:underline">
                          {dashboard.postFirstJob}
                      </Link>
                  </div>
              ) : (
                  recentJobs.map(job => (
                      <div key={job._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
                          <div>
                              <h3 className="font-bold text-navy text-lg">{job.title}</h3>
                              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                  <span className="flex items-center gap-1"><Clock /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                  <span className={`font-bold px-2 py-0.5 rounded uppercase ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {job.status}
                                  </span>
                                  <span className="text-navy font-bold">{convertPrice(job.budget)}</span>
                              </div>
                          </div>
                          <Link href={`/dashboard/client/jobs/${job._id}`} className="p-3 bg-gray-50 rounded-xl text-navy hover:bg-navy hover:text-white transition-colors">
                              <Eye className="text-xl" />
                          </Link>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Animated FAB (Mobile) */}
      <motion.button 
        onClick={() => router.push("/dashboard/client/post-job")}
        layout
        className="md:hidden fixed bottom-24 right-4 h-14 bg-gold text-navy rounded-full shadow-xl flex items-center justify-center z-40 overflow-hidden"
        style={{ borderRadius: 28 }} 
        animate={{ width: isExpanded ? 140 : 56 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-center px-4 whitespace-nowrap">
            <PlusLg className="text-2xl font-bold flex-shrink-0" />
            <AnimatePresence>
                {isExpanded && (
                    <motion.span 
                        initial={{ opacity: 0, width: 0 }} 
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="ml-2 font-bold text-sm"
                    >
                        {t.nav.postJob}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}