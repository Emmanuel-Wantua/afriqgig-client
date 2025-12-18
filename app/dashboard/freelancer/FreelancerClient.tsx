"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Search, Filter, GeoAlt, Clock, LightningFill, Briefcase,
    Bookmark, X, CheckCircleFill, FileEarmarkText, ShieldCheck, ExclamationTriangleFill,
    Mic, StopCircle, Trash, PlayFill, Globe, CalendarDate
 } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import UserBadge from "@/components/UserBadge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import { uploadToCloudinary } from "@/utils/upload";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";
import { Skeleton } from "@/components/ui/Skeleton";

// --- SUB-COMPONENT: TRANSLATABLE TEXT ---
const TranslatableText = ({ text, className = "" }: { text: string, className?: string }) => {
    const { t, language } = useLanguage();
    const { translate, loading } = useGoogleTranslate();
    const [translatedText, setTranslatedText] = useState("");
    const [showTranslated, setShowTranslated] = useState(false);

    const handleTranslate = async () => {
        if (showTranslated) {
            setShowTranslated(false);
            return;
        }
        if (!translatedText) {
            const res = await translate(text);
            setTranslatedText(res);
        }
        setShowTranslated(true);
    };

    if (!text) return null;

    return (
        <div className={className}>
            <p className="whitespace-pre-wrap">{showTranslated ? translatedText : text}</p>
            {language !== "en" && (
                <button 
                    onClick={handleTranslate} 
                    disabled={loading}
                    className="text-xs text-blue-500 font-bold hover:underline mt-1 flex items-center gap-1 transition-colors"
                >
                    <Globe className="text-[10px]" />
                    {loading ? t.community.translating : showTranslated ? t.community.showOriginal : `${t.community.translate} ${language.toUpperCase()}`}
                </button>
            )}
        </div>
    );
};

