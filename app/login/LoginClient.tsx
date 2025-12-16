"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Envelope, Lock, CheckCircleFill, ExclamationCircleFill, Eye, EyeSlash, Phone, Globe, ChevronDown } from "react-bootstrap-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, getSession } from "next-auth/react";
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

// Helper to send logs to your VS Code Terminal
const logToServer = async (label: string, message: string, data?: any) => {
    try {
        await fetch("/api/debug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label, message, data })
        });
    } catch (e) {
        // Fail silently if logging fails
    }
};

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, setLanguage } = useLanguage();
  
  const registered = searchParams.get("registered");
  const returnUrl = searchParams.get("returnUrl"); 
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
      const storedUser = localStorage.getItem("afriqUser");
      if (storedUser) {
          router.replace(returnUrl ? decodeURIComponent(returnUrl) : "/dashboard/community");
      } else {
          setCheckingAuth(false); 
      }
  }, [router, returnUrl]);

  useEffect(() => {
    if (registered) setShowSuccess(true);
  }, [registered]);

  useEffect(() => {
    // If the URL has an error param related to headers or server loop, clear cookies
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error") === "Configuration") {
       // This is a nuclear option for stuck users
       console.warn("⚠️ Clearing cookies to fix session error");
       document.cookie.split(";").forEach((c) => {
         document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
       });
    }
  }, []);

  // Click outside listener for language dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (langRef.current && !langRef.current.contains(event.target as Node)) {
              setIsLangOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (checkingAuth) return <div className="py-20"><PageLoader /></div>;

  const handleSocialLogin = (provider: string) => {
    signIn(provider.toLowerCase(), { callbackUrl: "/dashboard/community" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(false);
    setError("");
    setLoading(true);

    // LOG 1: Start
    await logToServer("LOGIN", "Attempting login for identifier:", identifier);

    try {
      const payload: any = {
        identifier: identifier, 
        password: password,
        redirect: false,
      };

      if (requires2FA) payload.otp = otp;

      const result = await signIn("credentials", payload);
      
      // LOG 2: Result from NextAuth
      await logToServer("LOGIN", "SignIn Result received:", result);

      if (result?.error) {
        await logToServer("LOGIN", "Login Failed with error:", result.error);
        
        if (result.error === "2FA_REQUIRED") {
            setRequires2FA(true);
            setLoading(false);
            return; 
        }

        setError(t.auth.invalidCreds);
        setLoading(false);
        return;
      }

      // LOG 3: Check Session
      const session = await getSession();
      await logToServer("LOGIN", "Session retrieved after login:", session);

      if (session?.user) {
          localStorage.setItem("afriqUser", JSON.stringify(session.user));
          
          const target = returnUrl ? decodeURIComponent(returnUrl) : "/dashboard/community";
          await logToServer("LOGIN", `Redirecting user to: ${target}`);
          
          router.refresh(); 
          router.push(target);
      } else {
          await logToServer("LOGIN", "CRITICAL: Login success but Session is null/undefined!");
          setError("Login succeeded but session failed. Please try again.");
          setLoading(false);
      }

    } catch (err: any) {
      await logToServer("LOGIN", "CRASH EXCEPTION during login:", err.message);
      setError(t.auth.unexpectedError);
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      
      {/* LEFT: VISUAL SIDEBAR (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
          {/* Background Image */}
          <div className="absolute inset-0">
              <Image 
                  src="/assets/images/login-sidebar.webp" 
                  alt="Login Background"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 0vw, 50vw"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-navy/70 mix-blend-multiply"></div>
          </div>
          
          <div className="relative z-10 text-center text-white max-w-lg p-12">
              <h1 className="text-4xl font-extrabold mb-6 leading-tight drop-shadow-lg">Build Your Future <br/>with AfriqGig</h1>
              <p className="text-blue-100 text-lg leading-relaxed font-medium drop-shadow-md">
                  Join the fastest growing network of African professionals. Connect, collaborate, and succeed globally.
              </p>
          </div>
      </div>

      {/* RIGHT: FORM AREA */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative bg-white">
          
          {/* CUSTOM LANGUAGE DROPDOWN */}
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
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 10 }}
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

        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
            {/* HEADER */}
            <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                    <div className="relative w-20 h-20">
                        <Image 
                            src="/assets/images/logo-symbol.png" 
                            alt="AfriqGig Symbol" 
                            fill
                            className="object-contain drop-shadow-md"
                            priority
                        />
                    </div>
                </div>
                <h2 className="text-3xl font-extrabold text-navy tracking-tight">
                    {requires2FA ? "Two-Factor Auth" : t.auth.loginTitle}
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                    {requires2FA ? "Enter the code from your Authenticator App" : t.auth.loginSubtitle}
                </p>
            </div>

            {/* SUCCESS BANNER */}
            {showSuccess && !requires2FA && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex items-start gap-3 shadow-sm">
                <CheckCircleFill className="text-xl mt-0.5" />
                <div>
                    <h4 className="font-bold text-sm">{t.auth.accountCreated}</h4>
                    <p className="text-xs">{t.auth.signInNew}</p>
                </div>
                </div>
            )}

            {/* ERROR BANNER */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3 animate-pulse">
                <ExclamationCircleFill className="text-xl" />
                <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
                
                {!requires2FA ? (
                    <>
                        {/* Method Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                                type="button" 
                                onClick={() => { setMethod("email"); setIdentifier(""); }} 
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${method === "email" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"}`}
                            >
                                {t.auth.email}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setMethod("phone"); setIdentifier(""); }} 
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${method === "phone" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"}`}
                            >
                                {t.auth.phone}
                            </button>
                        </div>

                        {/* Identifier Input */}
                        <div>
                        <label className="block text-xs font-bold text-navy uppercase mb-1 ml-1">
                            {method === "email" ? t.auth.email : t.auth.phone}
                        </label>
                        <div className="relative group">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 transition-colors group-focus-within:text-navy text-gray-400">
                            {method === "email" ? <Envelope /> : <Phone />}
                            </div>
                            <input
                            type={method === "email" ? "email" : "tel"}
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="block w-full rounded-2xl border-0 py-3.5 pl-11 text-navy shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-none"
                            placeholder={method === "email" ? "you@example.com" : "+237 6XX XXX XXX"}
                            />
                        </div>
                        </div>

                        {/* Password Input */}
                        <div>
                        <div className="flex items-center justify-between mb-1 ml-1">
                            <label className="block text-xs font-bold text-navy uppercase">
                            {t.auth.password}
                            </label>
                            <a href="/forgot-password" className="text-xs font-bold text-gold hover:underline">
                            {t.auth.forgotPassword}
                            </a>
                        </div>
                        <div className="relative group">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 transition-colors group-focus-within:text-navy text-gray-400">
                            <Lock />
                            </div>
                            <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-2xl border-0 py-3.5 pl-11 pr-10 text-navy shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-navy sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-none"
                            placeholder="••••••••"
                            />
                            <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-navy transition-colors"
                            >
                            {showPassword ? <EyeSlash /> : <Eye />}
                            </button>
                        </div>
                        </div>
                    </>
                ) : (
                    // --- 2FA INPUT UI ---
                    <div className="animate-in slide-in-from-right">
                        <label className="block text-xs font-bold text-navy uppercase mb-1 ml-1">
                            Authentication Code
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="block w-full text-center text-2xl font-mono tracking-[0.5em] rounded-2xl border-0 py-4 text-navy shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-navy bg-gray-50/50 focus:bg-white transition-all outline-none"
                            placeholder="000000"
                        />
                        <button 
                            type="button" 
                            onClick={() => setRequires2FA(false)} 
                            className="text-xs text-gray-500 hover:text-navy mt-4 w-full text-center underline"
                        >
                            Back to Login
                        </button>
                    </div>
                )}

                <button
                type="submit"
                disabled={loading}
                className={`flex w-full justify-center rounded-2xl bg-navy px-3 py-4 text-sm font-bold text-white shadow-lg hover:bg-navy-light hover:shadow-xl active:scale-95 transition-all ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> 
                        {requires2FA ? "Verifying..." : t.auth.signingIn}
                    </span>
                ) : (requires2FA ? "Verify" : t.auth.signin)}
                </button>
            </form>

            {/* --- SOCIAL LOGIN (Hide during 2FA) --- */}
            {!requires2FA && (
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
                    <button type="button" onClick={() => handleSocialLogin("Google")} className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                        <GoogleLogo />
                    </button>
                    <button type="button" onClick={() => handleSocialLogin("GitHub")} className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                        <GitHubLogo />
                    </button>
                    <button type="button" onClick={() => handleSocialLogin("LinkedIn")} className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                        <LinkedInLogo />
                    </button>
                    </div>
                </div>
            )}

            {!requires2FA && (
                <p className="mt-10 text-center text-sm text-gray-500">
                    {t.auth.newToAfriqGig}{' '}
                    <Link href="/signup" className="font-bold text-navy hover:text-gold transition-colors underline decoration-gold/30 hover:decoration-gold decoration-2 underline-offset-4">
                    {t.auth.createAccount}
                    </Link>
                </p>
            )}
        </div>
      </div>
    </main>
  );
}