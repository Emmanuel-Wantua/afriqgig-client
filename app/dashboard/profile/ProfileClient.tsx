"use client";

import { useState, useEffect, useRef } from "react";
import { PersonCircle, Pencil, Save, GeoAlt, Briefcase, Camera, X, PatchCheckFill,
    PlusLg, Trash, Link45deg, Award, Globe, StarFill, CheckCircleFill,
    ExclamationTriangleFill, EyeSlashFill, Envelope, Phone
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { uploadToCloudinary } from "@/utils/upload";
import PageLoader from "@/components/PageLoader";
import { MASTER_SKILL_LIST, INTEREST_TOPICS } from "@/utils/data";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate"; // Import Hook

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

export default function ProfileContent() {
  const { t, user: contextUser, convertPrice } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
      name: "",
      title: "",
      bio: "",
      country: "",
      rateType: "hourly",
      hourlyRate: 0,
      skills: [] as string[],
      interests: [] as string[],
      portfolio: [] as any[],
      certifications: [] as any[],
      experience: [] as any[],
      education: [] as any[],
      avatar: "",
      coverPhoto: "",
      languages: [] as { name: string, level: string }[],
      externalPortfolio: "",
      email: "", 
      phone: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);

  const [newLanguage, setNewLanguage] = useState({ name: "", level: "Conversational" });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (contextUser?._id) fetchProfile();
  }, [contextUser]);

  const fetchProfile = async () => {
      try {
          const res = await fetch(`/api/users/${contextUser._id}`);
          const data = await res.json();
          setProfile(data);
          setFormData({
              name: data.name || "",
              title: data.title || "",
              bio: data.bio || "",
              country: data.country || "",
              rateType: data.rateType || "hourly",
              hourlyRate: data.hourlyRate || 0,
              skills: data.skills || [],
              interests: data.interests || [],
              portfolio: data.portfolio || [],
              certifications: data.certifications || [],
              avatar: data.avatar || "",
              coverPhoto: data.coverPhoto || "",
              experience: data.experience || [],
              education: data.education || [],
              languages: Array.isArray(data.languages) && typeof data.languages[0] === 'object' 
                  ? data.languages 
                  : [],
              externalPortfolio: data.externalPortfolio || "",
              email: data.email || "",
              phone: data.phone || "",
          });
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const handleSave = async () => {
      setFeedback(null);
      setIsSaving(true);
      
      console.log("DEBUG: Saving Profile Payload:", formData); 

      try {
          const res = await fetch(`/api/users/${contextUser._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
          });

          const data = await res.json();
          console.log("DEBUG: API Response:", res.status, data);

          if (!res.ok) throw new Error(data.message || t.profile.saveError);

          setFeedback({ type: 'success', message: t.profile.saveSuccess });
          
          setTimeout(() => {
              setIsEditing(false);
              setFeedback(null);
              fetchProfile(); 
          }, 1500);

      } catch (error: any) {
          setFeedback({ type: 'error', message: error.message });
      } finally {
          setIsSaving(false);
      }
  };

  const handleSkillInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSkillInput(val);
      if (val.length > 1) {
          const matches = MASTER_SKILL_LIST.filter(s => 
              s.toLowerCase().includes(val.toLowerCase()) && 
              !formData.skills.includes(s)
          ).slice(0, 10);
          setSkillSuggestions(matches);
      } else {
          setSkillSuggestions([]);
      }
  };

  const addSkill = (skill: string) => {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      setSkillInput("");
      setSkillSuggestions([]);
  };

  const removeSkill = (skill: string) => {
      setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleFileUpload = async (type: "avatar" | "cover" | "portfolio", file: File) => {
      const secureUrl = await uploadToCloudinary(file);
      
      if (!secureUrl) {
          alert(t.workspace.errorUpload);
          return;
      }

      if (type === "avatar") {
          setFormData(prev => ({ ...prev, avatar: secureUrl }));
          setProfile((prev: any) => ({ ...prev, avatar: secureUrl })); 
      } else if (type === "cover") {
          setFormData(prev => ({ ...prev, coverPhoto: secureUrl }));
          setProfile((prev: any) => ({ ...prev, coverPhoto: secureUrl }));
      } else if (type === "portfolio") {
          const newProject = {
              title: "New Project",
              link: "",
              image: secureUrl, 
              description: "Project Description"
          };
          setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, newProject] }));
      }
  };

  const updatePortfolioItem = (index: number, field: string, value: string) => {
      const updatedPortfolio = [...formData.portfolio];
      updatedPortfolio[index] = { ...updatedPortfolio[index], [field]: value };
      setFormData({ ...formData, portfolio: updatedPortfolio });
  };

  const removePortfolioItem = (index: number) => {
      const updatedPortfolio = formData.portfolio.filter((_, i) => i !== index);
      setFormData({ ...formData, portfolio: updatedPortfolio });
  };

  const addCert = () => {
      const newCert = { name: "", issuer: "", date: new Date(), link: "" };
      setFormData(prev => ({ ...prev, certifications: [...prev.certifications, newCert] }));
  };

  const updateCertItem = (index: number, field: string, value: string) => {
      const updatedCerts = [...formData.certifications];
      updatedCerts[index] = { ...updatedCerts[index], [field]: value };
      setFormData({ ...formData, certifications: updatedCerts });
  };

  const removeCert = (index: number) => {
      setFormData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
  };

  const addExperience = () => {
      setFormData(prev => ({ ...prev, experience: [...prev.experience, { role: "", company: "", year: "", description: "" }] }));
  };
  
  const updateExperience = (index: number, field: string, value: string) => {
      const updated = [...formData.experience];
      updated[index] = { ...updated[index], [field]: value };
      setFormData({ ...formData, experience: updated });
  };

  const removeExperience = (index: number) => {
      setFormData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  };

  const addEducation = () => {
      setFormData(prev => ({ ...prev, education: [...prev.education, { degree: "", school: "", year: "" }] }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
      const updated = [...formData.education];
      updated[index] = { ...updated[index], [field]: value };
      setFormData({ ...formData, education: updated });
  };

  const removeEducation = (index: number) => {
      setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const addLanguage = () => {
      if (newLanguage.name.trim()) {
          setFormData(prev => ({ 
              ...prev, 
              languages: [...prev.languages, { ...newLanguage, name: newLanguage.name.trim() }] 
          }));
          setNewLanguage({ name: "", level: "Conversational" });
      }
  };

  const removeLanguage = (index: number) => {
      setFormData(prev => ({ 
          ...prev, 
          languages: prev.languages.filter((_, i) => i !== index) 
      }));
  };

  const getProgressWidth = (level: string) => {
      switch(level) {
          case "Basic": return "25%";
          case "Conversational": return "50%";
          case "Fluent": return "80%";
          case "Native": return "100%";
          default: return "50%";
      }
  };

  const isFreelancer = profile?.role === "freelancer";

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* VERIFICATION WARNING */}
      {profile && !profile.isVerified && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                      <PatchCheckFill />
                  </div>
                  <div>
                      <h4 className="font-bold text-orange-800 text-sm">{t.dashboard.verifyTitle}</h4>
                      <p className="text-xs text-orange-600">{t.dashboard.verifyText}</p>
                  </div>
              </div>
              <a href="/dashboard/settings" className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors">
                  {t.dashboard.verifyBtn}
              </a>
          </div>
      )}

      {/* --- FEEDBACK BANNER --- */}
      {feedback && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
              <div className={`text-xl ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback.type === 'success' ? <CheckCircleFill /> : <ExclamationTriangleFill />}
              </div>
              <div>
                  <h4 className="font-bold text-sm">{feedback.type === 'success' ? t.settings.success : 'Error'}</h4>
                  <p className="text-xs opacity-90">{feedback.message}</p>
              </div>
          </div>
      )}
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="h-48 bg-navy relative">
              {(isEditing ? formData.coverPhoto : profile?.coverPhoto) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={isEditing ? formData.coverPhoto : profile.coverPhoto} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                  <div className="w-full h-full bg-gradient-to-r from-navy to-blue-900"></div>
              )}
              {isEditing && (
                  <button 
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
                  >
                      <Camera />
                  </button>
              )}
              <input type="file" ref={coverInputRef} className="hidden" onChange={e => e.target.files && handleFileUpload("cover", e.target.files[0])} />
          </div>
          
          <div className="px-6 pb-6 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12">
                  <div className="relative">
                      <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg">
                          <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden relative">
                              {(isEditing ? formData.avatar : profile?.avatar) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={isEditing ? formData.avatar : profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                              ) : <PersonCircle className="w-full h-full text-gray-400" />}
                          </div>
                      </div>
                      {isEditing && (
                          <button 
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute bottom-1 right-1 bg-gold text-navy p-2 rounded-full shadow-md hover:scale-110 transition-transform z-10"
                          >
                              <Camera />
                          </button>
                      )}
                      <input type="file" ref={avatarInputRef} className="hidden" onChange={e => e.target.files && handleFileUpload("avatar", e.target.files[0])} />
                  </div>

                  <div className="flex-1 mb-2">
                      <div className="flex items-center gap-2">
                          {isEditing ? (
                              <input 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="text-2xl font-bold text-navy w-full border-b border-gray-300 outline-none bg-transparent"
                              />
                          ) : (
                              <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                                  {profile?.name}
                                  {profile?.isVerified && <PatchCheckFill className="text-blue-500 text-lg" title="Verified" />}
                              </h1>
                          )}
                      </div>
                      
                      {isEditing ? (
                          <input 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            placeholder={isFreelancer ? "e.g. Senior Web Developer" : "e.g. CEO"}
                            className="text-sm text-gray-500 w-full border-b border-gray-300 outline-none mt-1 bg-transparent"
                          />
                      ) : (
                          <p className="text-sm text-gray-500">{profile?.title || (isFreelancer ? t.profile.noTitle : "")}</p>
                      )}
                      
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><GeoAlt /> {profile?.country}</span>
                              <span className="flex items-center gap-1"><Briefcase /> {profile?.role === 'client' ? t.roles.client : t.roles.freelancer}</span>
                              {isFreelancer && (
                                  <span className="flex items-center gap-1 bg-gold/10 text-navy px-2 py-0.5 rounded font-bold">
                                      <StarFill className="text-gold" /> {profile?.rating?.toFixed(1) || "New"}
                                  </span>
                              )}
                          </div>
                  </div>

                  <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${
                        isEditing ? "bg-green-600 text-white hover:bg-green-700" : "bg-white border border-gray-200 text-navy hover:bg-gray-50"
                    }`}
                  >
                      {isEditing ? (
                          <>{isSaving ? t.community.posting : <><Save /> {t.profile.save}</>}</>
                      ) : (
                          <><Pencil /> {t.profile.edit}</>
                      )}
                  </button>
              </div>
          </div>
      </div>

      {/* --- PRIVATE CONTACT DETAILS (Only Visible to You) --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
          
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                  <h3 className="font-bold text-navy">Private Contact Info</h3>
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                      <EyeSlashFill /> Visible only to you
                  </span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EMAIL FIELD */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                  {isEditing ? (
                      <input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm text-navy bg-white focus:border-navy outline-none"
                      />
                  ) : (
                      <div className="flex items-center gap-2 text-navy font-medium">
                          <Envelope /> {profile?.email}
                      </div>
                  )}
              </div>

              {/* PHONE FIELD */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                  {isEditing ? (
                      <input 
                          type="tel" 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm text-navy bg-white focus:border-navy outline-none"
                          placeholder="+237..."
                      />
                  ) : (
                      <div className="flex items-center gap-2 text-navy font-medium">
                          <Phone /> {profile?.phone || "Not set"}
                      </div>
                  )}
              </div>
          </div>
          
          {isEditing && (
              <p className="text-[10px] text-orange-600 mt-3 flex items-center gap-1">
                  <ExclamationTriangleFill /> Changing your email will require re-verification.
              </p>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`space-y-6 ${isFreelancer ? 'md:col-span-2' : 'md:col-span-3'}`}>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-navy mb-4">{t.profile.bio}</h3>
                  {isEditing ? (
                      <textarea 
                        rows={5}
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm text-navy bg-white focus:border-navy outline-none focus:border-navy"
                        placeholder={t.profile.bioPlaceholder}
                      />
                  ) : (
                        // TRANSLATION HOOK HERE
                      <TranslatableText text={profile?.bio || t.profile.noBio} className="text-sm text-gray-600 leading-relaxed" />
                  )}
              </div>

              {/* EXPERIENCE SECTION */}
              {isFreelancer && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-navy">{t.profile.experience}</h3>
                          {isEditing && <button onClick={addExperience} className="text-xs font-bold text-navy flex items-center gap-1"><PlusLg /> {t.profile.add}</button>}
                      </div>

                      <div className="space-y-4">
                          {(isEditing ? formData.experience : profile?.experience || []).length === 0 && <p className="text-xs text-gray-400 italic">{t.profile.noExperience}</p>}
                          
                          {(isEditing ? formData.experience : profile?.experience || []).map((exp: any, i: number) => (
                              <div key={i} className="pl-4 border-l-2 border-gray-100 relative group">
                                  {isEditing ? (
                                      <div className="space-y-2">
                                          <div className="flex gap-2">
                                              <input value={exp.role} onChange={e => updateExperience(i, "role", e.target.value)} placeholder="Role" className="flex-1 p-2 border rounded-lg text-sm text-navy bg-white focus:border-navy font-bold" />
                                              <input value={exp.year} onChange={e => updateExperience(i, "year", e.target.value)} placeholder="Year" className="w-1/3 p-2 border rounded-lg text-sm text-navy bg-white focus:border-navy" />
                                          </div>
                                          <input value={exp.company} onChange={e => updateExperience(i, "company", e.target.value)} placeholder="Company" className="w-full p-2 border rounded-lg text-xs text-navy bg-white focus:border-navy" />
                                          <textarea value={exp.description} onChange={e => updateExperience(i, "description", e.target.value)} placeholder={t.postJob.description} className="w-full p-2 border rounded-lg text-xs text-navy bg-white focus:border-navy resize-none" rows={2} />
                                          <button onClick={() => removeExperience(i)} className="text-xs text-red-500 underline">{t.community.remove}</button>
                                      </div>
                                  ) : (
                                      <>
                                          <h4 className="font-bold text-navy text-sm">{exp.role}</h4>
                                          <p className="text-xs text-gray-500 mb-1">{exp.company} • {exp.year}</p>
                                          {/* TRANSLATABLE EXPERIENCE */}
                                          <TranslatableText text={exp.description} className="text-sm text-gray-600" />
                                      </>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* EDUCATION SECTION */}
              {isFreelancer && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-navy">{t.profile.education}</h3>
                          {isEditing && <button onClick={addEducation} className="text-xs font-bold text-navy flex items-center gap-1"><PlusLg /> {t.profile.add}</button>}
                      </div>

                      <div className="space-y-4">
                          {(isEditing ? formData.education : profile?.education || []).length === 0 && <p className="text-xs text-gray-400 italic">{t.profile.noEducation}</p>}

                          {(isEditing ? formData.education : profile?.education || []).map((edu: any, i: number) => (
                              <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                  {isEditing ? (
                                      <>
                                          <div className="flex gap-2">
                                              <input value={edu.degree} onChange={e => updateEducation(i, "degree", e.target.value)} placeholder="Degree" className="flex-1 p-2 border rounded-lg text-sm text-navy bg-white focus:border-navy font-bold" />
                                              <input value={edu.year} onChange={e => updateEducation(i, "year", e.target.value)} placeholder="Year" className="w-1/4 p-2 border rounded-lg text-sm text-navy bg-white focus:border-navy" />
                                          </div>
                                          <input value={edu.school} onChange={e => updateEducation(i, "school", e.target.value)} placeholder="School / University" className="w-full p-2 border rounded-lg text-xs text-navy bg-white focus:border-navy" />
                                          <button onClick={() => removeEducation(i)} className="text-xs text-red-500 text-left underline">{t.community.remove}</button>
                                      </>
                                  ) : (
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <h4 className="font-bold text-navy text-sm">{edu.degree}</h4>
                                              <p className="text-xs text-gray-500">{edu.school}</p>
                                          </div>
                                          <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">{edu.year}</span>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {isFreelancer && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-navy">{t.profile.portfolio || "Portfolio"}</h3>
                          {isEditing && (
                              <button onClick={() => portfolioInputRef.current?.click()} className="text-xs font-bold text-navy flex items-center gap-1 hover:underline">
                                  <PlusLg /> {t.profile.addProject}
                              </button>
                          )}
                          <input type="file" ref={portfolioInputRef} className="hidden" onChange={e => e.target.files && handleFileUpload("portfolio", e.target.files[0])} />
                      </div>

                      {/* External Link Input */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                              <Link45deg className="text-xl text-blue-600"/>
                              <h4 className="font-bold text-sm text-navy">{t.profile.externalLink}</h4>
                          </div>
                          {isEditing ? (
                              <input 
                                  value={formData.externalPortfolio} 
                                  onChange={(e) => setFormData({...formData, externalPortfolio: e.target.value})}
                                  placeholder="https://behance.net/username"
                                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-navy bg-white focus:border-navy outline-none focus:border-navy"
                              />
                          ) : formData.externalPortfolio ? (
                              <a href={formData.externalPortfolio} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline truncate block">
                                  {formData.externalPortfolio}
                              </a>
                          ) : (
                              <p className="text-xs text-gray-400 italic">{t.profile.noExternalLink}</p>
                          )}
                      </div>

                      {(isEditing ? formData.portfolio : profile?.portfolio || []).length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
                              {t.profile.noProjects}
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {(isEditing ? formData.portfolio : profile?.portfolio || []).map((project: any, idx: number) => (
                                  <div key={idx} className="group relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                                      <div className="aspect-video bg-gray-200 relative">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={project.image} className="w-full h-full object-cover" alt={project.title} />
                                          {isEditing && <button onClick={() => removePortfolioItem(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"><Trash /></button>}
                                      </div>
                                      <div className="p-3">
                                          {isEditing ? (
                                              <div className="space-y-2">
                                                  <input 
                                                    value={project.title} 
                                                    onChange={e => updatePortfolioItem(idx, "title", e.target.value)}
                                                    className="w-full text-sm font-bold border-b border-gray-300 text-navy bg-white focus:border-navy outline-none bg-transparent"
                                                    placeholder="Project Title"
                                                  />
                                                  <input 
                                                    value={project.link} 
                                                    onChange={e => updatePortfolioItem(idx, "link", e.target.value)}
                                                    className="w-full text-xs text-blue-600 border-b border-gray-300 outline-none bg-transparent"
                                                    placeholder="Link"
                                                  />
                                                  <input 
                                                    value={project.description} 
                                                    onChange={e => updatePortfolioItem(idx, "description", e.target.value)}
                                                    className="w-full text-xs text-gray-500 border-b border-gray-300 outline-none bg-transparent"
                                                    placeholder="Desc"
                                                  />
                                              </div>
                                          ) : (
                                              <>
                                                  <h4 className="font-bold text-sm text-navy truncate">{project.title}</h4>
                                                  {project.link && (
                                                      <a href={project.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-1 hover:underline">
                                                          <Link45deg /> {t.manage.view}
                                                      </a>
                                                  )}
                                              </>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
          </div>

          <div className="space-y-6">
              {isFreelancer && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-navy mb-4">{t.profile.certifications}</h3>
                      {isEditing && <button onClick={addCert} className="text-xs font-bold text-navy"><PlusLg /> {t.profile.add}</button>}
                  </div>
              )}
              
              {/* This section appeared duplicated in your original code, merging logic properly */}
               {isFreelancer && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                       <div className="space-y-3">
                          {(isEditing ? formData.certifications : profile?.certifications || []).length === 0 && <p className="text-xs text-gray-400">{t.profile.noCertifications}</p>}
                          
                          {(isEditing ? formData.certifications : profile?.certifications || []).map((cert: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-white p-2 rounded-lg text-gold"><Award className="text-xl" /></div>
                                      <div className="flex-1">
                                          {isEditing ? (
                                              <input 
                                                value={cert.name} 
                                                onChange={e => updateCertItem(idx, "name", e.target.value)}
                                                className="bg-transparent border-b border-gray-300 w-full text-sm text-navy bg-white focus:border-navy font-bold outline-none mb-1"
                                                placeholder="Certification Name"
                                              />
                                          ) : (
                                              <h4 className="text-sm font-bold text-navy">{cert.name}</h4>
                                          )}
                                          
                                          {isEditing ? (
                                              <input 
                                                value={cert.issuer} 
                                                onChange={e => updateCertItem(idx, "issuer", e.target.value)}
                                                className="bg-transparent border-b border-gray-300 w-full text-xs text-navy bg-white focus:border-navy text-gray-500 outline-none"
                                                placeholder="Issuer"
                                              />
                                          ) : (
                                              <p className="text-xs text-gray-500">{cert.issuer}</p>
                                          )}
                                      </div>
                                      {isEditing && <button onClick={() => removeCert(idx)} className="text-red-400"><X /></button>}
                                  </div>
                                  
                                  {isEditing ? (
                                      <input 
                                        value={cert.link || ""} 
                                        onChange={e => updateCertItem(idx, "link", e.target.value)}
                                        className="w-full text-xs text-blue-600 border-b border-gray-300 outline-none bg-transparent pl-10 text-navy bg-white focus:border-navy"
                                        placeholder="Link"
                                      />
                                  ) : cert.link && (
                                      <a href={cert.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 pl-10 hover:underline">
                                          <Globe /> {t.manage.view}
                                      </a>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {isFreelancer && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-navy mb-4">{t.profile.hourly}</h3>
                      {isEditing && (
                          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                              <button onClick={() => setFormData({...formData, rateType: "hourly"})} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${formData.rateType === "hourly" ? "bg-white shadow text-navy" : "text-gray-500"}`}>Hourly</button>
                              <button onClick={() => setFormData({...formData, rateType: "negotiated"})} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${formData.rateType === "negotiated" ? "bg-white shadow text-navy" : "text-gray-500"}`}>{t.dashboard.negotiable}</button>
                          </div>
                      )}
                      {(isEditing ? formData.rateType : profile?.rateType) === "hourly" ? (
                          isEditing ? (
                              <div className="flex items-center gap-2">
                                  <input type="number" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: Number(e.target.value)})} className="w-full p-2 border border-gray-200 rounded-lg text-lg font-bold text-green-600 outline-none" />
                                  <span className="text-xs text-gray-400">/hr</span>
                              </div>
                          ) : (
                              <p className="text-2xl font-bold text-green-600">{convertPrice(profile?.hourlyRate || 0)} <span className="text-sm text-gray-400 font-normal">/hr</span></p>
                          )
                      ) : (
                          <p className="text-lg font-bold text-navy italic">{t.profile.negotiable}</p>
                      )}
                  </div>
              )}

                {isFreelancer && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-navy mb-4">{t.profile.skills}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(isEditing ? formData.skills : profile?.skills || []).map((skill: string) => (
                                <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    {skill}
                                    {isEditing && <button onClick={() => removeSkill(skill)} className="hover:text-red-500"><X /></button>}
                                </span>
                            ))}
                        </div>
                        
                        {isEditing && (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={skillInput} 
                                    onChange={handleSkillInput} 
                                    placeholder={t.profile.addSkill} 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-xs text-navy bg-white focus:border-navy outline-none focus:border-navy" 
                                />
                                {skillSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-40 overflow-y-auto">
                                        {skillSuggestions.map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => addSkill(s)} 
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-navy font-medium"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* INTERESTS SECTION */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-navy mb-2">{t.profile.interests}</h3>
                    <p className="text-xs text-gray-500 mb-4">{t.profile.interestsDesc}</p>
                    
                    {isEditing ? (
                        /* EDIT MODE */
                        <div className="flex flex-wrap gap-2">
                            {INTEREST_TOPICS.map((topic) => {
                                const current = formData.interests || [];
                                const isSelected = current.includes(topic);
                                return (
                                    <button
                                        key={topic}
                                        onClick={() => {
                                            if (isSelected) {
                                                setFormData({ ...formData, interests: current.filter(i => i !== topic) });
                                            } else {
                                                setFormData({ ...formData, interests: [...current, topic] });
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
                                            isSelected 
                                            ? "bg-gold text-navy border-gold shadow-sm" 
                                            : "bg-white text-gray-500 border-gray-200 hover:border-navy hover:text-navy"
                                        }`}
                                    >
                                        {topic}
                                        {isSelected && <CheckCircleFill className="text-[10px]" />}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* VIEW MODE */
                        <div className="flex flex-wrap gap-2">
                            {(profile?.interests || []).length === 0 ? (
                                <span className="text-xs text-gray-400 italic">{t.profile.noInterests}</span>
                            ) : (
                                (profile?.interests || []).map((topic: string) => (
                                    <span key={topic} className="bg-navy/5 text-navy border border-navy/10 px-3 py-1.5 rounded-full text-xs font-bold">
                                        {topic}
                                    </span>
                                ))
                            )}
                        </div>
                    )}
                </div>

              {/* LANGUAGES (With Proficiency) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-navy mb-4">{t.profile.languages}</h3>
                    
                    <div className="space-y-4">
                        {(isEditing ? formData.languages : profile?.languages || []).map((lang: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-navy">{lang.name}</span>
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">{lang.level}</span>
                                        {isEditing && <button onClick={() => removeLanguage(i)} className="text-red-500"><X /></button>}
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 rounded-full" 
                                        style={{ width: getProgressWidth(lang.level) }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isEditing && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                            <input 
                                type="text" 
                                value={newLanguage.name} 
                                onChange={e => setNewLanguage({...newLanguage, name: e.target.value})} 
                                placeholder="Language..." 
                                className="flex-1 p-2 border border-gray-200 rounded-lg text-xs text-navy bg-white focus:border-navy outline-none"
                            />
                            <select 
                                value={newLanguage.level}
                                onChange={e => setNewLanguage({...newLanguage, level: e.target.value})}
                                className="p-2 border border-gray-200 rounded-lg text-xs text-navy bg-white focus:border-navy outline-none bg-white"
                            >
                                <option value="Basic">Basic</option>
                                <option value="Conversational">Conversational</option>
                                <option value="Fluent">Fluent</option>
                                <option value="Native">Native</option>
                            </select>
                            <button onClick={addLanguage} className="bg-navy text-white p-2 rounded-lg text-xs"><PlusLg /></button>
                        </div>
                    )}
                </div>
          </div>
      </div>
    </div>
  );
}