// --- MAIN CONTENT LOGIC ---
function FreelancerDashboardContent() {
  const { t, currency, language, convertPrice } = useLanguage();
  
  const [activeTab, setActiveTab] = useState("recommended");

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [filterRemote, setFilterRemote] = useState(false);

  const [jobs, setJobs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  
  // Modal State
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Verification Banner State
  const [showVerifyBanner, setShowVerifyBanner] = useState(true);
  const searchParams = useSearchParams();
  const autoOpenJobId = searchParams.get("jobId");

  // --- VOICE RECORDING STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [duration, setDuration] = useState("1 week");
  const [customDuration, setCustomDuration] = useState("");

  // Load User & Jobs (With Profile Sync)
  useEffect(() => {
    const initialize = async () => {
        const storedUser = localStorage.getItem("afriqUser");
        if (storedUser) {
            let parsedUser = JSON.parse(storedUser);
            setUser(parsedUser); 

            // FETCH FRESH PROFILE
            try {
                const res = await fetch(`/api/users/${parsedUser._id}`);
                if (res.ok) {
                    const freshData = await res.json();
                    parsedUser = { ...parsedUser, ...freshData };
                    setUser(parsedUser);
                    localStorage.setItem("afriqUser", JSON.stringify(parsedUser));
                }
            } catch (error) {
                console.error("Background profile sync failed", error);
            }
        }
        
        fetchJobs();
    };

    initialize();
  }, []);

  // Auto-open job
  useEffect(() => {
      if (autoOpenJobId && jobs.length > 0) {
          const jobToOpen = jobs.find(j => j._id === autoOpenJobId);
          if (jobToOpen) {
              setSelectedJob(jobToOpen);
              window.history.replaceState(null, "", "/dashboard/freelancer");
          }
      }
  }, [autoOpenJobId, jobs]);

  const fetchJobs = async () => {
    try {
      console.log("Fetching jobs...");
      const res = await fetch("/api/jobs", { cache: "no-store" });
      const data = await res.json();
      
      if (Array.isArray(data)) {
          setJobs(data);
      } else {
          setJobs([]);
      }
    } catch (error) {
      console.error("Failed to load jobs", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t.dashboard.recently; 
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ${t.dashboard.ago}`;
    return date.toLocaleDateString();
  };

  const getMatchScore = (jobCategory: string) => {
    if (!user || !user.skills) return 50; 
    if (user.skills.includes(jobCategory)) return Math.floor(Math.random() * (99 - 90) + 90);
    return Math.floor(Math.random() * (85 - 60) + 60); 
  };

  // --- ACTIONS ---
  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setBidAmount(job.budget?.toString() || "");
    setCoverLetter("");
    setShowSuccess(false);
    setDuration("1 week");
  };

  const submitProposal = async () => {
    setFeedback(null);
    if (!user) return setFeedback({ type: 'error', message: t.postJob.errorLogin });
    
    setIsSubmitting(true);

    const clientId = typeof selectedJob.client === 'object' ? selectedJob.client._id : selectedJob.client;

    try {
        let finalCoverLetter = coverLetter;
        
        if (audioBlob) {
            const audioFile = new File([audioBlob], "proposal_voice.webm", { type: "audio/webm" });
            const audioUrl = await uploadToCloudinary(audioFile);
            
            if (audioUrl) {
                finalCoverLetter += `\n\n[VOICE_PROPOSAL]: ${audioUrl}`;
            }
        }

        const finalDuration = duration === "custom" ? customDuration : duration;

        if (duration === "custom" && !customDuration.trim()) {
            return setFeedback({ type: 'error', message: t.proposal?.errorDuration || "Please specify a duration" });
        }

        const res = await fetch("/api/proposals/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobId: selectedJob._id,
                freelancerId: user._id,
                clientId: clientId, 
                bidAmount: Number(bidAmount),
                coverLetter: finalCoverLetter,
                duration: finalDuration,
            })
        });

        if (res.ok) {
            setFeedback({ type: 'success', message: t.proposal.success });
            setAppliedJobIds(prev => [...prev, selectedJob._id]); 
            
            setAudioBlob(null);
            setRecordingTime(0);

            setTimeout(() => {
                setSelectedJob(null);
                setFeedback(null);
                fetchJobs(); 
            }, 2000);
        } else {
            const data = await res.json();
            setFeedback({ type: 'error', message: data?.message || t.postJob.errorServer });
        }

    } catch (error) {
        setFeedback({ type: 'error', message: t.postJob.errorConnection });
    } finally {
        setIsSubmitting(false);
    }
  };

  const fee = Number(bidAmount) * 0.05;
  const receive = Number(bidAmount) - fee;

  // --- FILTERING LOGIC ---
  const filteredJobs = jobs.filter(job => {
    // 1. Basic Checks
    if (job.status === "hired" || job.status === "completed") return false;
    if (appliedJobIds.includes(job._id)) return false;

    // 2. Database Applied Check
    if (user && job.proposals && Array.isArray(job.proposals)) {
        const hasAppliedInDb = job.proposals.some((p: any) => {
             const pId = (typeof p === 'string') ? p : (typeof p.freelancer === 'string' ? p.freelancer : p.freelancer?._id);
             return pId === user?._id;
        });
        if (hasAppliedInDb) return false;
    }

    // --- NEW: BUTTON FILTERS ---
    if (filterUrgent && !job.isUrgent) return false;
    
    const isRemote = !job.location || job.location === "Remote";
    if (filterRemote && !isRemote) return false;

    // 3. Tab Logic
    if (activeTab === "saved") return false; 

    if (activeTab === "recommended") {
        if (!user?.skills || user.skills.length === 0) return true; 

        const userSkills = user.skills.map((s: string) => s.toLowerCase().trim());
        const jobCategory = (job.category || "").toLowerCase().trim();
        const jobTitle = (job.title || "").toLowerCase().trim();
        const jobTags = Array.isArray(job.tags) ? job.tags.map((t: string) => t.toLowerCase().trim()) : [];

        const matchFound = userSkills.some((skill: string) => {
            if (jobCategory === skill) return true;
            if (jobCategory.includes(skill)) return true;
            if (jobTitle.includes(skill)) return true;
            if (jobTags.includes(skill)) return true;
            return false;
        });

        if (!matchFound) return false;
        return true; 
    }

    return true; 
  }).sort((a, b) => {
      const scoreA = getMatchScore(a.category);
      const scoreB = getMatchScore(b.category);
      return scoreB - scoreA;
  });

  // --- VOICE RECORDING ---
  const startRecording = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return alert("Microphone access is not supported.");
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
          mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              setAudioBlob(blob);
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);
          timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

      } catch (err) {
          alert("Could not access microphone.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const deleteRecording = () => {
      setAudioBlob(null);
      setRecordingTime(0);
  };

  const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="flex gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-64" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex justify-between pt-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-32 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div>
           {/* 1. Name is now on its own line */}
           <h1 className="text-2xl font-bold text-navy mb-2">
             {t.dashboard.welcome}, <span className="text-gold">{user?.name?.split(' ')[0]}</span>
           </h1>
           
           {/* 2. Badge and Job Count are grouped on the second line */}
           <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
             {/* Badge moved here */}
             <div className="scale-90 origin-left">
                {user && <UserBadge user={user} showRating={true} />}
             </div>
             
             <span className="hidden sm:inline text-gray-300">|</span>
             
             <p>
               {t.dashboard.jobCountStart} <span className="text-gold font-bold">{filteredJobs.length} {t.dashboard.jobCountMiddle}</span> {t.dashboard.jobCountEnd}
             </p>
           </div>
        </div>
      </div>

      {/* VERIFICATION CTA BANNER */}
      {user && !user.isVerified && showVerifyBanner && (
          <div className="bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4">
              <button 
                onClick={() => setShowVerifyBanner(false)}
                className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors"
              >
                  <X className="text-2xl" />
              </button>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0 backdrop-blur-sm">
                      <ShieldCheck />
                  </div>
                  <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{t.dashboard.verifyTitle}</h3>
                      <p className="text-blue-100 text-sm max-w-xl">
                          {t.dashboard.verifyText}
                      </p>
                  </div>
                  <Link href="/dashboard/settings" className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap">
                      {t.dashboard.verifyBtn}
                  </Link>
              </div>
              
              {/* Decorative Background */}
              <ShieldCheck className="absolute -bottom-6 -right-6 text-9xl text-white/10 rotate-12" />
          </div>
      )}

      {/* SEARCH & FILTER */}
      <div className="space-y-4 sticky top-20 z-30">
          <div className="bg-white p-2 rounded-xl shadow-sm flex gap-2 border border-gray-200">
            <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3">
                <Search className="text-gray-400" />
                <input type="text" placeholder={t.nav.search + "..."} className="w-full bg-transparent p-3 outline-none text-sm text-navy" />
            </div>
            
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 rounded-lg flex items-center gap-2 font-bold text-sm transition-colors ${showFilters ? 'bg-gold text-navy' : 'bg-navy text-white'}`}
            >
                <Filter /> <span className="hidden md:inline">{t.dashboard.filter}</span>
            </button>
          </div>

          {/* NEW: Filter Options Menu */}
          {showFilters && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-6 animate-in slide-in-from-top-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-navy cursor-pointer select-none">
                      <input 
                          type="checkbox" 
                          checked={filterUrgent} 
                          onChange={e => setFilterUrgent(e.target.checked)} 
                          className="w-4 h-4 rounded text-navy focus:ring-navy border-gray-300" 
                      />
                      <LightningFill className="text-red-500" /> Urgent Only
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm font-bold text-navy cursor-pointer select-none">
                      <input 
                          type="checkbox" 
                          checked={filterRemote} 
                          onChange={e => setFilterRemote(e.target.checked)} 
                          className="w-4 h-4 rounded text-navy focus:ring-navy border-gray-300" 
                      />
                      <GeoAlt className="text-blue-500" /> Remote Only
                  </label>
              </div>
          )}
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-gray-200 text-sm font-medium overflow-x-auto">
        <button onClick={() => setActiveTab("recommended")} className={`pb-3 whitespace-nowrap ${activeTab === "recommended" ? "text-navy border-b-2 border-navy font-bold" : "text-gray-400"}`}>
            {t.dashboard.matches}
        </button>
        <button onClick={() => setActiveTab("recent")} className={`pb-3 whitespace-nowrap ${activeTab === "recent" ? "text-navy border-b-2 border-navy font-bold" : "text-gray-400"}`}>
            {t.dashboard.recent}
        </button>
        <button onClick={() => setActiveTab("saved")} className={`pb-3 whitespace-nowrap ${activeTab === "saved" ? "text-navy border-b-2 border-navy font-bold" : "text-gray-400"}`}>
            {t.dashboard.saved}
        </button>
      </div>

      {/* JOB FEED */}
      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-40"></div>)
        ) : filteredJobs.length === 0 ? (
           <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed">
               <Briefcase className="text-4xl mx-auto mb-2 opacity-20"/>
               <p>{t.manage.noJobsFreelancer}</p>
               <p className="text-xs mt-2">{t.dashboard.adjustFilters}</p>
           </div>
        ) : (
          filteredJobs.map((job) => {
            const isApplied = appliedJobIds.includes(job._id) || 
                              (job.proposals && job.proposals.some((p: any) => {
                                  if (!p.freelancer) return false;
                                  const pId = p.freelancer._id || p.freelancer;
                                  return pId === user?._id;
                              }));

            return (
              <div key={job._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                  
                  {/* Urgency Badge */}
                  {(job.isUrgent || Math.random() > 0.8) && (
                      <div className="absolute -top-3 -right-3">
                          <span className="flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-white">
                              <LightningFill /> {t.dashboard.urgent}
                          </span>
                      </div>
                  )}

                  {/* Header */}
                    <div className="flex justify-between items-start mb-2 gap-3"> {/* Added gap-3 */}
                        <div className="flex-1 min-w-0"> {/* Added flex-1 and min-w-0 to force text wrapping */}
                            <h3 className="font-bold text-navy text-lg leading-tight mb-1 break-words">{job.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500"> {/* Added flex-wrap */}
                                <span className="font-medium text-navy flex items-center gap-1 whitespace-nowrap">
                                    <Briefcase /> 
                                    {job.client ? <UserBadge user={job.client} showRating={true} /> : "Client"}
                                </span>
                                <span className="hidden xs:inline">•</span> {/* Hide separator on very small screens */}
                                <span className="flex items-center gap-1 whitespace-nowrap"><GeoAlt /> {job.location || t.dashboard.remote}</span>
                                <span className="hidden xs:inline">•</span>
                                <span className="flex items-center gap-1 whitespace-nowrap"><Clock /> {formatDate(job.createdAt)}</span>
                                {/* NEW: Deadline Badge */}
                                <span className="hidden xs:inline">•</span>
                                <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                                    <CalendarDate /> 
                                    {new Date(job.deadline).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <button className="text-gray-300 hover:text-navy flex-shrink-0 p-1"> {/* Added flex-shrink-0 */}
                            <Bookmark className="text-xl" />
                        </button>
                    </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 my-4">
                        <span className="bg-blue-50 text-navy-light text-xs font-bold px-2 py-1 rounded-md border border-blue-100">
                            {getMatchScore(job.category)}% {t.dashboard.match}
                        </span>
                      <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-md">
                          {job.category || "General"}
                      </span>
                  </div>

                  {/* Description (Truncated) */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {job.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-green-700 font-bold text-lg flex items-center gap-1">
                          {convertPrice(job.budget || 0)}
                      </div>
                      
                      <button 
                          onClick={() => !isApplied && handleApplyClick(job)}
                          disabled={isApplied}
                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg ${
                              isApplied 
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                              : "bg-navy hover:bg-navy-light text-white shadow-navy/20"
                          }`}
                      >
                          {isApplied ? t.dashboard.applied : t.dashboard.apply}
                      </button>
                  </div>
              </div>
            );
          })
        )}
      </div>

      {/* APPLICATION MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* FIX: max-h-[85vh] prevents cutting off on mobile screens */}
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] md:max-h-[90vh]">
                
                {/* Header (Fixed) */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-navy">{t.proposal.applyTitle}</h3>
                    <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-red-500">
                        <X className="text-2xl" />
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {feedback ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
                            <div className={`text-5xl mb-4 ${feedback.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {feedback.type === 'success' ? <CheckCircleFill /> : <ExclamationTriangleFill />}
                            </div>
                            <h4 className={`text-xl font-bold mb-2 ${feedback.type === 'success' ? 'text-navy' : 'text-red-600'}`}>
                                {feedback.type === 'success' ? 'Success!' : 'Error'}
                            </h4>
                            <p className="text-sm text-gray-500">{feedback.message}</p>
                            
                            {feedback.type === 'error' && (
                                <button 
                                    onClick={() => setFeedback(null)} 
                                    className="mt-6 px-6 py-2 bg-gray-100 text-navy font-bold rounded-lg hover:bg-gray-200"
                                >
                                    {t.dashboard.tryAgain}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4">
                                <strong>Job:</strong> {selectedJob.title}
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                                <p className="text-xs font-bold text-navy mb-2">{t.postJob.description}:</p>
                                <TranslatableText text={selectedJob.description} className="text-sm text-gray-600" />
                            </div>

                            {selectedJob.attachments && selectedJob.attachments.length > 0 && (
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                                    <p className="text-xs font-bold text-navy mb-2">{t.workspace.originalFiles}:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedJob.attachments.map((file: string, index: number) => (
                                            <div key={index} className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-500">
                                                <FileEarmarkText /> {file}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-navy uppercase mb-1">{t.proposal.bidLabel}</label>
                                <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl font-mono text-lg text-navy bg-white focus:border-navy outline-none" />
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{t.proposal.feeLabel}</span>
                                    <span>- {fee.toLocaleString()} {currency}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-green-700 pt-2 border-t border-gray-200">
                                    <span>{t.proposal.receiveLabel}</span>
                                    <span>{receive.toLocaleString()} {currency}</span>
                                </div>
                            </div>

                            {/* DURATION INPUT */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-navy uppercase mb-1">
                                    {t.proposal?.duration || "How long will this take?"}
                                </label>
                                
                                <select 
                                    value={duration} 
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm text-navy bg-white focus:border-navy outline-none mb-2"
                                >
                                    <option value="Less than 1 day">Less than 1 day</option>
                                    <option value="1 to 3 days">1 to 3 days</option>
                                    <option value="1 week">1 week</option>
                                    <option value="2 weeks">2 weeks</option>
                                    <option value="1 month">1 month</option>
                                    <option value="custom">Other / Custom...</option>
                                </select>

                                {/* CUSTOM DURATION FIELD */}
                                {duration === "custom" && (
                                    <input 
                                        type="text" 
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(e.target.value)}
                                        placeholder="e.g. 4 hours, 3 days..."
                                        className="w-full p-3 border border-blue-200 bg-blue-50 rounded-xl text-sm text-navy focus:border-navy outline-none animate-in fade-in slide-in-from-top-1"
                                        autoFocus
                                    />
                                )}
                            </div>

                            {/* VOICE PROPOSAL UI */}
                            <div>
                                <label className="block text-xs font-bold text-navy uppercase mb-2">{t.manage.voicePitch}</label>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                                    {isRecording ? (
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-red-600 font-mono font-bold text-sm">{formatDuration(recordingTime)}</span>
                                            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-400 animate-progress" style={{width: '100%'}}></div>
                                            </div>
                                            <button onClick={stopRecording} className="text-red-600 font-bold text-xs hover:bg-red-100 px-3 py-1 rounded-lg transition-colors">
                                                <StopCircle className="inline mr-1 text-lg"/> Stop
                                            </button>
                                        </div>
                                    ) : audioBlob ? (
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                <PlayFill />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-navy">Voice Note Recorded</p>
                                                <audio controls src={URL.createObjectURL(audioBlob)} className="h-6 w-full max-w-[150px] mt-1" />
                                            </div>
                                            <button onClick={deleteRecording} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                                                <Trash />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <p className="text-xs text-gray-500">Stand out with a voice note.</p>
                                            <button onClick={startRecording} className="flex items-center gap-2 bg-white border border-gray-300 text-navy px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm">
                                                <Mic className="text-red-500" /> Record
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-navy uppercase mb-1">{t.proposal.coverLetter}</label>
                                <textarea rows={5} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder={t.proposal.coverPlaceholder} className="w-full p-3 border border-gray-200 rounded-xl text-sm text-navy bg-white focus:border-navy outline-none resize-none"></textarea>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (Fixed) */}
                {!feedback && (
                    <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                        <button onClick={() => setSelectedJob(null)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:bg-gray-200 rounded-lg transition-colors">{t.proposal.cancel}</button>
                        <button onClick={submitProposal} disabled={isSubmitting} className="px-6 py-2 bg-navy text-white font-bold text-sm rounded-lg hover:bg-navy-light transition-colors shadow-md disabled:opacity-70">
                            {isSubmitting ? t.proposal.submitting : t.proposal.submit}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}

// --- DEFAULT EXPORT WITH SUSPENSE ---
export default function FreelancerDashboard() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FreelancerDashboardContent />
    </Suspense>
  );
}