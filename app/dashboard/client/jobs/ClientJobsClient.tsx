"use client";

import { useState, useEffect } from "react";
import { Briefcase, Eye, Clock, ChatDots, Trash, ExclamationTriangleFill } from "react-bootstrap-icons";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import PageLoader from "@/components/PageLoader";

export default function ClientJobsContent() {
  const { t, convertPrice } = useLanguage();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // --- DELETE STATES ---
  const [jobToDelete, setJobToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("afriqUser");
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchMyJobs = async () => {
      try {
        const res = await fetch("/api/jobs", { cache: "no-store" });
        const data = await res.json();
        
        if (Array.isArray(data)) {
            const myJobs = data.filter((job: any) => {
                const dbId = String(job.client?._id || job.client);
                const userId = String(user._id);
                return dbId === userId;
            });
            setJobs(myJobs);
        } else {
            setJobs([]); 
        }
      } catch (error) {
        console.error(error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [user]);

  // --- DELETE LOGIC ---
  const handleDeleteClick = (job: any) => {
      setDeleteError("");
      setJobToDelete(job);
  };

  const confirmDelete = async () => {
      if (!jobToDelete) return;
      setIsDeleting(true);
      setDeleteError("");

      try {
          const res = await fetch(`/api/jobs/${jobToDelete._id}`, {
              method: "DELETE"
          });
          
          const data = await res.json();

          if (!res.ok) {
              throw new Error(data.message || t.manage.deleteError);
          }

          // Success: Remove from UI instantly
          setJobs(prev => prev.filter(j => j._id !== jobToDelete._id));
          setJobToDelete(null); 

      } catch (error: any) {
          setDeleteError(error.message);
      } finally {
          setIsDeleting(false);
      }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">{t.manage.title}</h1>
        <Link href="/dashboard/client/post-job" className="bg-gold text-navy px-4 py-2 rounded-xl font-bold text-sm hover:bg-gold-light transition-colors shadow-sm">
          + {t.nav.postJob}
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
           [1,2].map(i => <div key={i} className="bg-white h-32 rounded-2xl shadow-sm animate-pulse"></div>)
        ) : jobs.length === 0 ? (
           <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
             <Briefcase className="text-4xl mb-2 opacity-20 mx-auto" />
             <p>{t.manage.noJobs}</p>
           </div>
        ) : (
          jobs.map(job => (
            <div key={job._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
               <div>
                 <h3 className="font-bold text-navy text-lg">{job.title}</h3>
                 <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Clock /> {new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className="text-green font-bold">{convertPrice(job.budget)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        job.status === 'open' ? 'bg-green-100 text-green-700' : 
                        job.status === 'hired' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {job.status === 'open' ? t.manage.open : 
                         job.status === 'hired' ? t.manage.hired : 
                         job.status}
                    </span>
                 </div>
               </div>

               <div className="flex items-center gap-3 w-full md:w-auto">
                 {/* PROPOSALS COUNT */}
                 {job.status === 'open' && (
                     <div className="text-center px-4 border-r border-gray-100">
                        <span className="block text-xl font-bold text-navy">{job.proposals ? job.proposals.length : 0}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{t.manage.proposals}</span>
                     </div>
                 )}

                 {/* MESSAGE BUTTON */}
                 {job.status === 'hired' && job.hiredFreelancer && (
                     <Link 
                        href={`/dashboard/messages?chatWith=${job.hiredFreelancer._id || job.hiredFreelancer}`}
                        className="bg-white border border-gray-200 text-navy p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                        title={t.manage.messageFreelancer}
                     >
                        <ChatDots className="text-xl" />
                     </Link>
                 )}
                 
                 {/* VIEW DETAILS / MANAGE CONTRACT */}
                 <Link 
                   href={job.status === 'open' ? `/dashboard/client/jobs/${job._id}` : `/dashboard/contracts/${job._id}`}
                   className="flex-1 md:flex-none bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                 >
                    <Eye /> {job.status === 'open' ? t.manage.view : t.manage.manageContract}
                 </Link>

                 {/* DELETE BUTTON */}
                 {job.status === 'open' && (
                     <button 
                        onClick={() => handleDeleteClick(job)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title={t.manage.deleteJob}
                     >
                         <Trash className="text-lg" />
                     </button>
                 )}
               </div>
            </div>
          ))
        )}
      </div>

      {/* --- CUSTOM DELETE MODAL --- */}
      {jobToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 text-center">
                      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
                          <ExclamationTriangleFill />
                      </div>
                      <h3 className="text-xl font-bold text-navy mb-2">{t.manage.deleteTitle}</h3>
                      <p className="text-sm text-gray-500 mb-6">
                          {t.manage.deleteConfirmStart} <strong>"{jobToDelete.title}"</strong>? {t.manage.deleteConfirmEnd}
                      </p>

                      {deleteError && (
                          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mb-4">{deleteError}</p>
                      )}

                      <div className="flex gap-3">
                          <button 
                              onClick={() => setJobToDelete(null)} 
                              className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors"
                          >
                              {t.proposal.cancel}
                          </button>
                          <button 
                              onClick={confirmDelete} 
                              disabled={isDeleting}
                              className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 shadow-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                              {isDeleting ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <Trash />}
                              {isDeleting ? t.manage.deleting : t.manage.delete}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}