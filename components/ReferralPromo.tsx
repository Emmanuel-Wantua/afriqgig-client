"use client";

import { useState, useEffect } from "react";
import { Gift, X, Megaphone, ArrowRight } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ReferralPromo() {
  const { user, t } = useLanguage();
  const pathname = usePathname();
  
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Logic: Show only on dashboard pages
  const isDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
      if (!isDashboard || !user) return;

      // 1. Check Banner State (Session storage - resets on tab close)
      const bannerHidden = sessionStorage.getItem("afriq_hide_ref_banner");
      if (bannerHidden) setShowBanner(false);

      // 2. Check Modal State (Local storage - persists)
      const modalNextShow = localStorage.getItem("afriq_ref_modal_next");
      const now = Date.now();

      // Show modal if never shown OR if "Remind Later" time has passed
      if (!modalNextShow || now > parseInt(modalNextShow)) {
          // Delay popup by 5 seconds so it feels less intrusive
          const timer = setTimeout(() => setShowModal(true), 5000);
          return () => clearTimeout(timer);
      }
  }, [isDashboard, user]);

  const handleRemindLater = () => {
      // Set next show time to 24 hours from now
      const nextShow = Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem("afriq_ref_modal_next", nextShow.toString());
      setShowModal(false);
  };

  const handleCloseBanner = () => {
      sessionStorage.setItem("afriq_hide_ref_banner", "true");
      setShowBanner(false);
  };

  if (!isDashboard || !user) return null;

  return (
    <>
      {/* --- 1. PERSISTENT BANNER (Top of Dashboard) --- */}
      {showBanner && (
          <div className="bg-navy-dark text-white p-3 md:p-4 mb-6 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-gold/20 p-2 rounded-full text-gold animate-pulse">
                      <Gift className="text-xl" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-white">{t.referrals.give50get50}</p>
                      <p className="text-xs text-blue-200 hidden md:block">
                          {t.referrals.bannerDesc}
                      </p>
                  </div>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                  <Link 
                    href="/dashboard/referrals"
                    className="bg-gold text-navy text-xs font-bold px-4 py-2 rounded-lg hover:bg-white transition-colors"
                  >
                      {t.referrals.getLink}
                  </Link>
                  <button onClick={handleCloseBanner} className="text-blue-300 hover:text-white">
                      <X className="text-lg" />
                  </button>
              </div>
              
              {/* Background Decoration */}
              <Gift className="absolute -right-4 -bottom-4 text-8xl text-white/5 group-hover:rotate-12 transition-transform duration-500" />
          </div>
      )}

      {/* --- 2. DISRUPTIVE MODAL POPUP --- */}
      {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-navy w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                  
                  {/* Image Header */}
                  <div className="h-32 bg-gradient-to-r from-navy via-blue-900 to-navy relative flex items-center justify-center">
                      <Gift className="text-6xl text-gold drop-shadow-lg" />
                      <button 
                        onClick={handleRemindLater} 
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition-colors"
                      >
                          <X className="text-xl" />
                      </button>
                  </div>

                  <div className="p-8 text-center">
                      <h2 className="text-2xl font-extrabold text-navy dark:text-white mb-2">
                          {t.referrals.want50}
                      </h2>
                      <p className="text-gray-500 dark:text-blue-200 text-sm mb-6 leading-relaxed">
                          {t.referrals.modalText}
                      </p>

                      <div className="space-y-3">
                          <Link 
                            href="/dashboard/referrals" 
                            onClick={() => handleRemindLater()} // Close modal on click
                            className="block w-full py-4 bg-navy dark:bg-gold text-white dark:text-navy font-bold rounded-xl shadow-lg hover:bg-navy-light dark:hover:bg-gold-light transition-all transform hover:scale-[1.02]"
                          >
                              {t.referrals.inviteNow}
                          </Link>
                          
                          <button 
                            onClick={handleRemindLater}
                            className="block w-full py-3 text-gray-400 text-xs font-bold hover:text-navy dark:hover:text-white transition-colors"
                          >
                              {t.referrals.remindLater}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}