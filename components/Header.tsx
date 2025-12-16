"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Translate, CurrencyExchange, ChevronDown, List, X } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";

// --- CONSTANTS ---
const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
    { code: "ar", label: "العربية" },
    { code: "sw", label: "Swahili" }
];
const CURRENCIES = ["XAF", "USD", "EUR", "NGN", "GHS", "KES"];

export default function Header() {
  const { t, language, setLanguage, currency, setCurrency } = useLanguage();
  
  // Header State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrDropdown, setShowCurrDropdown] = useState(false);
  
  // Mobile Specific Dropdown State
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [mobileCurrOpen, setMobileCurrOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
      function handleClickOutside(event: any) {
          if (headerRef.current && !headerRef.current.contains(event.target)) {
              setShowLangDropdown(false);
              setShowCurrDropdown(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HELPER: DESKTOP DROPDOWN ---
  const NavDropdown = ({ trigger, isOpen, setIsOpen, children }: any) => (
      <div className="relative">
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg text-xs font-bold uppercase transition-colors">
              {trigger} <ChevronDown className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
              {isOpen && (
                  <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-2"
                  >
                      {children}
                  </motion.div>
              )}
          </AnimatePresence>
      </div>
  );

  return (
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm font-sans text-navy">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex-shrink-0">
             <Image src="/assets/images/logo-full.png" alt="AfriqGig" width={140} height={40} className="h-10 w-auto object-contain" priority />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
             <Link href="/#how-it-works" className="hover:text-navy transition-colors">{t.nav.howItWorks}</Link>
             <Link href="/#why-us" className="hover:text-navy transition-colors">{t.nav.whyUs}</Link>
             <Link href="/#mission" className="hover:text-navy transition-colors">{t.nav.mission}</Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
             <NavDropdown trigger={<><Translate /> {language}</>} isOpen={showLangDropdown} setIsOpen={setShowLangDropdown}>
                 {LANGUAGES.map(lang => (
                     <button key={lang.code} onClick={() => { setLanguage(lang.code as any); setShowLangDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${language === lang.code ? 'font-bold text-navy bg-gray-50' : 'text-gray-600'}`}>{lang.label}</button>
                 ))}
             </NavDropdown>

             <NavDropdown trigger={<><CurrencyExchange /> {currency}</>} isOpen={showCurrDropdown} setIsOpen={setShowCurrDropdown}>
                 {CURRENCIES.map(curr => (
                     <button key={curr} onClick={() => { setCurrency(curr as any); setShowCurrDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currency === curr ? 'font-bold text-navy bg-gray-50' : 'text-gray-600'}`}>{curr}</button>
                 ))}
             </NavDropdown>
             
             <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
             <Link href="/login" className="text-sm font-bold text-gray-700 hover:text-navy transition-colors">{t.nav.login}</Link>
             <Link href="/signup" className="bg-navy hover:bg-navy-light text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95">{t.nav.join}</Link>
          </div>

          {/* Mobile Hamburger (Animated) */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-navy relative w-10 h-10 flex items-center justify-center">
              <div className="w-6 h-5 relative flex flex-col justify-between">
                  <motion.span animate={isMobileMenuOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }} className="w-full h-0.5 bg-navy rounded-full origin-left transition-all" />
                  <motion.span animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }} className="w-full h-0.5 bg-navy rounded-full transition-all" />
                  <motion.span animate={isMobileMenuOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }} className="w-full h-0.5 bg-navy rounded-full origin-left transition-all" />
              </div>
          </button>
        </div>

        {/* Mobile Menu Overlay (With Full Dropdowns) */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="lg:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-xl overflow-hidden z-50 max-h-[85vh] overflow-y-auto"
                >
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-4 text-lg font-medium text-gray-700">
                            <Link href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.howItWorks}</Link>
                            <Link href="/#why-us" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.whyUs}</Link>
                            <Link href="/#mission" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.mission}</Link>
                        </div>
                        <hr className="border-gray-100" />
                        
                        {/* Mobile Settings Accordion */}
                        <div className="grid grid-cols-2 gap-4">
                             {/* Language Mobile Dropdown - FIXED: Removed absolute positioning */}
                             <div>
                                 <button onClick={() => setMobileLangOpen(!mobileLangOpen)} className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl font-bold text-sm">
                                     <span className="flex items-center gap-2"><Translate/> {language.toUpperCase()}</span>
                                     <ChevronDown className={`transition-transform ${mobileLangOpen ? 'rotate-180' : ''}`} />
                                 </button>
                                 <AnimatePresence>
                                     {mobileLangOpen && (
                                         <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: "auto" }} 
                                            exit={{ opacity: 0, height: 0 }} 
                                            className="bg-white border border-gray-100 shadow-sm rounded-xl mt-2 overflow-hidden"
                                         >
                                             {LANGUAGES.map(l => (
                                                 <button key={l.code} onClick={() => setLanguage(l.code as any)} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">{l.label}</button>
                                             ))}
                                         </motion.div>
                                     )}
                                 </AnimatePresence>
                             </div>

                             {/* Currency Mobile Dropdown - FIXED: Removed absolute positioning */}
                             <div>
                                 <button onClick={() => setMobileCurrOpen(!mobileCurrOpen)} className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl font-bold text-sm">
                                     <span className="flex items-center gap-2"><CurrencyExchange/> {currency}</span>
                                     <ChevronDown className={`transition-transform ${mobileCurrOpen ? 'rotate-180' : ''}`} />
                                 </button>
                                 <AnimatePresence>
                                     {mobileCurrOpen && (
                                         <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: "auto" }} 
                                            exit={{ opacity: 0, height: 0 }} 
                                            className="bg-white border border-gray-100 shadow-sm rounded-xl mt-2 overflow-hidden"
                                         >
                                             {CURRENCIES.map(c => (
                                                 <button key={c} onClick={() => setCurrency(c as any)} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">{c}</button>
                                             ))}
                                         </motion.div>
                                     )}
                                 </AnimatePresence>
                             </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link href="/login" className="w-full py-3 text-center font-bold border border-gray-200 rounded-xl hover:bg-gray-50">{t.nav.login}</Link>
                            <Link href="/signup" className="w-full py-3 text-center font-bold bg-navy text-white rounded-xl shadow-md">{t.nav.join}</Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </header>
  );
}