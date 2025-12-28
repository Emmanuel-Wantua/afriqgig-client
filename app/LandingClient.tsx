"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, ShieldCheck, Wallet2, 
    Globe, CheckCircleFill, PlayCircle, 
    Quote, ArrowRight, Briefcase, StarFill,
    People, PersonCheckFill,
    Bank, Phone, CreditCard, Lock, ChevronDown, ChevronUp,
    Laptop, Building, CashCoin
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import UserBadge from "@/components/UserBadge";
import dynamic from 'next/dynamic';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader"; // Added PageLoader import just in case

const FeedbackModal = dynamic(() => import('@/components/FeedbackModal'), { ssr: false });

// --- FAQ COMPONENT ---
const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none group"
            >
                <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-navy' : 'text-gray-600 group-hover:text-navy'}`}>
                    {question}
                </span>
                <span className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-500 leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function LandingContent() {
  const { t, settings } = useLanguage();
  
  // Data State
  const [topTalent, setTopTalent] = useState<any[]>([]);
  const [isLoadingTalent, setIsLoadingTalent] = useState(true);
  
  // Animation State
  const roles = ["Web Development", "Graphic Design", "Translation", "Digital Marketing", "Mobile Apps", "Content Writing"];
  const [roleIndex, setRoleIndex] = useState(0);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [howItWorksIndex, setHowItWorksIndex] = useState(0);

  // Derived Data
  const TESTIMONIALS = [
      { text: t.landing.testi1, author: "Chinedu, Business Owner", role: "Client" },
      { text: t.landing.testi2, author: "Aisha, Graphic Designer", role: "Freelancer" },
      { text: t.landing.testi3, author: "Marc, Startup Founder", role: "Client" },
      { text: t.landing.testi4, author: "Jean-Paul, Translator", role: "Freelancer" }
  ];

  // Dynamic FAQs using translations
  const FAQS = [
      { q: t.landing.faq1q, a: t.landing.faq1a },
      { q: t.landing.faq2q, a: t.landing.faq2a },
      { q: t.landing.faq3q, a: t.landing.faq3a },
      { q: t.landing.faq4q, a: t.landing.faq4a },
  ];

  useEffect(() => {
    const interval = setInterval(() => setRoleIndex((prev) => (prev + 1) % roles.length), 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      const fetchTopTalent = async () => {
          try {
              const res = await fetch('/api/users/freelancers?q='); 
              const data = await res.json();
              if (Array.isArray(data)) {
                  let best = data.filter((u: any) => (u.rating || 0) >= 4.0);
                  if (best.length < 5) best = data.slice(0, 10);
                  setTopTalent(best.slice(0, 10)); 
              }
          } catch (error) {
              console.error("Failed to load top talent:", error);
          } finally {
              setIsLoadingTalent(false);
          }
      };
      fetchTopTalent();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
        if (settings.autoplayVideo) {
            videoRef.current.play().catch(() => {}); 
        } else {
            videoRef.current.pause();
        }
    }
  }, [settings.autoplayVideo]);

  // RESTORED: Floating Steps Data
  const HOW_IT_WORKS_STEPS = [
      { icon: <Search/>, title: t.landing.step1Title, text: t.landing.step1Text },
      { icon: <PersonCheckFill/>, title: t.landing.step2Title, text: t.landing.step2Text },
      { icon: <ShieldCheck/>, title: t.landing.step3Title, text: t.landing.step3Text },
      { icon: <CashCoin/>, title: t.landing.step4Title, text: t.landing.step4Text },
  ];

  // RESTORED: Animation Interval
  useEffect(() => {
      const interval = setInterval(() => setHowItWorksIndex((prev) => (prev + 1) % HOW_IT_WORKS_STEPS.length), 4000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-navy selection:bg-gold selection:text-navy overflow-x-hidden">
      
      <Header />

      {/* --- HERO SECTION --- */}
      <section className="pt-36 pb-20 px-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-gold/5 to-transparent rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-blue-50 to-transparent rounded-full blur-3xl -z-10 -translate-x-1/4 translate-y-1/4" />

         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-bottom-10 duration-1000">
               <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm text-gray-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {t.landing.liveBadge}
               </div>
               
               <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-navy">
                  {t.landing.heroTitleStart} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy via-blue-700 to-navy">{t.landing.heroTitleMiddle}</span> <br />
                  {t.landing.heroTitleEnd} {' '}
                  <span className="relative inline-block text-gold">
                      <AnimatePresence mode="wait">
                         <motion.span 
                           key={roleIndex}
                           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                           transition={{ duration: 0.5 }}
                           className="inline-block"
                         >
                           {roles[roleIndex]}
                         </motion.span>
                      </AnimatePresence>
                      <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 100 10" preserveAspectRatio="none">
                         <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.6" />
                      </svg>
                  </span>
               </h1>

               <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                  {t.landing.heroSubtitle}
               </p>

               <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                  <Link href="/signup?role=client" className="group px-8 py-4 bg-navy text-white rounded-2xl font-bold text-lg shadow-xl shadow-navy/20 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                     <Search className="text-xl"/> {t.landing.findTalent}
                     <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -ml-4 group-hover:ml-0" />
                  </Link>
                  <Link href="/signup?role=freelancer" className="px-8 py-4 bg-white text-navy border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                     <Briefcase className="text-xl"/> {t.landing.findWork}
                  </Link>
               </div>
            </div>

            {/* Video Visual */}
            <div className="relative w-full max-w-[500px] aspect-square mt-10 lg:mt-0 lg:mr-auto perspective-1000">
                
                {/* 1. Background Card (Tilted Right) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-gold/20 rounded-[2.5rem] rotate-6 scale-95 transform transition-transform duration-700 hover:rotate-3 shadow-xl z-10"></div>
                
                {/* 2. Main Video Card (Tilted Left + Rounded Edges) */}
                <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-white transform -rotate-3 hover:rotate-0 transition-all duration-700 z-20 group">
                    <video 
                        ref={videoRef} 
                        autoPlay={settings.autoplayVideo} 
                        loop 
                        muted 
                        playsInline 
                        poster="/assets/images/hero-poster.webp" 
                        className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000 rounded-[2.5rem]"
                    >
                        <source src="/assets/video/explainer.mp4" type="video/mp4" />
                    </video>
                    
                    <div className="absolute inset-0 bg-navy/10 group-hover:bg-transparent transition-colors duration-500 flex items-center justify-center rounded-[2.5rem]">
                         <div className="w-24 h-24 bg-white/90 backdrop-blur-xl text-navy rounded-full flex items-center justify-center text-5xl shadow-2xl scale-100 group-hover:scale-110 transition-transform duration-300">
                            <PlayCircle />
                        </div>
                    </div>
                </div>

                {/* 3. Floating Steps (Dynamic Positions) */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={howItWorksIndex}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                        className={`absolute z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 flex items-center gap-4 max-w-[260px]
                            ${howItWorksIndex === 0 ? "top-8 -left-4 md:-left-8" : ""}
                            ${howItWorksIndex === 1 ? "bottom-8 -right-4 md:-right-8 flex-row-reverse text-right" : ""}
                            ${howItWorksIndex === 2 ? "top-8 -right-4 md:-right-8 flex-row-reverse text-right" : ""}
                            ${howItWorksIndex === 3 ? "bottom-8 -left-4 md:-left-8" : ""}
                        `}
                    >
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shrink-0 shadow-lg">
                            {HOW_IT_WORKS_STEPS[howItWorksIndex].icon}
                        </div>
                        <div>
                            <p className="font-bold text-navy text-sm mb-0.5">{HOW_IT_WORKS_STEPS[howItWorksIndex].title}</p>
                            <p className="text-xs text-gray-500 leading-tight">{HOW_IT_WORKS_STEPS[howItWorksIndex].text}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
         </div>
      </section>

      {/* --- TOP RATED TALENT --- */}
      <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-navy mb-3">{t.landing.topTalentTitle}</h2>
                  <p className="text-lg text-gray-500 max-w-xl">{t.landing.topTalentDesc}</p>
              </div>
              <Link href="/dashboard/client/freelancers" className="text-gold font-bold hover:underline flex items-center gap-2">
                  {t.landing.viewAllTalent} <ArrowRight />
              </Link>
          </div>
          
          <div className="relative w-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
              
              {isLoadingTalent ? (
                  <div className="flex gap-6 px-6">
                      {[1,2,3,4].map(i => <div key={i} className="w-80 h-[340px] bg-gray-50 rounded-3xl animate-pulse shrink-0 border border-gray-100"></div>)}
                  </div>
              ) : (
                  <div className="flex overflow-hidden py-10">
                      <motion.div 
                        className="flex gap-8 w-max px-6"
                        animate={{ x: ["0%", "-50%"] }} 
                        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                      >
                          {[...topTalent, ...topTalent].map((talent, i) => (
                              <Link href={`/profile/${talent._id}`} key={`${i}-${talent._id}`} className="block group">
                                  {/* UNIFORM CARD SIZE: Fixed width and height, flex-col with justify-between */}
                                  <div className="w-80 h-[340px] bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm group-hover:shadow-2xl group-hover:scale-105 group-hover:border-blue-100 transition-all duration-300 relative flex flex-col justify-between">
                                      
                                      {/* Top Section */}
                                      <div>
                                          <div className="flex items-center gap-4 mb-4">
                                              <div className="w-16 h-16 bg-gray-50 rounded-full border-2 border-white shadow-md overflow-hidden shrink-0 relative">
                                                  {talent.avatar ? (
                                                      // ✅ FIX: Use Next/Image for optimization with correct sizes
                                                      <Image 
                                                        src={talent.avatar} 
                                                        alt={talent.name} 
                                                        fill
                                                        sizes="64px" // Tells browser this is a small icon (64px)
                                                        className="object-cover" 
                                                      />
                                                  ) : (
                                                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-300">{talent.name[0]}</div>
                                                  )}
                                              </div>
                                              <div className="min-w-0">
                                                  <UserBadge user={talent} showRating={true} />
                                                  <p className="text-sm text-gray-500 truncate">{talent.title || "Freelancer"}</p>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Bottom Section: Skills (Aligned to bottom) */}
                                      <div className="flex flex-wrap gap-2 content-end">
                                          {talent.skills?.slice(0, 4).map((skill: string, si: number) => (
                                              <span key={si} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-[11px] font-medium border border-gray-100 truncate max-w-full">
                                                  {skill}
                                              </span>
                                          ))}
                                          {talent.skills?.length > 4 && (
                                              <span className="bg-gray-50 text-gray-400 px-2 py-1 rounded-full text-[10px] font-bold">+{talent.skills.length - 4}</span>
                                          )}
                                      </div>
                                  </div>
                              </Link>
                          ))}
                      </motion.div>
                  </div>
              )}
          </div>
      </section>

      {/* --- MISSION STATEMENT --- */}
      <section id="mission" className="py-32 bg-navy text-center px-6 relative overflow-hidden">
          {/* Background Illustration */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <circle cx="20%" cy="30%" r="2" fill="#FFD700" />
                    <circle cx="80%" cy="70%" r="2" fill="#FFD700" />
                    <circle cx="50%" cy="50%" r="4" fill="#FFD700" className="animate-ping" />
                    <path d="M 20% 30% Q 50% 10% 50% 50% T 80% 70%" stroke="#FFD700" strokeWidth="1" fill="none" strokeDasharray="5,5" opacity="0.5" />
                </svg>
          </div>
          
          <div className="max-w-4xl mx-auto relative z-10">
              <div className="inline-flex items-center justify-center p-5 bg-white/5 rounded-3xl shadow-2xl mb-10 border border-white/10 backdrop-blur-md">
                  <Globe className="text-5xl text-gold" />
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-10 leading-tight text-white tracking-tight">
                  {t.landing.missionTitle}
              </h2>
              <div className="space-y-6 text-lg md:text-xl leading-relaxed text-blue-100/90 font-light">
                  <p>{t.landing.missionText1}</p>
                  <p>
                      <strong className="text-gold font-bold">AfriqGig</strong> {t.landing.missionText2}
                  </p>
              </div>
          </div>
      </section>

      {/* --- PLATFORM ECOSYSTEM GRAPHIC --- */}
      <section className="py-24 px-6 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
              {/* NEW: Image above the workflow */}
              <div className="mb-16 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-100 max-h-[400px] relative group">
                  <div className="absolute inset-0 bg-navy/20 group-hover:bg-transparent transition-colors duration-500"></div>
                  {/* ✅ FIX: Use Next/Image for optimization */}
                  <Image 
                    src="/assets/images/workflow.webp" 
                    alt="AfriqGig Ecosystem" 
                    fill
                    sizes="(max-width: 768px) 100vw, 1200px" // Responsive sizes for large image
                    className="object-cover transform group-hover:scale-105 transition-transform duration-1000" 
                  />
              </div>

              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{t.landing.ecosystemTitle}</h2>
                  <p className="text-gray-500">{t.landing.ecosystemDesc}</p>
              </div>

              <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
                  {/* Client Side */}
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-xl z-10 w-full md:w-80 text-center relative group hover:-translate-y-2 transition-transform">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center text-blue-600 text-3xl mb-6">
                          <Building />
                      </div>
                      <h3 className="font-bold text-navy text-xl mb-2">{t.landing.clientTitle}</h3>
                      <p className="text-sm text-gray-500">{t.landing.clientDesc}</p>
                      <div className="hidden md:block absolute top-1/2 -right-20 w-20 h-0.5 bg-gray-200"></div>
                      <div className="hidden md:block absolute top-1/2 -right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>

                  {/* Central Hub */}
                  <div className="bg-navy text-white p-10 rounded-[2.5rem] shadow-2xl z-20 w-full md:w-96 text-center border-4 border-gold/20 relative">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                      <div className="relative">
                          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full mx-auto flex items-center justify-center text-gold text-4xl mb-6 shadow-inner">
                              <ShieldCheck />
                          </div>
                          <h3 className="font-bold text-2xl mb-2">{t.landing.escrowTitle}</h3>
                          <p className="text-blue-100 text-sm mb-6">{t.landing.escrowDesc}</p>
                          <div className="flex justify-center gap-3 text-2xl text-white/50">
                              <Lock /> <CheckCircleFill />
                          </div>
                      </div>
                  </div>

                  {/* Freelancer Side */}
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-xl z-10 w-full md:w-80 text-center relative group hover:-translate-y-2 transition-transform">
                      <div className="hidden md:block absolute top-1/2 -left-20 w-20 h-0.5 bg-gray-200"></div>
                      <div className="hidden md:block absolute top-1/2 -left-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>

                      <div className="w-16 h-16 bg-green-50 rounded-2xl mx-auto flex items-center justify-center text-green-600 text-3xl mb-6">
                          <Laptop />
                      </div>
                      <h3 className="font-bold text-navy text-xl mb-2">{t.landing.freelancerTitle}</h3>
                      <p className="text-sm text-gray-500">{t.landing.freelancerDesc}</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- WHY CHOOSE US --- */}
      <section id="why-us" className="py-24 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-navy mb-4">{t.landing.whyUsTitle}</h2>
                  <p className="text-lg text-gray-600">{t.landing.whyUsDesc}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-300 md:col-span-2 border border-gray-100 group hover:-translate-y-1">
                      <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center text-green-600 text-3xl mb-8 group-hover:scale-110 transition-transform">
                          <ShieldCheck />
                      </div>
                      <h3 className="text-2xl font-bold text-navy mb-4">{t.landing.card1Title}</h3>
                      <p className="text-gray-600 text-lg leading-relaxed">{t.landing.card1Text}</p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-gradient-to-br from-navy to-blue-900 text-white p-10 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <div className="relative z-10">
                          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mb-8 backdrop-blur-sm">
                              <PersonCheckFill />
                          </div>
                          <h3 className="text-2xl font-bold mb-4">{t.landing.card2Title}</h3>
                          <p className="text-blue-100">{t.landing.card2Text}</p>
                      </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-[80px]"></div>
                      <div className="bg-gold/10 w-16 h-16 rounded-2xl flex items-center justify-center text-gold text-3xl mb-8 group-hover:rotate-6 transition-transform">
                          <Wallet2 />
                      </div>
                      <h3 className="text-2xl font-bold text-navy mb-4">{t.landing.card3Title}</h3>
                      <div className="space-y-4">
                          <p className="text-gray-600">
                              {t.landing.card3Text} 
                          </p>
                          <ul className="text-sm text-gray-500 space-y-2">
                              <li className="flex items-center gap-2"><CheckCircleFill className="text-green-500"/> {t.landing.card3List1}</li>
                              <li className="flex items-center gap-2"><CheckCircleFill className="text-green-500"/> {t.landing.card3List2}</li>
                              <li className="flex items-center gap-2"><CheckCircleFill className="text-green-500"/> {t.landing.card3List3}</li>
                          </ul>
                          <div className="flex gap-3 text-2xl text-gray-300 pt-2">
                              <Phone title="Mobile Money" /> <Bank title="Bank Transfer" /> <CreditCard title="Cards" />
                          </div>
                      </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-300 md:col-span-2 border border-gray-100 group hover:-translate-y-1">
                      <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600 text-3xl mb-8 group-hover:scale-110 transition-transform">
                          <People />
                      </div>
                      <h3 className="text-2xl font-bold text-navy mb-4">{t.landing.card4Title}</h3>
                      <p className="text-gray-600 text-lg leading-relaxed">{t.landing.card4Text}</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 px-6 bg-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold text-navy mb-4">{t.landing.testiTitle}</h2>
          </div>
          <div className="flex">
                <motion.div className="flex gap-8 w-max pl-8" animate={{ x: [-1800, 0] }} transition={{ repeat: Infinity, duration: 60, ease: "linear" }}>
                    {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                        <div key={i} className="w-[450px] bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all">
                            <div className="flex gap-1 mb-6">
                                {[1,2,3,4,5].map(s => <StarFill key={s} className="text-gold text-sm" />)}
                            </div>
                            <p className="text-lg text-navy font-medium leading-relaxed mb-8">"{t.text}"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">{t.author[0]}</div>
                                <div>
                                    <p className="font-bold text-navy">{t.author}</p>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t.role}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
          </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-navy mb-4">{t.landing.faqTitle}</h2>
                  <p className="text-gray-500">{t.landing.faqSubtitle}</p>
              </div>
              <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100">
                  {FAQS.map((faq, i) => (
                      <FaqItem key={i} question={faq.q} answer={faq.a} />
                  ))}
              </div>
          </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto bg-navy rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl group">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 animate-pulse-slow"></div>
              
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-1000"></div>
              <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl group-hover:bg-gold/20 transition-colors duration-1000"></div>
              
              <div className="relative z-10">
                  <h2 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">{t.landing.ctaTitle}</h2>
                  <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                      {t.landing.ctaText}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-6">
                      <Link href="/signup" className="bg-gold text-navy px-12 py-5 rounded-2xl font-bold text-xl hover:bg-white hover:text-navy transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3">
                          {t.auth.createAccount} <ArrowRight className="text-2xl"/>
                      </Link>
                      <Link href="/login" className="bg-white/10 border border-white/20 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                          {t.auth.login}
                      </Link>
                  </div>
              </div>
          </div>
      </section>

      <Footer />

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

    </div>
  );
} 