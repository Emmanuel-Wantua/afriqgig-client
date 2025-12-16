"use client";

import { useState, useEffect } from "react";
import { 
    PeopleFill, CashCoin, BriefcaseFill, ExclamationTriangleFill, 
    ArrowUpRight, ShieldCheck, ChatQuote, Wallet2, Headset, EnvelopeOpen 
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

export default function AdminDashboardContent() {
  const { convertPrice, user } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats", { cache: "no-store" });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;
  if (!user || user.role !== 'admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;

  const StatCard = ({ title, value, icon, color, subtext, link }: any) => (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 ${color}`}>
              {icon}
          </div>
          <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${color.replace("text-", "bg-").replace("600", "100")} ${color}`}>
                  {icon}
              </div>
              <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">{title}</p>
              <h3 className="text-2xl font-bold text-navy my-1">{value}</h3>
              <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">{subtext}</span>
                  {link && (
                      <Link href={link} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                          Manage <ArrowUpRight />
                      </Link>
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* HEADER */}
        <div>
            <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Platform overview and management.</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Withdrawals (High Priority) */}
            <StatCard 
                title="Pending Withdrawals" 
                value={stats?.finance?.pendingWithdrawals || 0} 
                icon={<Wallet2 />} 
                color="text-orange-600"
                subtext="Payout requests"
                link="/dashboard/admin/withdrawals"
            />

            {/* 2. Revenue */}
            <StatCard 
                title="Total Revenue" 
                value={convertPrice(stats?.finance?.revenue || 0)} 
                icon={<CashCoin />} 
                color="text-green-600"
                subtext="Est. 5% Fees"
                link="/dashboard/admin/finance"
            />

            {/* 3. Disputes */}
            <StatCard 
                title="Active Disputes" 
                value={stats?.disputes?.open || 0} 
                icon={<ExclamationTriangleFill />} 
                color="text-red-600"
                subtext="Action Required"
                link="/dashboard/admin/disputes"
            />

            {/* 4. Verifications */}
            <StatCard 
                title="Pending Verifications" 
                value={stats?.users?.pending || 0} 
                icon={<ShieldCheck />} 
                color="text-blue-600"
                subtext="ID Checks"
                link="/dashboard/admin/users"
            />
            
            {/* 5. Active Jobs */}
            <StatCard 
                title="Active Jobs" 
                value={stats?.jobs?.active || 0} 
                icon={<BriefcaseFill />} 
                color="text-purple-600"
                subtext="Running contracts"
                link="/dashboard/client/jobs" 
            />

            {/* 6. User Feedback */}
            <Link href="/dashboard/admin/feedback" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4 group md:col-span-2 lg:col-span-3">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    <ChatQuote />
                </div>
                <div>
                    <h3 className="font-bold text-navy text-lg">User Feedback</h3>
                    <p className="text-gray-500 text-xs">View suggestions & bugs from the community.</p>
                </div>
                <div className="ml-auto text-gray-300">
                    <ArrowUpRight />
                </div>
            </Link>
        </div>

        {/* QUICK ACTIONS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-navy mb-4">Platform Health</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Users</span>
                        <span className="font-bold text-navy">{stats?.users?.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Volume Processed</span>
                        <span className="font-bold text-navy">{convertPrice(stats?.finance?.volume || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Jobs Completed</span>
                        <span className="font-bold text-navy">{stats?.jobs?.completed}</span>
                    </div>
                </div>
            </div>

            <div className="bg-navy text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-xl mb-2">Need to resolve a conflict?</h3>
                    <p className="text-blue-100 text-sm mb-6 max-w-xs">
                        Review active disputes, read chat logs, and release funds to the correct party.
                    </p>
                    <Link href="/dashboard/admin/disputes" className="bg-white text-navy px-6 py-3 rounded-xl font-bold text-sm hover:bg-gold transition-colors inline-block">
                        Go to Dispute Center
                    </Link>
                </div>
                <ExclamationTriangleFill className="absolute -bottom-6 -right-6 text-9xl text-white/10" />
            </div>
        </div>

        {/* SUPPORT & MESSAGES SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
            <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                <ChatQuote className="text-gold" /> Support Center
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/admin/support" className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors border border-blue-100 group">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Headset />
                    </div>
                    <div>
                        <h4 className="font-bold text-navy text-sm">Live Chats</h4>
                        <p className="text-xs text-gray-500">Reply to guest users</p>
                    </div>
                    <ArrowUpRight className="ml-auto text-gray-400" />
                </Link>

                <Link href="/dashboard/admin/contact" className="flex items-center gap-4 p-4 rounded-xl bg-purple-50/50 hover:bg-purple-50 transition-colors border border-purple-100 group">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <EnvelopeOpen />
                    </div>
                    <div>
                        <h4 className="font-bold text-navy text-sm">Contact Messages</h4>
                        <p className="text-xs text-gray-500">View email inquiries</p>
                    </div>
                    <ArrowUpRight className="ml-auto text-gray-400" />
                </Link>
            </div>
        </div>

    </div>
  );
}