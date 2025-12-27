"use client";

import { useState, useEffect } from "react";
import { Wallet2, ArrowLeft, ArrowUpRight, Download, CreditCard, Bank, Calendar3 } from "react-bootstrap-icons";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PageLoader from "@/components/PageLoader";

export default function FinanceContent() {
  const { convertPrice } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Stats
        const resStats = await fetch("/api/admin/stats"); 
        const dataStats = await resStats.json();
        setStats(dataStats.finance || {});

        // 2. Fetch Real Transactions
        const resTx = await fetch("/api/admin/transactions?filter=all");
        const dataTx = await resTx.json();
        
        if (Array.isArray(dataTx) && dataTx.length > 0) {
            setTransactions(dataTx);
        } else {
             // Mock Data (Fallback)
             setTransactions([
                { id: 1, user: "John Doe", type: "Deposit", amount: 50000, date: new Date().toISOString(), status: "completed", ref: "DEP-001" },
                { id: 2, user: "Jane Smith", type: "Withdrawal", amount: 25000, date: new Date(Date.now() - 86400000).toISOString(), status: "pending", ref: "WTH-892" },
            ]);
        }

      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // ✅ UPDATED EXPORT LOGIC (Handles User Objects)
  const handleExport = () => {
      if (transactions.length === 0) return alert("No transactions to export.");

      const headers = ["Reference,User,Type,Date,Amount,Status"];
      
      const rows = transactions.map(tx => {
          const date = new Date(tx.date).toLocaleDateString();
          // Check if user is object (real data) or string (mock data)
          const userName = typeof tx.user === 'object' && tx.user !== null ? tx.user.name : tx.user;
          return `${tx.ref || 'N/A'},"${userName}",${tx.type},${date},${tx.amount},${tx.status}`;
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-gray-500 hover:text-navy flex items-center gap-2 mb-4">
            <ArrowLeft /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h1 className="text-3xl font-bold text-navy">Financial Overview</h1>
                <p className="text-gray-500">Monitor revenue, withdrawals, and escrow.</p>
            </div>
            <button 
                onClick={handleExport}
                className="bg-white border border-gray-200 text-navy px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
            >
                <Download /> Export Report (CSV)
            </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-navy text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                  <p className="text-blue-200 text-xs font-bold uppercase mb-1">Total Platform Revenue</p>
                  <h2 className="text-3xl font-bold">{convertPrice(stats?.revenue || 0)}</h2>
                  <p className="text-xs text-blue-300 mt-2 flex items-center gap-1"><Calendar3/> All time earnings</p>
              </div>
              <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-full"><Wallet2 className="text-xl"/></div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-colors"></div>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group hover:border-orange-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                   <p className="text-gray-400 text-xs font-bold uppercase">Pending Withdrawals</p>
                   <div className="bg-orange-50 text-orange-500 p-2 rounded-full"><Bank className="text-xl"/></div>
              </div>
              <h2 className="text-3xl font-bold text-navy">{stats?.pendingWithdrawals || 0}</h2>
              <Link href="/dashboard/admin/withdrawals" className="text-xs font-bold text-blue-600 mt-4 flex items-center gap-1 hover:underline">
                  Process Requests <ArrowUpRight/>
              </Link>
          </div>

          {/* Escrow (Volume) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
              <div className="flex justify-between items-start mb-2">
                   <p className="text-gray-400 text-xs font-bold uppercase">Total Volume</p>
                   <div className="bg-blue-50 text-blue-600 p-2 rounded-full"><CreditCard className="text-xl"/></div>
              </div>
              <h2 className="text-3xl font-bold text-navy">{convertPrice(stats?.volume || 0)}</h2>
              <p className="text-xs text-gray-400 mt-2">Total money moved through platform</p>
          </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-navy">Recent Transactions</h3>
              <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                      <tr>
                          <th className="p-4">Reference</th>
                          <th className="p-4">User</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {transactions.map((tx, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                              <td className="p-4 font-mono text-xs text-gray-500">{tx.ref || "N/A"}</td>
                              
                              {/* ✅ FIX: Handle Object vs String for User Name */}
                              <td className="p-4 font-bold text-navy">
                                  {typeof tx.user === 'object' && tx.user !== null ? tx.user.name : tx.user}
                              </td>

                              <td className="p-4 capitalize text-gray-600 flex items-center gap-2">
                                  {tx.type === 'withdrawal' ? <ArrowUpRight className="text-red-400"/> : <ArrowUpRight className="text-green-400 rotate-180"/>}
                                  {tx.type}
                              </td>
                              <td className="p-4 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                              <td className={`p-4 font-bold ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                                  {tx.type === 'withdrawal' ? '-' : '+'}{convertPrice(tx.amount)}
                              </td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                      tx.status === 'completed' 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }`}>
                                      {tx.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}