"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar3 } from "react-bootstrap-icons";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

export default function AnalyticsContent() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/stats/analytics");
        const json = await res.json();
        
        // Mock data if empty for visualization
        if (!json || json.length === 0) {
            setData([
                { date: "2023-10-20", visits: 120 },
                { date: "2023-10-21", visits: 150 },
                { date: "2023-10-22", visits: 180 },
                { date: "2023-10-23", visits: 200 },
                { date: "2023-10-24", visits: 250 },
                { date: "2023-10-25", visits: 300 },
                { date: "Today", visits: 320 },
            ]);
        } else {
            setData(json);
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  // Prevent crash if data is empty by defaulting to [0]
  const maxVisits = data.length > 0 ? Math.max(...data.map(d => d.visits)) : 100;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-gray-500 hover:text-navy flex items-center gap-2 mb-4">
            <ArrowLeft /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-navy">Platform Analytics</h1>
        <p className="text-gray-500">Traffic and usage statistics.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-8">
              <Calendar3 className="text-gold text-xl" />
              <h3 className="font-bold text-navy">Traffic Overview (Daily Visits)</h3>
          </div>

          {/* CSS BAR CHART */}
          <div className="flex items-end justify-between h-64 gap-2 md:gap-4 w-full">
              {data.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full flex items-end justify-center h-full bg-gray-50 rounded-xl overflow-hidden">
                          <div 
                              className="w-full bg-navy group-hover:bg-gold transition-all duration-500 rounded-t-xl relative"
                              style={{ height: `${(day.visits / (maxVisits || 1)) * 100}%` }}
                          >
                              {/* Tooltip */}
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {day.visits} Visits
                              </div>
                          </div>
                      </div>
                      <p className="text-[10px] md:text-xs text-gray-400 font-medium rotate-0 truncate w-full text-center">
                          {day.date.slice(5)} {/* Show MM-DD */}
                      </p>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}