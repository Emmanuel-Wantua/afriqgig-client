"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { HouseDoor, Briefcase, ChatDots, Wallet2, Person, List, BoxArrowRight, X, Gear, QuestionCircle, InfoCircle, ShieldCheck, People, Search, ChevronDown, Globe, CurrencyExchange, Speedometer2, PeopleFill, ExclamationOctagon, CashStack } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/utils/translations";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import ReferralPromo from "@/components/ReferralPromo";
import AuthGuard from "@/components/AuthGuard";

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

  useEffect(() => {
      if (!user) return;
      const fetchUnread = async () => {
          try {
              const res = await fetch(`/api/messages/stats?userId=${user._id}`);
              const data = await res.json();
              setUnreadMsgCount(data.unread || 0);
          } catch (e) { console.error(e); }
      };
      
      fetchUnread();
      const interval = setInterval(fetchUnread, 10000); 
      return () => clearInterval(interval);
  }, [user]);

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
      // 1. Clear Local Storage
      localStorage.removeItem("afriqUser");
      
      // 2. Redirect to Login
      router.replace("/login");
  };

  const getNavItems = () => {
      const common = [
          { name: t.nav.community, icon: <People />, href: "/dashboard/community" }, // UPDATED
      ];

      const clientLinks = [
          { name: t.nav.dashboard, icon: <HouseDoor />, href: "/dashboard/client" },
          { name: t.nav.jobs, icon: <Briefcase />, href: "/dashboard/client/jobs" },
      ];

      const freelancerLinks = [
          { name: t.nav.findWork, icon: <Search />, href: "/dashboard/freelancer" }, // UPDATED
          { name: t.nav.contracts, icon: <Briefcase />, href: "/dashboard/freelancer/contracts" }, // UPDATED
      ];

      const adminLinks = [
          { name: t.nav.overview, icon: <Speedometer2 />, href: "/dashboard/admin" }, // UPDATED
          { name: t.nav.disputes, icon: <ExclamationOctagon />, href: "/dashboard/admin/disputes" }, // UPDATED
          { name: t.nav.users, icon: <PeopleFill />, href: "/dashboard/admin/users" }, // UPDATED
          { name: t.nav.financials, icon: <CashStack />, href: "/dashboard/admin/finance" }, // UPDATED
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
    { name: t.nav.settings, icon: <Gear />, href: "/dashboard/settings" }, // UPDATED
    { name: t.nav.support, icon: <QuestionCircle />, href: "/dashboard/support" }, // UPDATED
    { name: t.nav.about, icon: <InfoCircle />, href: "/about" }, // UPDATED
    { name: t.nav.legal, icon: <ShieldCheck />, href: "/legal" }, // UPDATED
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
              <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t.nav.menu}</p> {/* UPDATED */}
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

              <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t.nav.general}</p> {/* UPDATED */}
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
            onClick={handleLogout} // <--- Added onClick handler
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
                            <Gear className="text-gold" /> {t.settings.preferences} {/* UPDATED */}
                        </p>
                        <div className="space-y-3">
                            <CustomDropdown icon={<Globe />} value={language} onChange={(val) => setLanguage(val as Language)} options={[{ value: "en", label: "English", flag: "🇺🇸" }, { value: "fr", label: "Français", flag: "🇫🇷" }, { value: "es", label: "Español", flag: "🇪🇸" }, { value: "ar", label: "العربية", flag: "🇸🇦" }, { value: "sw", label: "Kiswahili", flag: "🇰🇪" }]} />
                            <CustomDropdown icon={<CurrencyExchange />} value={currency} onChange={(val) => setCurrency(val)} options={[{ value: "XAF", label: "XAF (Central)", flag: "🇨🇲" }, { value: "NGN", label: "NGN (Naira)", flag: "🇳🇬" }, { value: "KES", label: "KES (Shilling)", flag: "🇰🇪" }, { value: "USD", label: "USD (Dollar)", flag: "🇺🇸" }]} />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{t.settings.account}</p> {/* UPDATED */}
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
                        onClick={handleLogout} // <--- Added onClick handler
                        className="flex items-center justify-center gap-3 text-red-300 hover:text-white hover:bg-red-500/20 w-full py-3 rounded-xl font-bold transition-all"
                    >
                        <BoxArrowRight className="text-xl" /> {t.nav.logout}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-72 relative flex flex-col h-screen overflow-hidden"> 
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
    </AuthGuard>
  );
}

