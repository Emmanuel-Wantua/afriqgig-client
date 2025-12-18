"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronRight, Upload, CurrencyExchange, CalendarDate,
  CheckCircleFill, ExclamationCircleFill, FileEarmarkText, X, Trash, ChevronDown
} from "react-bootstrap-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import { SPECIFIC_JOB_CATEGORIES, getSuggestedCategory } from "@/utils/data";
import { useLanguage } from "@/context/LanguageContext";

export default function PostJobContent() {
  const router = useRouter();
  const { t, currency, user: contextUser } = useLanguage(); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Custom Dropdown State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>(SPECIFIC_JOB_CATEGORIES);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("afriqUser");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    budget: "",
    deadline: "",
  });

  // --- SMART AUTO-SUGGEST LOGIC ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, title: val }));
    
    if (!val.trim()) {
        setFilteredCategories(SPECIFIC_JOB_CATEGORIES);
        return;
    }

    // 1. Use the new Smart Engine to find the best category match
    const suggested = getSuggestedCategory(val);
    const matchedCategories = new Set<string>();

    if (suggested) {
        matchedCategories.add(suggested);
    }

    // 2. Also search directly within category names (Fallback)
    const lowerVal = val.toLowerCase();
    SPECIFIC_JOB_CATEGORIES.forEach(cat => {
        if (cat.toLowerCase().includes(lowerVal)) {
            matchedCategories.add(cat);
        }
    });

    // 3. Update Dropdown List
    if (matchedCategories.size > 0) {
        setFilteredCategories(Array.from(matchedCategories));
        // Optional: Auto-open dropdown if a good match is found
        if (!isCategoryOpen) setIsCategoryOpen(true);
    } else {
        setFilteredCategories(SPECIFIC_JOB_CATEGORIES);
    }
  };

  // --- VALIDATION LOGIC ---
  const handleNext = () => {
    setError(""); 

    // Step 1 Validation
    if (step === 1) {
      if (!formData.title.trim()) return setError(t.postJob.errorTitle);
      if (!formData.category) return setError(t.postJob.errorCategory);
    }

    // Step 2 Validation
    if (step === 2) {
      if (!formData.description.trim()) return setError(t.postJob.errorDesc);
      if (formData.description.length < 20) return setError(t.postJob.errorDescShort);
    }

    setStep(step + 1);
  };

  // --- File Handling ---
  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handlePostJob = async () => {
    // Final Step Validation
    if (!formData.budget) return setError(t.postJob.errorBudget);
    if (!formData.deadline) return setError(t.postJob.errorDeadline);
    
    // Ensure we have a user ID
    if (!user?._id) return setError(t.postJob.errorLogin);
    
    setLoading(true);
    setError("");

    try {
      const payload = {
        clientId: user._id, 
        ...formData,
        budget: Number(formData.budget),
        attachments: selectedFiles.map(f => f.name),
        status: "open"
      };

      console.log("DEBUG: Posting Job Payload:", payload);

      const res = await fetch("/api/jobs", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || t.postJob.errorServer);

      router.push("/dashboard/client?jobPosted=true");

    } catch (err: any) {
      console.error("DEBUG: Submission Error:", err);
      setError(err.message || t.postJob.errorConnection);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto pb-24">
      
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/client" className="inline-flex items-center text-gray-400 hover:text-navy mb-4 text-sm font-bold">
          <ArrowLeft className="mr-2" /> {t.manage.back}
        </Link>
        <h1 className="text-2xl font-bold text-navy">{t.postJob.title}</h1>
        <p className="text-gray-500 text-sm">{t.postJob.subtitle}</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step >= i ? "bg-navy text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {step > i ? <CheckCircleFill /> : i}
            </div>
            {i < 3 && (
              <div className={`w-12 h-1 bg-gray-200 mx-2 ${step > i ? "bg-navy" : ""}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2 animate-in shake">
          <ExclamationCircleFill /> {error}
        </div>
      )}

      {/* Form Steps */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* STEP 1: Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-navy font-bold mb-2">{t.postJob.jobTitle} <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.title}
                onChange={handleTitleChange}
                placeholder={t.postJob.titlePlaceholder}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-2 focus:ring-navy/20 text-navy bg-white outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                {t.postJob.titleTip}
              </p>
            </div>

            <div className="relative" ref={categoryRef}>
              <label className="block text-navy font-bold mb-2">{t.postJob.category} <span className="text-red-500">*</span></label>
              
              {/* Custom Dropdown Trigger */}
              <button 
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className={`w-full p-3 rounded-xl border flex justify-between items-center bg-white transition-all ${
                    isCategoryOpen ? "border-navy ring-2 ring-navy/20" : "border-gray-200"
                }`}
              >
                <span className={formData.category ? "text-navy font-medium" : "text-gray-400"}>
                    {formData.category || t.postJob.selectCategory}
                </span>
                <ChevronDown className={`transition-transform text-gray-400 ${isCategoryOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Custom Dropdown Options */}
              {isCategoryOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in zoom-in-95 p-1">
                      {filteredCategories.length > 0 ? (
                          <>
                            {formData.title && filteredCategories.length < SPECIFIC_JOB_CATEGORIES.length && (
                                <div className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                    {t.postJob.suggested}
                                </div>
                            )}
                            
                            {filteredCategories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, category: cat }));
                                        setIsCategoryOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                        formData.category === cat 
                                        ? "bg-navy text-white font-bold" 
                                        : "text-gray-600 hover:bg-gray-50 hover:text-navy"
                                    }`}
                                >
                                    {cat}
                                    {formData.category === cat && <CheckCircleFill />}
                                </button>
                            ))}
                          </>
                      ) : (
                          <div className="p-4 text-center text-gray-400 text-sm">{t.postJob.noCategories}</div>
                      )}
                  </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-navy font-bold mb-2">{t.postJob.description} <span className="text-red-500">*</span></label>
              <textarea 
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={t.postJob.descPlaceholder}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-2 focus:ring-navy/20 text-navy bg-white outline-none transition-all resize-none"
              ></textarea>
              <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length} / 20 {t.postJob.charsMin}</p>
            </div>

            <div>
              <label className="block text-navy font-bold mb-2">{t.postJob.attachments}</label>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                multiple 
                accept=".pdf,.jpg,.png,.docx"
              />

              <div 
                onClick={handleFileClick}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-navy transition-all cursor-pointer mb-4"
              >
                <Upload className="text-2xl mb-2 text-navy" />
                <span className="text-sm">{t.postJob.uploadClick}</span>
                <span className="text-xs text-gray-400 mt-1">{t.postJob.uploadLimit}</span>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="border border-green-200 bg-green-50 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* PREVIEW THUMBNAIL */}
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-600 shadow-sm overflow-hidden border border-green-100">
                          {file.type.startsWith("image/") ? (
                              <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                              <FileEarmarkText className="text-lg" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-navy truncate max-w-[200px]">{file.name}</p>
                          <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              {/* Dynamic Currency Label */}
              <label className="block text-navy font-bold mb-2">{t.postJob.budget} ({currency}) <span className="text-red-500">*</span></label>
              <div className="relative">
                <CurrencyExchange className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                  type="number" 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  placeholder="50000"
                  className="w-full p-3 pl-10 rounded-xl border border-gray-200 focus:border-navy focus:ring-2 focus:ring-navy/20 text-navy bg-white outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-navy font-bold mb-2">{t.postJob.deadline} <span className="text-red-500">*</span></label>
              <div className="relative">
                <CalendarDate className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                  type="date" 
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full p-3 pl-10 rounded-xl border border-gray-200 focus:border-navy outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {t.proposal.cancel}
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button 
              onClick={handleNext} 
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-navy text-white hover:bg-navy-light transition-colors shadow-lg shadow-navy/20"
            >
              {t.postJob.nextStep} <ChevronRight />
            </button>
          ) : (
            <button 
              onClick={handlePostJob} 
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-gold text-navy hover:bg-gold-light transition-colors shadow-lg shadow-gold/20 ${loading ? "opacity-70 cursor-wait" : ""}`}
            >
              {loading ? t.community.posting : t.postJob.postNow}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}