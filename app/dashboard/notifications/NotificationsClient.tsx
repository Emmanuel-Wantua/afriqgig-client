"use client";

import { useState, useEffect } from "react";
import { 
    Bell, CheckAll, ChatDots, FileEarmarkText, 
    Wallet2, InfoCircle, CheckCircleFill, Trash, Globe 
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate"; // Import Translation Hook

// --- SUB-COMPONENT: Notification Item (Handles Translation Logic) ---
const NotificationItem = ({ notif, markAsRead }: { notif: any, markAsRead: (id: string) => void }) => {
    const { t, language } = useLanguage();
    const { translate, loading } = useGoogleTranslate();
    const [translatedTitle, setTranslatedTitle] = useState("");
    const [translatedMessage, setTranslatedMessage] = useState("");
    const [showTranslated, setShowTranslated] = useState(false);

    const getIcon = (type: string) => {
        switch(type) {
            case 'message': return <ChatDots className="text-blue-500" />;
            case 'proposal': return <FileEarmarkText className="text-purple-500" />;
            case 'payment': return <Wallet2 className="text-green-500" />;
            case 'admin_alert': return <InfoCircle className="text-red-500" />;
            default: return <Bell className="text-gray-500" />;
        }
    };

    const handleTranslate = async () => {
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
        <div 
            className={`group flex gap-4 p-5 rounded-2xl border transition-all hover:shadow-md ${
                notif.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/30 border-blue-100'
            }`}
        >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                notif.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'
            }`}>
                {getIcon(notif.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className={`text-sm mb-1 ${notif.isRead ? 'font-bold text-navy' : 'font-extrabold text-blue-900'}`}>
                        {showTranslated ? translatedTitle : notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {showTranslated ? translatedMessage : notif.message}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {notif.link && (
                        <Link 
                            href={notif.link} 
                            onClick={() => markAsRead(notif._id)}
                            className="text-xs font-bold text-navy hover:text-gold flex items-center gap-1"
                        >
                            {t.manage.view} &rarr;
                        </Link>
                    )}
                    {!notif.isRead && (
                        <button 
                            onClick={() => markAsRead(notif._id)}
                            className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1"
                        >
                            <CheckCircleFill /> {t.notificationsPage.markRead}
                        </button>
                    )}
                    
                    {/* Translate Button */}
                    {language !== "en" && (
                        <button 
                            onClick={handleTranslate} 
                            className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1 transition-colors"
                        >
                            <Globe className="text-[10px]" />
                            {loading ? "..." : showTranslated ? t.community.showOriginal : t.community.translate}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function NotificationsContent() {
  const { t, user } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
      try {
          const res = await fetch(`/api/notifications?userId=${user._id}`);
          const data = await res.json();
          if (Array.isArray(data)) {
              setNotifications(data);
          }
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const markAsRead = async (id: string) => {
      // Optimistic Update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      
      try {
          await fetch("/api/notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notificationId: id })
          });
      } catch (error) {
          console.error("Failed to mark read");
      }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
          <div>
              <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                  <Bell className="text-gold" /> {t.notificationsPage.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{t.notificationsPage.subtitle}</p>
          </div>
          <button 
            onClick={() => notifications.forEach(n => !n.isRead && markAsRead(n._id))}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
          >
              <CheckAll className="text-lg" /> {t.notificationsPage.markAllRead}
          </button>
      </div>

      {/* List */}
      <div className="space-y-3">
          {notifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <Bell className="text-4xl text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">{t.notificationsPage.noNotifications}</p>
              </div>
          ) : (
              notifications.map((notif) => (
                  <NotificationItem key={notif._id} notif={notif} markAsRead={markAsRead} />
              ))
          )}
      </div>
    </div>
  );
}