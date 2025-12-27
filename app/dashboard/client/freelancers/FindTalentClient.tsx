"use client";

import { useState, useEffect } from "react";
import { Search, Filter, PersonCircle, ChatDots, Eye } from "react-bootstrap-icons"; 
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import UserBadge from "@/components/UserBadge";
import PageLoader from "@/components/PageLoader";
import dynamic from 'next/dynamic';
const HireModal = dynamic(() => import('@/components/HireModal'), { ssr: false });

export default function FindTalentContent() {
  const { t, convertPrice } = useLanguage(); 
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFreelancers();
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/freelancers?q=${searchTerm}`);
      const data = await res.json();
      setFreelancers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleHireClick = (freelancer: any) => {
      setSelectedFreelancer(freelancer);
      setShowHireModal(true);
  };

  if (loading && !searchTerm) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
              <h1 className="text-2xl font-bold text-navy">{t.dashboard.findTalent}</h1>
              <p className="text-gray-500 text-sm">{t.dashboard.discover}</p>
          </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-2 rounded-xl shadow-sm flex gap-2 border border-gray-200 sticky top-20 z-30">
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3">
            <Search className="text-gray-400" />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.dashboard.searchPlaceholder} 
                className="w-full bg-transparent p-3 outline-none text-sm text-navy" 
            />
        </div>
        <button className="bg-navy text-white px-4 rounded-lg flex items-center gap-2 font-bold text-sm">
            <Filter /> <span className="hidden md:inline">{t.dashboard.filter}</span>
        </button>
      </div>

      {/* RESULTS GRID */}
      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-white h-48 rounded-2xl animate-pulse shadow-sm"></div>)}
          </div>
      ) : freelancers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <PersonCircle className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{t.dashboard.noFreelancers}</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freelancers.map(fl => (
                  <div key={fl._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div className="flex gap-4">
                          {/* Avatar (Clickable) */}
                          <Link href={`/profile/${fl._id}`} className="w-14 h-14 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 hover:opacity-80 transition-opacity">
                              {fl.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={fl.avatar} className="w-full h-full object-cover" alt={fl.name} />
                              ) : <PersonCircle className="text-5xl text-gray-300 -ml-1 -mt-1" />}
                          </Link>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                              {/* Badge/Name (Clickable) */}
                              <Link href={`/profile/${fl._id}`} className="hover:underline decoration-navy decoration-1 underline-offset-2">
                                  <UserBadge user={fl} showRating={true} />
                              </Link>
                              
                              <p className="text-xs font-bold text-gray-600 mt-0.5 truncate">{fl.title || "Freelancer"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{fl.country}</p>
                              
                              {/* Skills Tags */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                  {fl.skills?.slice(0, 3).map((skill: string, i: number) => (
                                      <span key={i} className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-[10px] border border-gray-200">
                                          {skill}
                                      </span>
                                  ))}
                                  {fl.skills?.length > 3 && <span className="text-[10px] text-gray-400 pt-1">+{fl.skills.length - 3}</span>}
                              </div>
                          </div>
                      </div>

                      {/* Footer: Rate & Action */}
                      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                          <div className="text-sm">
                              {fl.rateType === 'negotiated' ? (
                                  <span className="font-bold text-navy text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                      {t.dashboard.negotiable}
                                  </span>
                              ) : (
                                  <>
                                      <span className="font-bold text-navy">{convertPrice(fl.hourlyRate || 0)}</span>
                                      <span className="text-gray-400 text-xs">/hr</span>
                                  </>
                              )}
                          </div>
                          
                          <div className="flex gap-2">
                              {/* View Profile Button */}
                              <Link href={`/profile/${fl._id}`} className="p-2 bg-gray-50 text-navy rounded-xl hover:bg-gray-100 transition-colors" title={t.dashboard.viewProfile}>
                                  <Eye />
                              </Link>

                              <Link href={`/dashboard/messages?chatWith=${fl._id}`} className="p-2 bg-gray-50 text-navy rounded-xl hover:bg-gray-100 transition-colors" title={t.dashboard.message}>
                                  <ChatDots />
                              </Link>
                              
                              <button 
                                  onClick={() => handleHireClick(fl)}
                                  className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-light transition-colors"
                              >
                                  {t.dashboard.hireNow}
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- REUSABLE HIRE MODAL --- */}
      {showHireModal && selectedFreelancer && (
          <HireModal 
              freelancer={selectedFreelancer} 
              onClose={() => setShowHireModal(false)} 
          />
      )}
    </div>
  );
}