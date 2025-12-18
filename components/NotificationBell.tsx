"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ArrowRight, Globe } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";

// --- SUB-COMPONENT: Notification Item ---
const NotificationItem = ({ notif, markAsRead, setShowDropdown }: { notif: any, markAsRead: (id: string) => void, setShowDropdown: (v: boolean) => void }) => {
    const { t, language } = useLanguage();
    const { translate, loading } = useGoogleTranslate();
    const [translatedTitle, setTranslatedTitle] = useState("");
    const [translatedMessage, setTranslatedMessage] = useState("");
    const [showTranslated, setShowTranslated] = useState(false);

    const handleTranslate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (showTranslated) {
            setShowTranslated(false);
            return;
        }
        if (!translatedTitle || !translatedMessage) {
            const tTitle = await translate(notif.title);
            const tMsg = await translate(notif.message);
            setTranslatedTitle(tTitle);
            setTranslatedMessage(tMsg);
        }
        setShowTranslated(true);
    };

    return (
        <div className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-blue-50/40' : ''}`}>
            <div className="mt-1.5">
                <div className={`w-2 h-2 rounded-full ${!notif.isRead ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.isRead ? 'font-bold text-navy' : 'text-gray-700'}`}>
                    {showTranslated ? translatedTitle : notif.title}
                </p>
                <p className="text-xs text-gray-500 truncate mb-1">
                    {showTranslated ? translatedMessage : notif.message}
                </p>
                
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        {language !== "en" && (
                            <button onClick={handleTranslate} className="text-blue-400 hover:text-blue-600 transition-colors" title={t.chat.translate}>
                                <Globe className={`text-[10px] ${loading ? "animate-spin" : ""}`} />
                            </button>
                        )}
                    </div>

                    {notif.link && (
                        <Link 
                            href={notif.link}
                            onClick={() => { markAsRead(notif._id); setShowDropdown(false); }}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                            {t.manage.view} <ArrowRight className="text-[9px]" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function NotificationBell() {
  const { user, t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Audio ref for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotifCount = useRef(0);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setShowDropdown(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Polling Logic
  useEffect(() => {
      if (!user) return;

      const fetchNotifications = async () => {
          try {
              const res = await fetch(`/api/notifications?userId=${user._id}`);
              const data = await res.json();
              
              if (Array.isArray(data)) {
                  setNotifications(data);
                  const newUnread = data.filter((n: any) => !n.isRead).length;
                  setUnreadCount(newUnread);

                  // ✅ PLAY SOUND IF NEW NOTIFICATION ARRIVES
                  if (newUnread > lastNotifCount.current) {
                      if (!audioRef.current) {
                          audioRef.current = new Audio("/assets/audio/notification.mp3"); // Ensure this file exists
                      }
                      audioRef.current.play().catch(() => {}); // Catch autoplay errors
                  }
                  lastNotifCount.current = newUnread;
              }
          } catch (error) { console.error(error); }
      };

      fetchNotifications();
      
      // ✅ FAST POLLING (Every 2 Seconds)
      const interval = setInterval(fetchNotifications, 2000);

      return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id })
      });
  };

  return (
    <div className="relative" ref={dropdownRef}>
        <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-gray-400 hover:text-navy transition-colors"
        >
            <Bell className="text-xl" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-sm border border-white">
                    {unreadCount}
                </span>
            )}
        </button>

        {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-[1000] border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="font-bold text-navy text-xs uppercase tracking-wider">{t.notificationsPage.title}</span>
                    {unreadCount > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                </div>
                
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">{t.notificationsPage.noNotifications}</div>
                    ) : (
                        notifications.slice(0, 5).map(notif => (
                            <NotificationItem 
                                key={notif._id} 
                                notif={notif} 
                                markAsRead={markAsRead} 
                                setShowDropdown={setShowDropdown} 
                            />
                        ))
                    )}
                </div>

                <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                    <Link 
                        href="/dashboard/notifications" 
                        onClick={() => setShowDropdown(false)}
                        className="text-xs font-bold text-navy hover:text-gold flex items-center justify-center gap-1 transition-colors"
                    >
                        {t.dashboard.viewAll} <ArrowRight />
                    </Link>
                </div>
            </div>
        )}
    </div>
  );
}