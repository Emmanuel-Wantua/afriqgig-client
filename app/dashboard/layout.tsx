"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; 
import dynamic from 'next/dynamic'; // ✅ Added for dynamic import
import { 
    HouseDoor, Briefcase, ChatDots, Wallet2, Person, List, BoxArrowRight,
    X, Gear, QuestionCircle, InfoCircle, ShieldCheck, People, Search,
    ChevronDown, Globe, CurrencyExchange, Speedometer2, PeopleFill,
    ExclamationOctagon, CashStack, PersonCircle, TelephoneX, Telephone, CameraVideo
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/utils/translations";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import ReferralPromo from "@/components/ReferralPromo";
import AuthGuard from "@/components/AuthGuard";

// ✅ FIX: Dynamically import CallModal to prevent 'self is not defined' error
const CallModal = dynamic(() => import("@/components/CallModal"), { ssr: false });

// --- CUSTOM DROPDOWN COMPONENT ---
const CustomDropdown = ({ 
    icon, 
    value, 
    options, 
    onChange 
}: { 
    icon: React.ReactNode, 
    value: string, 
    options: { value: string, label: string, flag?: string }[], 
    onChange: (val: string) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative w-full" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-navy-light/30 border border-white/10 hover:border-gold/50 text-white px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group"
            >
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 group-hover:text-gold transition-colors">{icon}</span>
                    <span className="font-medium truncate">{selectedOption?.flag} {selectedOption?.label}</span>
                </div>
                <ChevronDown className={`text-xs text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[#0a1929] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 hover:bg-gold hover:text-navy transition-colors ${value === opt.value ? 'bg-white/5 text-gold' : 'text-gray-300'}`}
                        >
                            {opt.flag && <span className="text-base">{opt.flag}</span>}
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const { t, language, setLanguage, currency, setCurrency, user } = useLanguage();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // --- GLOBAL CALL STATE ---
  const [incomingCall, setIncomingCall] = useState<{ type: 'audio' | 'video', contact: any } | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const lastProcessedMsgId = useRef<string | null>(null);

  const [activeCallContact, setActiveCallContact] = useState<any>(null);

  // --- HEARTBEAT (Online Status) ---
  useEffect(() => {
      if (!user) return;
      const sendHeartbeat = () => {
          navigator.sendBeacon("/api/users/status", JSON.stringify({ userId: user._id }));
      };
      // Send immediately and then every 2 minutes
      sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 120000); 
      return () => clearInterval(interval);
  }, [user]);

  // --- GLOBAL MESSAGE POLLING ---
  useEffect(() => {
      if (!user) return;
      
      const pollMessages = async () => {
          try {
              // 1. Unread Count
              const resStats = await fetch(`/api/messages/stats?userId=${user._id}`);
              const stats = await resStats.json();
              setUnreadMsgCount(stats.unread || 0);

              // 2. Latest Message (Signals)
              const resLast = await fetch(`/api/messages/latest?userId=${user._id}`);
              const lastMsg = await resLast.json();

              if (lastMsg && lastMsg._id !== lastProcessedMsgId.current) {
                   const isMe = lastMsg.sender._id === user._id;
                   
                   if (!isMe) {
                       lastProcessedMsgId.current = lastMsg._id;

                       // --- SIGNAL: CALL START ---
                       const callMatch = lastMsg.content.match(/\[CALL_STARTED:(audio|video)\]/);
                       if (callMatch) {
                           // Only accept calls from last 45 seconds
                           const msgTime = new Date(lastMsg.createdAt).getTime();
                           if ((Date.now() - msgTime) < 45000) { 
                               setIncomingCall({
                                   type: callMatch[1] as 'audio' | 'video',
                                   contact: lastMsg.sender
                               });

                               // Force Play Ringtone
                               if (!ringtoneRef.current) {
                                   ringtoneRef.current = new Audio("/assets/audio/ringtone.mp3");
                                   ringtoneRef.current.loop = true;
                               }
                               ringtoneRef.current.play().catch(() => console.log("Audio requires interaction"));
                           }
                       }
                       
                       // --- SIGNAL: STOP EVERYTHING ---
                       else if (["[CALL_ENDED]", "[CALL_DECLINED]", "[CALL_ACCEPTED]"].includes(lastMsg.content)) {
                           // 1. Close Incoming Popup
                           setIncomingCall(null);
                           
                           // 2. Stop Ringtone
                           if (ringtoneRef.current) {
                               ringtoneRef.current.pause();
                               ringtoneRef.current.currentTime = 0;
                           }

                           // 3. Close Call Modal (Only if Remote Ended it)
                           if (lastMsg.content !== "[CALL_ACCEPTED]") {
                               setShowCallModal(false);
                           }
                       }
                       
                       // --- STANDARD MESSAGE ---
                       else {
                           const ping = new Audio("/assets/audio/message.mp3");
                           ping.play().catch(() => {});
                       }
                   }
              }
          } catch (e) { console.error(e); }
      };

      // Poll frequently (1.5s) for responsiveness
      const interval = setInterval(pollMessages, 1500); 
      
      return () => {
          clearInterval(interval);
          if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current = null;
          }
      };
  }, [user, showCallModal, incomingCall]);

  const stopRingtone = () => {
      if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
      }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
      localStorage.removeItem("afriqUser");
      router.replace("/login");
  };

  const getNavItems = () => {
      const common = [
          { name: t.nav.community, icon: <People />, href: "/dashboard/community" },
      ];

      const clientLinks = [
          { name: t.nav.dashboard, icon: <HouseDoor />, href: "/dashboard/client" },
          { name: t.nav.jobs, icon: <Briefcase />, href: "/dashboard/client/jobs" },
      ];

      const freelancerLinks = [
          { name: t.nav.findWork, icon: <Search />, href: "/dashboard/freelancer" },
          { name: t.nav.contracts, icon: <Briefcase />, href: "/dashboard/freelancer/contracts" },
      ];

      const adminLinks = [
          { name: t.nav.overview, icon: <Speedometer2 />, href: "/dashboard/admin" },
          { name: t.nav.disputes, icon: <ExclamationOctagon />, href: "/dashboard/admin/disputes" },
          { name: t.nav.users, icon: <PeopleFill />, href: "/dashboard/admin/users" },
          { name: t.nav.financials, icon: <CashStack />, href: "/dashboard/admin/finance" },
      ];

    let roleLinks: any[] = [];
      if (user?.role === "client") roleLinks = clientLinks;
      else if (user?.role === "freelancer") roleLinks = freelancerLinks;
      else if (user?.role === "admin") roleLinks = adminLinks;

      return [
          ...common,
          ...roleLinks,
          { name: t.nav.inbox, icon: <ChatDots />, href: "/dashboard/messages", badge: unreadMsgCount },
          { name: t.nav.wallet, icon: <Wallet2 />, href: "/dashboard/wallet" },
      ];
  };

  const mainNavItems = getNavItems();

  const secondaryNavItems = [
    { name: t.nav.profile, icon: <Person />, href: "/dashboard/profile" },
    { name: t.nav.settings, icon: <Gear />, href: "/dashboard/settings" },
    { name: t.nav.support, icon: <QuestionCircle />, href: "/dashboard/support" },
    { name: t.nav.about, icon: <InfoCircle />, href: "/about" },
    { name: t.nav.legal, icon: <ShieldCheck />, href: "/legal" },
  ];

  const isActive = (path: string) => {
      if (path === "/dashboard/client" || path === "/dashboard/freelancer") {
          return pathname === path;
      }
      return pathname.startsWith(path);
  };

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 bg-navy text-white h-screen fixed left-0 top-0 z-50 border-r border-white/5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
        
        <div className="p-6 flex justify-center items-center shadow-sm z-10 shrink-0 bg-navy">
           <div className="relative w-40 h-10">
               <Image src="/logo-white.png" alt="AfriqGig" fill className="object-contain" priority sizes="200px" />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
            
            {/* Preferences */}
            <div className="space-y-3 px-2">
               <CustomDropdown 
                   icon={<Globe />}
                   value={language}
                   onChange={(val) => setLanguage(val as Language)}
                   options={[
                       { value: "en", label: "English", flag: "🇺🇸" },
                       { value: "fr", label: "Français", flag: "🇫🇷" },
                       { value: "es", label: "Español", flag: "🇪🇸" },
                       { value: "ar", label: "العربية", flag: "🇸🇦" },
                       { value: "sw", label: "Kiswahili", flag: "🇰🇪" },
                   ]}
               />
               <CustomDropdown 
                   icon={<CurrencyExchange />}
                   value={currency}
                   onChange={(val) => setCurrency(val)}
                   options={[
                       { value: "XAF", label: "XAF (Central)", flag: "🇨🇲" },
                       { value: "NGN", label: "NGN (Naira)", flag: "🇳🇬" },
                       { value: "KES", label: "KES (Shilling)", flag: "🇰🇪" },
                       { value: "USD", label: "USD (Dollar)", flag: "🇺🇸" },
                   ]}
               />
            </div>
            
            {/* Navigation */}
            <nav className="space-y-1.5">
              <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t.nav.menu}</p>
              {mainNavItems.map((item) => (
                <Link 
                    key={item.name} 
                    href={item.href} 
                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                        isActive(item.href) 
                        ? "bg-gold text-navy font-bold shadow-lg shadow-gold/20" 
                        : "text-gray-300 hover:bg-white/10 hover:text-white hover:pl-5"
                    }`}
                >
                  <div className="flex items-center gap-3">
                      <span className={`text-xl ${isActive(item.href) ? "" : "text-gray-400 group-hover:text-white"}`}>{item.icon}</span>
                      {item.name}
                  </div>
                  {item.badge && item.badge > 0 ? (
                      <span className="bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">
                          {item.badge > 99 ? '99+' : item.badge}
                      </span>
                  ): null}
                </Link>
              ))}

              <div className="h-px bg-white/10 my-6 mx-4"></div>

              <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t.nav.general}</p>
              {secondaryNavItems.map((item) => (
                <Link 
                    key={item.name} 
                    href={item.href} 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 hover:pl-5"
                >
                  <span className="text-xl text-gray-400 group-hover:text-white">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-navy shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full rounded-xl transition-colors"
          >
            <BoxArrowRight className="text-xl" />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <header className="md:hidden bg-navy text-white p-4 flex justify-between items-center sticky top-0 z-[500] shadow-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <List className="text-3xl" />
            </button>
            <div className="relative w-32 h-8">
               <Image src="/logo-white.png" alt="AfriqGig" fill className="object-contain object-left" sizes="200px" />
            </div>
        </div>
        <div className="flex items-center gap-3">
           <NotificationBell />
        </div>
      </header>

      {/* --- MOBILE DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[600] flex md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative bg-navy w-80 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-white/10">
                <div className="bg-white p-6 flex items-center justify-between shadow-sm shrink-0">
                    <div className="w-8"></div>
                    <div className="relative w-32 h-10">
                        <Image src="/logo-full.png" alt="AfriqGig" fill className="object-contain" sizes="200px" />
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 p-1.5 rounded-full transition-colors">
                        <X className="text-xl" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/20">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                            <Gear className="text-gold" /> {t.settings.preferences}
                        </p>
                        <div className="space-y-3">
                            <CustomDropdown icon={<Globe />} value={language} onChange={(val) => setLanguage(val as Language)} options={[{ value: "en", label: "English", flag: "🇺🇸" }, { value: "fr", label: "Français", flag: "🇫🇷" }, { value: "es", label: "Español", flag: "🇪🇸" }, { value: "ar", label: "العربية", flag: "🇸🇦" }, { value: "sw", label: "Kiswahili", flag: "🇰🇪" }]} />
                            <CustomDropdown icon={<CurrencyExchange />} value={currency} onChange={(val) => setCurrency(val)} options={[{ value: "XAF", label: "XAF (Central)", flag: "🇨🇲" }, { value: "NGN", label: "NGN (Naira)", flag: "🇳🇬" }, { value: "KES", label: "KES (Shilling)", flag: "🇰🇪" }, { value: "USD", label: "USD (Dollar)", flag: "🇺🇸" }]} />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{t.settings.account}</p>
                        <nav className="space-y-1">
                            {secondaryNavItems.map((item) => (
                                <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-3 py-3.5 rounded-xl transition-all active:scale-95 text-gray-300 hover:text-white hover:bg-white/10">
                                    <span className="text-xl opacity-80">{item.icon}</span>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 shrink-0">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 text-red-300 hover:text-white hover:bg-red-500/20 w-full py-3 rounded-xl font-bold transition-all"
                    >
                        <BoxArrowRight className="text-xl" /> {t.nav.logout}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      {/* FIX: Added 'pt-16' to push content below fixed mobile header */}
      <main className="flex-1 md:ml-72 relative flex flex-col h-screen overflow-hidden pt-10 md:pt-0"> 
        <div className="hidden md:flex justify-end items-center gap-6 p-4 px-8 bg-white border-b border-gray-100 shrink-0 shadow-sm z-40">
            <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden lg:block">
                        <p className="text-sm font-bold text-navy">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-100 relative">
                        {user?.avatar ? <Image src={user.avatar} alt="User" fill className="object-cover" /> : <Person className="text-2xl text-gray-400 m-2" />}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 scrollbar-thin scrollbar-thumb-gray-300">
            <ReferralPromo />
            {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {mainNavItems.slice(0, 5).map((item) => { 
            const active = isActive(item.href);
            return (
                <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 transition-colors relative ${active ? "text-navy font-bold" : "text-gray-400 hover:text-navy"}`}>
                    <div className="relative">
                        <span className={`text-xl ${active ? "scale-110" : ""}`}>{item.icon}</span>
                        {item.badge && item.badge > 0 ? (
                            <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full shadow-sm animate-pulse border border-white">
                                {item.badge > 9 ? '9+' : item.badge}
                            </span>
                        ): null}
                    </div>
                    <span className="text-[10px]">{item.name}</span>
                </Link>
            );
        })}
      </nav>
      
    </div>

    {/* --- GLOBAL CALL POPUP --- */}
    {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Background Pulse */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full animate-ping opacity-20 duration-1000"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-6">
                
                {/* Caller Info */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl relative z-10 bg-gray-800">
                            {incomingCall.contact?.avatar ? (
                                <img src={incomingCall.contact.avatar} className="w-full h-full object-cover" alt="Caller" />
                            ) : <PersonCircle className="w-full h-full text-gray-400 p-6" />}
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-white tracking-tight">{incomingCall.contact?.name || "Unknown Caller"}</h3>
                        <p className="text-blue-200/80 font-medium text-sm mt-1 uppercase tracking-widest flex items-center justify-center gap-2">
                            {incomingCall.type === 'video' ? <CameraVideo className="animate-pulse"/> : <Telephone className="animate-pulse"/>}
                            Incoming {incomingCall.type} Call...
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-12 mt-8">
                    {/* DECLINE */}
                    <div className="flex flex-col items-center gap-2 group cursor-pointer" 
                        onClick={async () => { 
                            // Send Decline Signal
                            await fetch("/api/messages", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    sender: user?._id,
                                    receiver: incomingCall.contact._id,
                                    content: "[CALL_DECLINED]",
                                    type: "text"
                                })
                            });
                            setIncomingCall(null); 
                            stopRingtone();
                        }}
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 text-red-500 flex items-center justify-center text-2xl transition-all duration-300 group-hover:bg-red-600 group-hover:text-white">
                            <TelephoneX />
                        </div>
                        <span className="text-xs text-white/50 font-bold uppercase">Decline</span>
                    </div>

                    {/* ACCEPT */}
                    <div 
                        className="flex flex-col items-center gap-2 group cursor-pointer"
                        onClick={() => { 
                            stopRingtone(); 
                            // 1. Set Type
                            setCallType(incomingCall.type);
                            // 2. ✅ FIX: Save Contact to persistent state BEFORE clearing popup
                            setActiveCallContact(incomingCall.contact); 
                            // 3. Open Modal
                            setShowCallModal(true);
                            // 4. Clear Popup
                            setIncomingCall(null);
                        }}
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center text-3xl transition-all duration-300 group-hover:scale-110 shadow-xl animate-bounce">
                            {incomingCall.type === 'video' ? <CameraVideo /> : <Telephone />}
                        </div>
                        <span className="text-xs text-white/50 font-bold uppercase">Accept</span>
                    </div>
                </div>
            </div>
        </div>
    )}

    {/* --- ZEGO CALL MODAL --- */}
    {/* ✅ FIX: Use activeCallContact instead of incomingCall */}
    {showCallModal && (
        <CallModal 
            isOpen={showCallModal} 
            onClose={() => {
                setShowCallModal(false);
                setActiveCallContact(null); // Cleanup
            }} 
            contact={activeCallContact || { _id: "unknown", name: "Unknown" }} 
            type={callType}
            isIncoming={true} // It was triggered by an incoming call
        />
    )}
    
    </AuthGuard>
  );
}