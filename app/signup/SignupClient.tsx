"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, Suspense } from "react";
import { 
    Person, Briefcase, CheckCircleFill, ExclamationCircleFill, 
    Globe, Tools, Check, ChevronDown, Phone, Envelope, Lock, Eye, EyeSlash, EnvelopeOpen
} from "react-bootstrap-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { AFRICAN_COUNTRIES, SKILLS_BY_CATEGORY, CATEGORY_NAMES } from "@/utils/data";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react"; 
import PageLoader from "@/components/PageLoader";

// --- SOCIAL LOGOS ---
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.42 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LinkedInLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077B5" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
    { code: "ar", label: "العربية" },
    { code: "sw", label: "Swahili" }
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  const roleParam = searchParams.get("role");
  const [userRole, setUserRole] = useState<"freelancer" | "client">(roleParam === "client" ? "client" : "freelancer");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "", 
    password: "",
    country: "Cameroon",
    customCountry: "", 
    category: "",
  });
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // NEW: State to track successful registration
  const [isRegistered, setIsRegistered] = useState(false);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
});

const checkPassword = (pass: string) => {
    setPasswordCriteria({
        length: pass.length >= 8,
        upper: /[A-Z]/.test(pass),
        lower: /[a-z]/.test(pass),
        number: /[0-9]/.test(pass),
        special: /[^A-Za-z0-9]/.test(pass)
    });
};

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      if (selectedSkills.length >= 5) return; 
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const setRoleCookie = (role: string) => {
      document.cookie = `afriq_signup_role=${role}; path=/; max-age=300`; // Expires in 5 mins
  };

  const handleSocialLogin = (e: React.MouseEvent, provider: string) => {
    e.preventDefault();
    
    // 1. Save the selected role so the server knows what to create
    setRoleCookie(userRole);
    
    // 2. Trigger Social Sign In
    signIn(provider.toLowerCase(), { callbackUrl: "/dashboard/community" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!acceptedTerms) {
        setLoading(false);
        return setError(t.auth.errorTerms);
    }

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
    if (!isPasswordValid) {
        setLoading(false);
        return setError(t.auth.passWeak || "Password must meet all requirements.");
    }

    const finalCountry = formData.country === "Other" ? formData.customCountry : formData.country;
    if (!finalCountry) {
        setLoading(false);
        return setError(t.auth.errorCountry);
    }

    if (userRole === "freelancer" && selectedSkills.length === 0) {
        setLoading(false);
        return setError(t.auth.errorSkills);
    }

    const storedRefCode = localStorage.getItem("afriq_referral_code");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: userRole,
          country: finalCountry,
          skills: userRole === "freelancer" ? selectedSkills : [],
          referralCode: storedRefCode || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      localStorage.removeItem("afriq_referral_code");
      
      // ✅ CHANGED: Instead of redirecting, show success state locally
      setIsRegistered(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SUCCESS VIEW (VERIFY EMAIL) ---
  if (isRegistered) {
      return (
          <div className="w-full max-w-md mx-auto text-center py-10 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-sm">
                  <EnvelopeOpen />
              </div>
              <h2 className="text-3xl font-extrabold text-navy mb-2">{t.auth.checkEmail || "Check your email"}</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                  We've sent a verification link to <strong>{formData.email}</strong>.<br/>
                  Please check your inbox (and spam folder) to verify your account before logging in.
              </p>
              
              <Link href="/login" className="inline-block bg-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-light transition-all shadow-lg">
                  {t.auth.backToLogin || "Go to Login"}
              </Link>
          </div>
      );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16">
                  <Image 
                      src="/assets/images/logo-symbol.png" 
                      alt="AfriqGig" 
                      fill
                      className="object-contain"
                      priority
                  />
              </div>
          </div>
          <h2 className="text-3xl font-extrabold text-navy tracking-tight">{t.auth.joinTitle}</h2>
          <p className="text-gray-500 mt-2 text-sm">{t.auth.joinSubtitle}</p>
      </div>

      {/* ROLE TOGGLE */}
      <div className="grid grid-cols-2 gap-4 mb-8">
          <div onClick={() => setUserRole("freelancer")} className={`relative cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${userRole === "freelancer" ? "border-navy bg-navy/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
            {userRole === "freelancer" && <CheckCircleFill className="absolute top-2 right-2 text-navy" />}
            <Person className={`text-2xl ${userRole === "freelancer" ? "text-navy" : "text-gray-400"}`} />
            <span className="text-xs font-bold text-navy uppercase tracking-wide">{t.auth.iWantToWork}</span>
          </div>

          <div onClick={() => setUserRole("client")} className={`relative cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${userRole === "client" ? "border-gold bg-gold/5" : "border-gray-200 bg-white hover:border-gray-300"}`}>
             {userRole === "client" && <CheckCircleFill className="absolute top-2 right-2 text-gold" />}
            <Briefcase className={`text-2xl ${userRole === "client" ? "text-gold" : "text-gray-400"}`} />
            <span className="text-xs font-bold text-navy uppercase tracking-wide">{t.auth.iWantToHire}</span>
          </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3 animate-pulse"><ExclamationCircleFill /> <p className="text-sm font-medium">{error}</p></div>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">{t.auth.firstName}</label>
            <input type="text" required onChange={e => setFormData({...formData, firstName: e.target.value})} className="block w-full rounded-xl border-0 py-3 pl-4 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase mb-1">{t.auth.lastName}</label>
            <input type="text" required onChange={e => setFormData({...formData, lastName: e.target.value})} className="block w-full rounded-xl border-0 py-3 pl-4 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-none" />
          </div>
        </div>

        {/* Contact Fields */}
        <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase mb-1">{t.auth.email}</label>
              <div className="relative">
                  <Envelope className="absolute top-3.5 left-4 text-gray-400" />
                  <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} className="block w-full rounded-xl border-0 py-3 pl-11 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-none" placeholder="you@example.com" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-navy uppercase mb-1">{t.auth.phone}</label>
              <div className="relative">
                  <Phone className="absolute top-3.5 left-4 text-gray-400" />
                  <input type="tel" required onChange={e => setFormData({...formData, phone: e.target.value})} className="block w-full rounded-xl border-0 py-3 pl-11 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-none" placeholder="+237 6XX XXX XXX" />
              </div>
            </div>
        </div>

        {/* Password & Location */}
        <div className="space-y-4">
            <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">{t.auth.password}</label>
                    <div className="relative">
                        <Lock className="absolute top-3.5 left-4 text-gray-400" />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            onChange={e => {
                                setFormData({...formData, password: e.target.value});
                                checkPassword(e.target.value);
                            }} 
                            className="block w-full rounded-xl border-0 py-3 pl-11 pr-10 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-none" 
                            placeholder="••••••••" 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-3.5 right-4 text-gray-400 hover:text-navy"><EyeSlash /></button>
                    </div>

                    {/* ✅ NEW: Password Strength Indicator */}
                    {formData.password && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                            <span className={`flex items-center gap-1 ${passwordCriteria.length ? "text-green-600 font-bold" : "text-gray-400"}`}>
                                {passwordCriteria.length ? <CheckCircleFill/> : <div className="w-3 h-3 rounded-full border border-gray-300"/>} {t.auth.passLength || "8+ Characters"}
                            </span>
                            <span className={`flex items-center gap-1 ${passwordCriteria.upper ? "text-green-600 font-bold" : "text-gray-400"}`}>
                                {passwordCriteria.upper ? <CheckCircleFill/> : <div className="w-3 h-3 rounded-full border border-gray-300"/>} {t.auth.passUpper || "Uppercase Letter"}
                            </span>
                            <span className={`flex items-center gap-1 ${passwordCriteria.lower ? "text-green-600 font-bold" : "text-gray-400"}`}>
                                {passwordCriteria.lower ? <CheckCircleFill/> : <div className="w-3 h-3 rounded-full border border-gray-300"/>} {t.auth.passLower || "Lowercase Letter"}
                            </span>
                            <span className={`flex items-center gap-1 ${passwordCriteria.number ? "text-green-600 font-bold" : "text-gray-400"}`}>
                                {passwordCriteria.number ? <CheckCircleFill/> : <div className="w-3 h-3 rounded-full border border-gray-300"/>} {t.auth.passNumber || "Number"}
                            </span>
                            <span className={`flex items-center gap-1 ${passwordCriteria.special ? "text-green-600 font-bold" : "text-gray-400"}`}>
                                {passwordCriteria.special ? <CheckCircleFill/> : <div className="w-3 h-3 rounded-full border border-gray-300"/>} {t.auth.passSpecial || "Special Character"}
                            </span>
                        </div>
                    )}
                </div>

            <div>
               <label className="block text-xs font-bold text-navy uppercase mb-1">{t.auth.location}</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Globe className="text-gray-400" /></div>
                 <select className="block w-full rounded-xl border-0 py-3 pl-11 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white appearance-none outline-none" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
                    {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-4 text-xs text-gray-400 pointer-events-none" />
               </div>
               {formData.country === "Other" && <input type="text" placeholder={t.auth.otherCountry} className="mt-2 block w-full rounded-xl border-0 py-3 pl-4 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50" onChange={e => setFormData({...formData, customCountry: e.target.value})}/>}
            </div>
        </div>

        {/* SKILLS (Freelancer Only) */}
        {userRole === "freelancer" && (
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
            <div>
               <label className="block text-xs font-bold text-navy uppercase mb-1">1. {t.auth.chooseField}</label>
               <div className="relative">
                  <Tools className="absolute top-3.5 left-4 text-gray-400" />
                  <select 
                      className="block w-full rounded-xl border-0 py-3 pl-11 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-navy sm:text-sm bg-gray-50/50 appearance-none outline-none" 
                      value={formData.category} 
                      onChange={e => { setFormData({...formData, category: e.target.value}); setSelectedSkills([]); }}
                  >
                      <option value="">{t.auth.skillCategory}...</option>
                      {CATEGORY_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 text-xs text-gray-400 pointer-events-none" />
               </div>
            </div>

            {formData.category && SKILLS_BY_CATEGORY[formData.category] && (
              <div className="animate-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-navy uppercase mb-2">2. {t.auth.selectSkills} (Max 5)</label>
                
                {/* NEW SEARCH BAR INSIDE SIGNUP */}
                <input 
                    type="text" 
                    placeholder="Search skills..." 
                    className="w-full mb-2 p-2 text-xs border border-gray-200 rounded-lg focus:border-navy outline-none"
                    onChange={(e) => {
                        // Simple local search filter for the displayed list
                        const term = e.target.value.toLowerCase();
                        const allButtons = document.querySelectorAll('.skill-btn');
                        allButtons.forEach((btn: any) => {
                            if (btn.textContent.toLowerCase().includes(term)) {
                                btn.style.display = 'flex';
                            } else {
                                btn.style.display = 'none';
                            }
                        });
                    }}
                />

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border border-gray-100 p-2 rounded-lg">
                   {SKILLS_BY_CATEGORY[formData.category].map(skill => (
                     <button 
                        key={skill} 
                        type="button" 
                        onClick={() => toggleSkill(skill)} 
                        className={`skill-btn text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-1 ${selectedSkills.includes(skill) ? "bg-navy text-white border-navy shadow-md" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gold hover:text-navy"}`}
                     >
                       {selectedSkills.includes(skill) && <Check />} {skill}
                     </button>
                   ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-right">{selectedSkills.length === 0 ? t.auth.selectAtLeastOne : `${selectedSkills.length}/5 selected`}</p>
              </div>
            )}
          </div>
        )}

        {/* TERMS CHECKBOX (Mandatory) */}
        <div className="flex items-start gap-2 pt-2">
            <input 
                id="terms" 
                type="checkbox" 
                checked={acceptedTerms} 
                onChange={(e) => setAcceptedTerms(e.target.checked)} 
                className="mt-1 w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer select-none">
                {t.auth.agreeTermsStart} <Link href="/terms" className="text-navy font-bold hover:underline">{t.auth.terms}</Link> {t.auth.and} <Link href="/privacy" className="text-navy font-bold hover:underline">{t.auth.privacy}</Link>.
            </label>
        </div>

        <button type="submit" disabled={loading} className={`flex w-full justify-center rounded-2xl bg-navy px-3 py-4 text-sm font-bold text-white shadow-lg hover:bg-navy-light hover:shadow-xl active:scale-95 transition-all ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
           {loading ? t.auth.creating : t.auth.createAccount}
        </button>
      </form>
      
      {/* SOCIALS */}
        <div className="mt-8">
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                    <span className="bg-white px-4 text-gray-400">{t.auth.orContinue}</span>
                </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                <button type="button" onClick={(e) => handleSocialLogin(e, "Google")} className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                    <GoogleLogo />
                </button>
                <button type="button" onClick={(e) => handleSocialLogin(e, "GitHub")} className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                    <GitHubLogo />
                </button>
                <button type="button" onClick={(e) => handleSocialLogin(e, "LinkedIn")} className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                    <LinkedInLogo />
                </button>
                </div>
        </div>

      <p className="mt-10 text-center text-sm text-gray-500">
        {t.auth.alreadyHaveAccount} <Link href="/login" className="font-bold text-navy hover:text-gold underline decoration-gold/30 hover:decoration-gold decoration-2 underline-offset-4">{t.auth.login}</Link>
      </p>
    </div>
  );
}

export default function RegisterContent() {
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (langRef.current && !langRef.current.contains(event.target as Node)) {
              setIsLangOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      
      {/* LEFT: SIDEBAR (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0">
              <Image 
                  src="/assets/images/register-sidebar.webp"
                  alt="Register Background"
                  fill
                  className="object-cover"
                  priority
              />
              <div className="absolute inset-0 bg-navy/70 mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 text-center text-white max-w-lg p-12">
              <h1 className="text-4xl font-extrabold mb-6 leading-tight drop-shadow-lg">{t.auth.joinTitle}</h1>
              <p className="text-blue-100 text-lg leading-relaxed font-medium drop-shadow-md">{t.auth.joinSubtitle}</p>
          </div>
      </div>

      {/* RIGHT: FORM */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative bg-white">
          {/* Custom Language Dropdown */}
          <div className="absolute top-6 right-6 z-20" ref={langRef}>
            <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl border border-gray-200 transition-colors shadow-sm"
            >
                <Globe className="text-navy" />
                <span className="text-xs font-bold text-navy uppercase">{language}</span>
                <ChevronDown className={`text-xs text-gray-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isLangOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1"
                    >
                        {LANGUAGES.map((langOption) => (
                            <button
                                key={langOption.code}
                                onClick={() => { setLanguage(langOption.code as any); setIsLangOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 transition-colors ${language === langOption.code ? 'text-navy bg-gray-50' : 'text-gray-600'}`}
                            >
                                {langOption.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
          </Suspense>
      </div>
    </main>
  );
}