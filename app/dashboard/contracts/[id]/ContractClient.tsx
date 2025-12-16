"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChatDots, CheckCircleFill, Clock, CloudUpload, FileEarmarkText, 
FileEarmarkImage, PersonCircle, ShieldLock, X, Download, Eye, ExclamationCircleFill,
ExclamationTriangle, InfoCircle, Star, StarFill, ShieldCheck, Globe } from "react-bootstrap-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { uploadToCloudinary } from "@/utils/upload";
import UserBadge from "@/components/UserBadge";
import PageLoader from "@/components/PageLoader";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";

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

// --- MAIN CONTENT COMPONENT ---
export default function ContractClient({ id }: { id: string }) {
  const { t, user, convertPrice } = useLanguage();
  const router = useRouter();

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals & State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  // --- DISPUTE STATE ---
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("other");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeStatus, setDisputeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const disputeFileRef = useRef<HTMLInputElement>(null);
  
  const [previewFile, setPreviewFile] = useState<{ name: string, url: string, type: string } | null>(null);
  
  const [deliverableFiles, setDeliverableFiles] = useState<File[]>([]);
  const [deliverableNote, setDeliverableNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // --- RATING STATE ---
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [feedback, setFeedback] = useState<{ type: "success" | "error", message: string } | null>(null);

  const fetchContract = async () => {
    try {
        console.log("Frontend: Fetching contract...");
        let res = await fetch(`/api/contracts/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Contract not found");
        const data = await res.json();
        setContract(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchContract(); }, [id]);

  const getFileType = (fileName: string) => {
      if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
      return "file";
  };

  const getFileName = (urlOrName: string) => {
      return urlOrName.split('/').pop() || urlOrName;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          setDeliverableFiles(prev => [...prev, ...newFiles]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => setDeliverableFiles(prev => prev.filter((_, i) => i !== idx));

  const handleViewFile = (file: string | File) => {
      if (file instanceof File) {
          setPreviewFile({ name: file.name, url: URL.createObjectURL(file), type: file.type.startsWith("image") ? "image" : "file" });
      } else if (typeof file === 'string') {
          const type = getFileType(file);
          setPreviewFile({ name: getFileName(file), url: file, type });
      }
  };

  const handleDownload = async (url: string, name: string) => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
          console.error("Download failed, opening in tab", error);
          window.open(url, '_blank');
      }
  };

  const handleSubmitWork = async () => {
      setErrorMessage("");
      if (deliverableFiles.length === 0) {
          setSubmitStatus("error");
          setErrorMessage(t.workspace.errorNoFile);
          return;
      }
      
      setSubmitStatus("uploading");
      setUploadProgress(10);

      try {
          const fileUrls: string[] = [];
          for (let i = 0; i < deliverableFiles.length; i++) {
              setUploadProgress(10 + Math.round(((i + 1) / deliverableFiles.length) * 80));
              const secureUrl = await uploadToCloudinary(deliverableFiles[i], "raw");
              if (secureUrl) fileUrls.push(secureUrl);
          }

          const res = await fetch(`/api/contracts/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                  submission: { files: fileUrls, note: deliverableNote, date: new Date() } 
              })
          });

          if (!res.ok) throw new Error("API Failed");

          setUploadProgress(100);
          setSubmitStatus("success");
          setTimeout(() => {
              setShowSubmitModal(false);
              setSubmitStatus("idle");
              setDeliverableFiles([]);
              setDeliverableNote("");
              fetchContract();
          }, 1500);

      } catch (error: any) {
          setSubmitStatus("error");
          setErrorMessage(t.workspace.errorUpload);
      }
  };

  const handleApprove = async () => {
      try {
          await fetch(`/api/contracts/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "completed", paymentStatus: "released" })
          });
          
          setShowApproveModal(false);
          fetchContract();
          setShowRatingModal(true); 
      } catch (error) { console.error(error); }
  };

  if (loading) return <PageLoader />;
  
  if (!contract) return (
      <div className="max-w-xl mx-auto mt-20 text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🤷‍♂️</div>
          <h2 className="text-xl font-bold text-navy mb-2">{t.workspace.contractNotFound}</h2>
          <p className="text-gray-500 mb-6">{t.workspace.contractNotFoundDesc}</p>
          <Link href="/dashboard/client/jobs" className="inline-block bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-navy-light transition-colors">{t.manage.back}</Link>
      </div>
  );

  const otherUser = contract?.client?._id === user?._id ? contract?.freelancer : contract?.client;
  const backLink = user?.role === 'client' ? '/dashboard/client/jobs' : '/dashboard/freelancer/contracts';

  const handleDisputeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
          setDisputeFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  };

  const handleDispute = async () => {
      if (!disputeDescription.trim()) return;
      setDisputeStatus("loading");
      
      try {
          const evidenceUrls: string[] = [];
          for (const file of disputeFiles) {
              const url = await uploadToCloudinary(file);
              if (url) evidenceUrls.push(url);
          }

          const res = await fetch("/api/disputes/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  contractId: contract._id,
                  initiatorId: user._id,
                  reason: disputeReason,
                  description: disputeDescription,
                  evidence: evidenceUrls 
              })
          });

          const data = await res.json();

          if (res.ok) {
              setDisputeStatus("success");
              setTimeout(() => {
                  setShowDisputeModal(false);
                  setDisputeStatus("idle");
                  setDisputeDescription("");
                  fetchContract();
              }, 2000);
          } else {
              setErrorMessage(data.message || t.workspace.disputeError);
              setDisputeStatus("error");
          }
      } catch (error) {
          setErrorMessage(t.workspace.errorNetwork);
          setDisputeStatus("error");
      }
  };

  const handleSubmitReview = async () => {
      if (rating === 0) return setFeedback({ type: "error", message: t.workspace.errorRating });
      setIsSubmittingReview(true);

      try {
          const clientId = typeof contract.client === 'object' ? contract.client._id : contract.client;
          const freelancerId = typeof contract.freelancer === 'object' ? contract.freelancer._id : contract.freelancer;
          
          const isClient = String(clientId) === String(user._id);
          const targetId = isClient ? freelancerId : clientId;

          await fetch("/api/reviews/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  contractId: contract._id,
                  reviewerId: user._id,
                  targetId: targetId,
                  rating,
                  comment: reviewComment
              })
          });

          setShowRatingModal(false);
          setFeedback({ type: "success", message: t.workspace.reviewSuccess });
      } catch (error) {
          console.error(error);
          setFeedback({ type: "error", message: t.workspace.errorReviewSave });
      } finally {
          setIsSubmittingReview(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
         <div>
            <Link href={backLink} className="text-gray-400 hover:text-navy text-xs font-bold flex items-center gap-2 mb-2">
                <ArrowLeft /> {t.manage.back}
            </Link>
            <h1 className="text-2xl font-bold text-navy">{contract.job?.title}</h1>
            <div className="flex gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Clock /> {t.workspace.started}: {new Date(contract.startDate).toLocaleDateString()}</span>
                <span className={`px-2 rounded text-xs font-bold uppercase ${contract.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {contract.status === 'completed' ? t.workspace.completed : t.workspace.active}
                </span>
            </div>
         </div>

         <div className="flex gap-3">
             {otherUser && (
                 <Link href={`/dashboard/messages?chatWith=${otherUser._id}`} className="bg-white border border-gray-200 text-navy px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                     <ChatDots /> {t.manage.chat}
                 </Link>
             )}
             {user?.role === "client" && contract.status !== "completed" && (
                 <button 
                    onClick={() => setShowApproveModal(true)} 
                    disabled={!contract.submission}
                    className={`px-6 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-colors ${
                        contract.submission 
                        ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                 >
                    <ShieldLock /> {t.workspace.approve}
                 </button>
             )}
             {user?.role === "freelancer" && contract.status !== "completed" && (
                 <button onClick={() => setShowSubmitModal(true)} className="bg-navy hover:bg-navy-light text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                    <CloudUpload /> {t.workspace.submit}
                 </button>
             )}
             {/* DISPUTE BUTTON */}
             {contract.status !== "completed" && contract.status !== "disputed" && (
                 <button 
                    onClick={() => setShowDisputeModal(true)} 
                    className="bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                 >
                    <ExclamationTriangle /> {t.workspace.reportProblem}
                 </button>
             )}
         </div>
      </div>

      {/* SAFETY INFO */}
      {contract.status !== 'completed' && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
              <InfoCircle className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
              <div>
                  <h4 className="font-bold text-navy text-sm">{t.workspace.paymentProtection}</h4>
                  <p className="text-xs text-gray-600 mt-1">{t.workspace.paymentProtectionDesc}</p>
              </div>
          </div>
      )}

      {/* DISPUTE BANNER */}
      {contract.status === 'disputed' && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 items-start animate-pulse">
              <ExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
              <div>
                  <h4 className="font-bold text-red-700 text-sm">{t.workspace.underReview}</h4>
                  <p className="text-xs text-red-600 mt-1">{t.workspace.underReviewDesc}</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
              {/* DETAILS */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-navy mb-4">{t.workspace.title}</h3>
                  
                  {/* TRANSLATABLE JOB DESCRIPTION */}
                  <TranslatableText text={contract.job?.description} className="text-gray-600 text-sm mb-6" />
                  
                  {/* FILES */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                      <h4 className="text-xs font-bold text-navy mb-3 uppercase flex items-center gap-2">
                          <FileEarmarkText /> {t.workspace.originalFiles}
                      </h4>
                      {contract.job?.attachments && contract.job.attachments.length > 0 ? (
                          <div className="flex flex-col gap-2">
                              {contract.job.attachments.map((file: string, idx: number) => {
                                  const type = getFileType(file);
                                  const name = getFileName(file);
                                  return (
                                      <button 
                                        key={idx} 
                                        onClick={() => handleViewFile(file)}
                                        className="flex items-center justify-between bg-white px-3 py-3 rounded-lg text-sm text-gray-700 border border-blue-200 hover:bg-blue-50 transition-colors text-left w-full group"
                                      >
                                          <div className="flex items-center gap-3 overflow-hidden">
                                              <div className={`p-1.5 rounded ${type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                  {type === 'image' ? <FileEarmarkImage /> : <FileEarmarkText />}
                                              </div>
                                              <span className="truncate font-medium text-gray-700 max-w-[200px] md:max-w-[300px]">{name}</span>
                                          </div>
                                          <Eye className="text-blue-600 flex-shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                                      </button>
                                  );
                              })}
                          </div>
                      ) : <p className="text-xs text-gray-400 italic">{t.workspace.noFiles}</p>}
                  </div>

                  {/* SUBMISSIONS */}
                  <div className="pt-6 border-t border-gray-100">
                      <h4 className="font-bold text-sm text-navy mb-3">{t.workspace.submissions}</h4>
                      
                      {contract.submission && contract.submission.files && contract.submission.files.length > 0 ? (
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-bold text-navy">{new Date(contract.submission.date).toLocaleDateString()}</span>
                                  {contract.status === 'completed' 
                                    ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">{t.workspace.approved}</span>
                                    : <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded">{t.workspace.pendingReview}</span>
                                  }
                              </div>
                              
                              {/* TRANSLATABLE SUBMISSION NOTE */}
                              <TranslatableText text={contract.submission.note} className="text-sm text-gray-600 mb-4" />
                              
                              <div className="space-y-2">
                                  {contract.submission.files.map((f: string, i: number) => {
                                      const type = getFileType(f);
                                      const name = getFileName(f);
                                      return (
                                          <button 
                                            key={i} 
                                            onClick={() => handleViewFile(f)}
                                            className="w-full flex items-center justify-between gap-2 text-xs bg-white p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                                          >
                                              <div className="flex items-center gap-3 overflow-hidden">
                                                  <div className={`p-1.5 rounded ${type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                      {type === 'image' ? <FileEarmarkImage /> : <FileEarmarkText />}
                                                  </div>
                                                  <span className="truncate font-medium text-gray-700 max-w-[200px] md:max-w-[300px] text-left">{name}</span>
                                              </div>
                                              <Eye className="text-gray-400 group-hover:text-blue-600" />
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                              {t.workspace.noSubmissions}
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gray-100 mx-auto rounded-full flex items-center justify-center mb-2 overflow-hidden border border-gray-200">
                          {otherUser?.avatar ? <img src={otherUser.avatar} className="w-full h-full object-cover"/> : <PersonCircle className="text-4xl text-gray-400" />}
                      </div>
                      
                      <div className="flex justify-center">
                          <UserBadge user={otherUser} showRating={true} />
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-1">{otherUser?.title || t.community.member}</p>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-gray-50">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t.workspace.budget}</span>
                          <span className="font-bold text-navy">{convertPrice(contract.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t.workspace.status}</span>
                          <span className={`font-bold capitalize ${contract.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                              {contract.status}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- SUBMIT WORK MODAL --- */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy">{t.workspace.submitDeliverables}</h3>
                    <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-red-500"><X className="text-2xl" /></button>
                </div>
                
                {submitStatus === "uploading" ? (
                    <div className="py-8 text-center">
                        <p className="text-navy font-bold mb-2">{t.workspace.uploading}</p>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{uploadProgress}%</p>
                    </div>
                ) : submitStatus === "success" ? (
                    <div className="py-8 text-center text-green-600 animate-in zoom-in">
                        <CheckCircleFill className="text-5xl mx-auto mb-2" />
                        <p className="font-bold">{t.workspace.submittedSuccess}</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            
                            {submitStatus === "error" && (
                                <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                                    <ExclamationCircleFill /> {errorMessage}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-navy uppercase mb-2">{t.workspace.uploadFiles}</label>
                                
                                {deliverableFiles.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                            {deliverableFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                                    <div className="flex items-center gap-3 overflow-hidden text-green-700">
                                                        <div className="bg-green-200 p-1.5 rounded text-green-800"><FileEarmarkText /></div>
                                                        <p className="text-xs font-bold truncate max-w-[180px]">{file.name}</p>
                                                    </div>
                                                    <button onClick={() => removeFile(idx)} className="text-green-500 hover:text-red-500 p-1"><X className="text-xl" /></button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer mb-4 hover:bg-gray-50 transition-colors">
                                    <CloudUpload className="mx-auto text-3xl text-gray-400 mb-2"/>
                                    <span className="text-sm font-bold text-gray-500">{t.postJob.uploadClick}</span>
                                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>

                            <textarea value={deliverableNote} onChange={e => setDeliverableNote(e.target.value)} placeholder={t.workspace.addNote} className="w-full border p-3 rounded-lg text-sm text-navy bg-white focus:border-navy outline-none focus:border-navy h-24 resize-none"></textarea>
                        </div>

                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                            <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-2 text-gray-500 font-bold bg-gray-100 rounded-lg hover:bg-gray-200">{t.proposal.cancel}</button>
                            <button onClick={handleSubmitWork} className="flex-1 py-2 bg-navy text-white font-bold rounded-lg hover:bg-navy-light shadow-lg">{t.proposal.submit}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
              <div className="relative w-full max-w-4xl h-[90vh] flex flex-col justify-center">
                  <button onClick={() => setPreviewFile(null)} className="absolute top-4 right-4 text-white hover:text-red-500 z-50"><X className="text-4xl" /></button>
                  
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                      {previewFile.type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewFile.url} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt="Preview" />
                      ) : (
                          <div className="bg-white p-10 rounded-2xl text-center">
                              <FileEarmarkText className="text-6xl text-gray-300 mx-auto mb-4" />
                              <p className="text-navy font-bold text-xl truncate max-w-md">{previewFile.name}</p>
                              <p className="text-sm text-gray-500">{t.workspace.previewUnavailable}</p>
                          </div>
                      )}
                  </div>

                  <div className="mt-4 flex justify-center pb-4">
                      <button 
                        onClick={() => handleDownload(previewFile.url, previewFile.name)}
                        className="bg-white text-navy px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:bg-gold transition-colors"
                      >
                          <Download /> {t.workspace.downloadFile}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-navy mb-2">{t.workspace.releasePayment}</h3>
                  <p className="text-sm text-gray-500 mb-6">{t.workspace.releasePaymentDesc}</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2 text-gray-500 bg-gray-100 rounded-lg">{t.proposal.cancel}</button>
                      <button onClick={handleApprove} className="flex-1 py-2 bg-green-600 text-white rounded-lg">{t.manage.confirmHire}</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- DISPUTE MODAL --- */}
      {showDisputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {disputeStatus === "success" ? (
                      <div className="p-8 flex flex-col items-center justify-center text-center animate-in zoom-in">
                          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4"><ShieldLock /></div>
                          <h3 className="text-xl font-bold text-navy mb-2">{t.workspace.disputeFiled}</h3>
                          <p className="text-sm text-gray-500">{t.workspace.disputeFiledDesc}</p>
                      </div>
                  ) : (
                      <>
                          <div className="p-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
                              <div className="flex items-center gap-2 text-red-700">
                                  <ExclamationTriangle className="text-xl" />
                                  <h3 className="font-bold text-lg">{t.workspace.reportProblem}</h3>
                              </div>
                              <button onClick={() => setShowDisputeModal(false)} className="text-red-400 hover:text-red-700"><X className="text-2xl" /></button>
                          </div>
                          
                          <div className="p-6 space-y-4 overflow-y-auto">
                              {disputeStatus === "error" && (
                                  <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                                      <ExclamationCircleFill /> {errorMessage}
                                  </div>
                              )}
                              
                              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  {t.workspace.disputeWarning}
                              </p>

                              {/* REASON INPUT */}
                              <div>
                                  <label className="block text-xs font-bold text-navy uppercase mb-1">{t.workspace.reason}</label>
                                  <div className="relative">
                                      <select 
                                          value={disputeReason} 
                                          onChange={(e) => setDisputeReason(e.target.value)}
                                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-navy bg-white focus:border-navy outline-none focus:border-red-500 appearance-none"
                                      >
                                          <option value="no_submission">{t.workspace.reasonNoSubmission}</option>
                                          <option value="poor_quality">{t.workspace.reasonPoorQuality}</option>
                                          <option value="payment_issue">{t.workspace.reasonPayment}</option>
                                          <option value="other">{t.workspace.reasonOther}</option>
                                      </select>
                                  </div>
                              </div>

                              {/* DESCRIPTION INPUT */}
                              <div>
                                  <label className="block text-xs font-bold text-navy uppercase mb-1">{t.postJob.description}</label>
                                  <textarea 
                                      value={disputeDescription}
                                      onChange={(e) => setDisputeDescription(e.target.value)}
                                      placeholder={t.workspace.disputePlaceholder}
                                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm h-32 resize-none text-navy bg-white focus:border-navy outline-none focus:border-red-500"
                                  />
                              </div>

                              {/* EVIDENCE UPLOAD */}
                              <div>
                                  <label className="block text-xs font-bold text-navy uppercase mb-1">{t.workspace.evidence}</label>
                                  <div 
                                    onClick={() => disputeFileRef.current?.click()}
                                    className="w-full p-3 bg-white border border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1"
                                  >
                                      <CloudUpload className="text-xl text-gray-400"/>
                                      <span className="text-xs font-bold text-gray-500">{t.workspace.uploadEvidence}</span>
                                      <input type="file" multiple ref={disputeFileRef} className="hidden" onChange={handleDisputeFileChange} />
                                  </div>
                                  
                                  {/* File List */}
                                  {disputeFiles.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                          {disputeFiles.map((f, i) => (
                                              <div key={i} className="flex justify-between items-center text-xs bg-gray-100 p-2 rounded">
                                                  <span className="truncate max-w-[200px]">{f.name}</span>
                                                  <button onClick={() => setDisputeFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                                                      <X />
                                                  </button>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
                              <button onClick={() => setShowDisputeModal(false)} className="flex-1 py-3 text-gray-500 font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-100">{t.proposal.cancel}</button>
                              <button 
                                  onClick={handleDispute} 
                                  disabled={disputeStatus === "loading" || !disputeDescription.trim()} 
                                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg disabled:opacity-50 transition-colors"
                              >
                                  {disputeStatus === "loading" ? t.workspace.filing : t.workspace.fileDispute}
                              </button>
                          </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* --- RATING MODAL --- */}
      {showRatingModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center">
                  <div className="w-16 h-16 bg-gold/20 text-gold rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                      <StarFill />
                  </div>
                  
                  <h3 className="text-xl font-bold text-navy mb-1">{t.workspace.rateExperience}</h3>
                  <p className="text-sm text-gray-500 mb-6">{t.workspace.ratePrompt} {otherUser?.name}?</p>

                  <div className="flex justify-center gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                              key={star}
                              onClick={() => setRating(star)}
                              className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? 'text-gold' : 'text-gray-200'}`}
                          >
                              {star <= rating ? <StarFill /> : <Star />}
                          </button>
                      ))}
                  </div>

                  <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t.workspace.ratePlaceholder}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-navy bg-white focus:border-navy outline-none focus:border-gold mb-6 resize-none h-24"
                  />

                  <button 
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || rating === 0}
                      className="w-full py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light shadow-lg disabled:opacity-50 transition-all"
                  >
                      {isSubmittingReview ? t.workspace.submitting : t.workspace.submitReview}
                  </button>
                  
                  <button onClick={() => setShowRatingModal(false)} className="mt-4 text-xs font-bold text-gray-400 hover:text-navy">
                      {t.workspace.skipReview}
                  </button>
              </div>
          </div>
      )}

      {/* --- REVIEW FEEDBACK MODAL --- */}
      {feedback && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in zoom-in">
              <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {feedback.type === 'success' ? <ShieldCheck /> : <ExclamationTriangle />}
                  </div>
                  <h3 className="font-bold text-navy mb-1">{feedback.type === 'success' ? 'Success' : 'Error'}</h3>
                  <p className="text-sm text-gray-500 mb-6">{feedback.message}</p>
                  <button onClick={() => setFeedback(null)} className="w-full py-2 bg-gray-100 text-navy font-bold rounded-lg hover:bg-gray-200 transition-colors">
                      Close
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}