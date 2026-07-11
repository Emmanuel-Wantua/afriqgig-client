"use client";

import { useState, useEffect, useRef } from "react";
import { 
    ChatQuoteFill, X, Send, Headset, StarFill, CheckCircleFill, 
    Power, Check, CheckAll, ExclamationCircleFill, Globe,
    Image as ImageIcon, GeoAltFill, ZoomIn, Download, ArrowRight, 
    ClockHistory, ChatLeftText // ✅ Added History Icons
} from "react-bootstrap-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";
import { uploadToCloudinary } from "@/utils/upload";
import Image from "next/image"; // For optimized images if needed, but standard img works for dynamic URLs

// --- SUB-COMPONENT: TRANSLATABLE CHAT TEXT ---
const ChatText = ({ text, isMe }: { text: string, isMe: boolean }) => {
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

    return (
        <div className="flex flex-col items-start gap-1">
            <span className="whitespace-pre-wrap">{showTranslated ? translatedText : text}</span>
            {!isMe && language !== "en" && (
                <button 
                    onClick={handleTranslate} 
                    disabled={loading}
                    className="text-[9px] opacity-70 hover:opacity-100 font-bold flex items-center gap-1 transition-opacity border-b border-dotted border-current"
                >
                    <Globe className="text-[8px]" />
                    {loading ? "..." : showTranslated ? t.community.showOriginal : t.community.translate}
                </button>
            )}
        </div>
    );
};

export default function LiveChatWidget() {
  const { user, t } = useLanguage();
  const pathname = usePathname();

  // --- STATE MANAGEMENT ---
  const [isOpen, setIsOpen] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const isAdminPage = pathname?.startsWith("/dashboard/admin");
  
  // UI States
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showReviewPrompt, setShowReviewPrompt] = useState(false); // ✅ Review Popup
  const [previewImage, setPreviewImage] = useState<string | null>(null); // ✅ Lightbox
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat'); // ✅ History Tab
  const [chatHistory, setChatHistory] = useState<any[]>([]); // ✅ History Data

  // Form State
  const [form, setForm] = useState({ 
      name: user?.name || "", 
      email: user?.email || "", 
      message: "", 
      phone: user?.phone || "",
      address: user?.address || "",
      location: user?.country || "",
      terms: false 
  });

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  
  // Chat Data
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const constraintsRef = useRef(null);

  const isReopeningRef = useRef(false);

  // --- EFFECT: LOAD HISTORY ---
  useEffect(() => {
      const stored = localStorage.getItem("afriq_chat_history_log");
      if (stored) {
          try { setChatHistory(JSON.parse(stored)); } catch (e) {}
      }
  }, []);

  // --- EFFECT: AUTO-FILL FORM ---
  useEffect(() => {
      if (user) {
          // We only fill if the field is currently empty to avoid overwriting user edits
          setForm(prev => ({ 
              ...prev, 
              name: prev.name || user.name || "", 
              email: prev.email || user.email || "",
              phone: prev.phone || user.phone || "",       
              location: prev.location || user.country || "", 
              address: prev.address || user.address || "",
              terms: true 
          }));
      }
  }, [user]);

  // --- EFFECT: RESTORE SESSION ---
  useEffect(() => {
      const storedSession = localStorage.getItem("afriq_chat_session");
      if (storedSession) {
          setSessionId(storedSession);
          setChatStarted(true);
      }
  }, []);

  // --- EFFECT: DELAY MOUNT (PERFORMANCE) ---
  useEffect(() => {
      const timer = setTimeout(() => setIsMounted(true), 4000);
      return () => clearTimeout(timer);
  }, []);

  // --- EFFECT: POLL MESSAGES & CHECK STATUS ---
  useEffect(() => {
      if (!chatStarted || !sessionId) return;
      
      const fetchMessages = async () => {
          try {
              const res = await fetch(`/api/chat/guest?sessionId=${sessionId}`);
              if (!res.ok) return;
              const data = await res.json();
              
              if (data && Array.isArray(data.messages)) {
                  setMessages(data.messages);
                  
                  // 1. Check if server auto-closed it while we were away
                  if (data.status === 'closed') {
                      setIsClosed(true);
                      
                      // ✅ If closed, unrated, and widget is hidden -> Show Prompt
                      if (data.rating === 0 && !isOpen) {
                          setShowReviewPrompt(true);
                      }
                  } else {
                      // Ensure local state matches server if reopened elsewhere
                      if (isClosed && !isReopeningRef.current) setIsClosed(false);
                  }

                  if(messages.length !== data.messages.length) {
                      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
              }
          } catch (e) { console.error("Poll error", e); }
      };

      fetchMessages(); // Run once immediately on mount/login
      const interval = setInterval(fetchMessages, 4000); 
      return () => clearInterval(interval);
  }, [chatStarted, sessionId, isOpen, messages.length, isClosed]);

  // --- EFFECT: AUTO-CLOSE TIMER (12 HOURS) ---
  useEffect(() => {
      if (!chatStarted || isClosed || !sessionId) return;

      const inactivityLimit = 12 * 60 * 60 * 1000; // ✅ 12 Hours
      
      const timer = setTimeout(async () => {
          setIsClosed(true);
          setShowReviewPrompt(true); // Trigger Popup
          saveToHistory(sessionId, 'closed');

          try {
              await fetch("/api/chat/guest", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                      type: 'close', 
                      sessionId, 
                      isAutoClose: true 
                  })
              });
          } catch(e) { console.error("Auto-close signal failed", e); }

      }, inactivityLimit);

      return () => clearTimeout(timer);
  }, [chatStarted, isClosed, messages, sessionId]);

  // --- ACTIONS ---

  const saveToHistory = (session: string, status: string = 'closed') => {
      const entry = {
          sessionId: session,
          date: new Date().toISOString(),
          preview: messages.length > 0 ? messages[messages.length - 1].content : "No messages",
          status
      };
      
      const newHistory = [entry, ...chatHistory.filter(h => h.sessionId !== session)].slice(0, 10);
      setChatHistory(newHistory);
      localStorage.setItem("afriq_chat_history_log", JSON.stringify(newHistory));
  };

  const handleReopenChat = async (oldSessionId: string) => {
      console.log("🔄 [LiveChat] User requested to reopen session:", oldSessionId);
      
      // 1. Lock Polling Interference
      isReopeningRef.current = true;
      setLoading(true);
      
      // 2. Force UI Reset Immediately (Hide Modals, Show Chat)
      setShowEndConfirm(false);
      setShowReviewPrompt(false);
      setIsClosed(false);
      
      setSessionId(oldSessionId);
      setChatStarted(true);
      setActiveTab('chat');

      try {
           // 3. Notify Server to Reopen
           console.log("🚀 [LiveChat] Sending Reopen Signal to API...");
           const res = await fetch("/api/chat/guest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                  type: 'message',
                  sessionId: oldSessionId, 
                  content: "[SYSTEM: CHAT REOPENED]",
                  msgType: 'system'
              })
          });

          if (!res.ok) throw new Error("Reopen API call failed");

          // 4. Update Local Storage
          localStorage.setItem("afriq_chat_session", oldSessionId);
          
          // 5. Manually Fetch Latest State (To confirm 'open' status before unlocking)
          const checkRes = await fetch(`/api/chat/guest?sessionId=${oldSessionId}`);
          const checkData = await checkRes.json();
          
          if (checkData && Array.isArray(checkData.messages)) {
              setMessages(checkData.messages);
              // Only close if server insists it's closed AND we aren't reopening
              if (checkData.status === 'closed') {
                  console.warn("⚠️ [LiveChat] Server still reports closed. Forcing open locally.");
                  // We don't set isClosed(true) here, we trust the user's action
              }
          }

      } catch (e) {
          console.error("❌ [LiveChat] Reopen failed:", e);
      } finally {
          // 6. Release Lock after a short delay to allow server propagation
          setTimeout(() => {
              isReopeningRef.current = false;
              setLoading(false);
              console.log("🔓 [LiveChat] Reopen lock released.");
          }, 2000);
      }
  };
  

  const handleStartChat = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");

      console.log("📝 [LiveChat] Starting Chat with Form Data:", form);
      
      if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || 
          !form.location.trim() || !form.address.trim() || !form.message.trim()) {
          setErrorMsg(t.workspace.fillAllFields || "Please fill in all fields.");
          return;
      }

      if (!form.terms) {
          setErrorMsg(t.liveChat.acceptTermsError);
          return;
      }
      
      setLoading(true);
      const newSession = `guest_${Date.now()}`;
      
      setMessages([{ sender: 'guest', content: form.message, status: 'sending', timestamp: new Date() }]);
      setSessionId(newSession);
      setChatStarted(true);
      
      try {
          const payload = {
              type: 'start',
              name: form.name,
              email: form.email,
              phone: form.phone,
              location: form.location,
              address: form.address,
              message: form.message,
              sessionId: newSession
          };

          const res = await fetch("/api/chat/guest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });
          
          if (!res.ok) throw new Error("Start failed");
          localStorage.setItem("afriq_chat_session", newSession);
          saveToHistory(newSession, 'open');
      } catch (error) {
          setErrorMsg(t.postJob.errorConnection);
          setChatStarted(false);
      } finally {
          setLoading(false);
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          const tempId = Date.now();
          setMessages(prev => [...prev, { _id: tempId, sender: 'guest', content: '📷 Uploading image...', status: 'sending', timestamp: new Date() }]);
          
          try {
              const url = await uploadToCloudinary(file);
              if (url) {
                  const res = await fetch("/api/chat/guest", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                          type: 'message', 
                          sessionId, 
                          content: "Image", 
                          msgType: 'image', 
                          imageUrl: url 
                      })
                  });
                  
                  if (!res.ok) throw new Error("Failed");
                  setMessages(prev => prev.map(m => m._id === tempId ? { 
                      ...m, content: "Image", imageUrl: url, status: 'sent', msgType: 'image'
                  } : m));
              }
          } catch (err) {
              setMessages(prev => prev.map(m => m._id === tempId ? { ...m, content: '❌ Image upload failed', status: 'failed' } : m));
          }
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || isSending) return;
      
      const msgContent = newMessage;
      setNewMessage("");
      setIsSending(true);
      
      const tempId = Date.now();
      setMessages(prev => [...prev, { _id: tempId, sender: 'guest', content: msgContent, status: 'sending', timestamp: new Date() }]);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

      try {
          const res = await fetch("/api/chat/guest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: 'message', sessionId, content: msgContent })
          });
          
          if (res.status === 404) {
              localStorage.removeItem("afriq_chat_session");
              setChatStarted(false);
              setMessages([]);
              alert(t.liveChat.sessionExpired);
              return;
          }
          
          if(!res.ok) throw new Error("Failed");
          setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'sent' } : m));

      } catch (e) {
          setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m));
      } finally {
          setIsSending(false);
      }
  };

  const confirmEndChat = async () => {
      setShowEndConfirm(false);
      setIsClosed(true);
      saveToHistory(sessionId, 'closed'); // ✅ Save History
      try {
          await fetch("/api/chat/guest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: 'close', sessionId, rating, feedback })
          });
          localStorage.removeItem("afriq_chat_session");
      } catch(e) { console.error("Close failed"); }
  };

  const submitRating = async () => {
      await fetch("/api/chat/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'close', sessionId, rating, feedback })
      });
      setIsOpen(false); 
      setChatStarted(false);
      setMessages([]);
      // ✅ FIX: Reset all fields
      setForm({ name: "", email: "", message: "", phone: "", address: "", location: "", terms: false });
      setIsClosed(false);
      setRating(0);
      setFeedback("");
      localStorage.removeItem("afriq_chat_session");
  };

  const StatusIcon = ({ status }: { status: string }) => {
      if (status === 'sending') return <span className="text-[9px] text-gray-300 italic">...</span>;
      if (status === 'failed') return <ExclamationCircleFill className="text-[10px] text-red-500" title="Failed to send" />;
      if (status === 'sent') return <Check className="text-[12px] text-gray-300" />;
      return <CheckAll className="text-[12px] text-blue-300" />;
  };
  
  if (isAdminPage || !isMounted) return null;

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100]" />

      <motion.div 
          drag
          dragConstraints={constraintsRef}
          dragMomentum={false} 
          dragElastic={0.1}
          className="fixed bottom-24 md:bottom-6 right-4 z-[101] font-sans pointer-events-auto touch-none"
      >
        <AnimatePresence>
              {isOpen && (
                  <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      className="bg-white w-[320px] md:w-[350px] h-[470px] md:h-[500px] max-h-[75vh] rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4 relative cursor-default"
                      onPointerDownCapture={(e) => e.stopPropagation()} 
                  >
                    {/* Header */}
                    <div className="bg-navy p-3 flex justify-between items-center text-white shadow-md z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="bg-white/20 p-2 rounded-full"><Headset /></div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-navy rounded-full"></span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{t.liveChat.support}</h4>
                                <p className="text-[10px] text-blue-200">{t.liveChat.online}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {chatStarted && !isClosed && (
                                <button onClick={() => setShowEndConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
                                    <Power /> {t.liveChat.end}
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="hover:text-gold"><X className="text-xl"/></button>
                        </div>
                    </div>

                    {/* TABS (Only if history exists) */}
                    {chatHistory.length > 0 && !chatStarted && (
                        <div className="flex bg-gray-50 p-1 mx-4 mt-4 rounded-xl border border-gray-100">
                            <button 
                                onClick={() => setActiveTab('chat')} 
                                className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                    activeTab === 'chat' 
                                    ? 'bg-white text-navy shadow-sm ring-1 ring-black/5' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <ChatLeftText /> {t.liveChat.newChat || "New Chat"}
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')} 
                                className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                    activeTab === 'history' 
                                    ? 'bg-white text-navy shadow-sm ring-1 ring-black/5' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <ClockHistory /> {t.liveChat.history || "History"}
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 bg-gray-50 overflow-hidden relative flex flex-col">
                        
                        {/* END CHAT CONFIRMATION OVERLAY */}
                        {showEndConfirm && (
                            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                                <ExclamationCircleFill className="text-4xl text-orange-500 mb-3" />
                                <h3 className="font-bold text-navy text-lg mb-1">{t.liveChat.endConfirmTitle}</h3>
                                <p className="text-xs text-gray-500 mb-6">{t.liveChat.checkHistory}</p>
                                <div className="flex gap-3 w-full">
                                    <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">{t.proposal.cancel}</button>
                                    <button onClick={confirmEndChat} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600">{t.liveChat.yesEnd}</button>
                                </div>
                            </div>
                        )}

                        {/* ✅ HISTORY TAB VIEW */}
                        {activeTab === 'history' && !chatStarted ? (
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Conversations</span>
                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{chatHistory.length}</span>
                                </div>
                                
                                {chatHistory.map((hist) => (
                                    <div 
                                        key={hist.sessionId} 
                                        onClick={() => handleReopenChat(hist.sessionId)}
                                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gold/30 transition-all cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${hist.status === 'closed' ? 'bg-gray-300' : 'bg-green-500 animate-pulse'}`}></div>
                                                <span className="text-xs font-bold text-navy">
                                                    {new Date(hist.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {new Date(hist.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                                            {hist.preview}
                                        </p>
                                        
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                            <span className={`text-[9px] px-2 py-1 rounded-md font-medium uppercase ${
                                                hist.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
                                            }`}>
                                                {hist.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-gold group-hover:underline flex items-center gap-1">
                                                {t.liveChat.reopen || "Resume"} <ArrowRight className="text-[9px]" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* ✅ MAIN CHAT VIEW */
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                {!chatStarted ? (
                                    <form onSubmit={handleStartChat} className="flex flex-col h-full p-4">
                                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                            <div className="text-center mb-4">
                                                <h3 className="font-bold text-navy text-lg">{t.liveChat.welcome}</h3>
                                                <p className="text-xs text-gray-500">{t.liveChat.welcomeDesc}</p>
                                            </div>

                                            {errorMsg && (
                                                <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                                    <ExclamationCircleFill /> {errorMsg}
                                                </div>
                                            )}

                                            <input required type="text" placeholder={t.liveChat.yourName} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-navy outline-none" />
                                            <input required type="email" placeholder={t.liveChat.yourEmail} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-navy outline-none" />
                                            <input required type="tel" placeholder={t.auth.phone} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-navy outline-none" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input required type="text" placeholder={t.auth.location + " (Country)"} value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-navy outline-none" />
                                                <input required type="text" placeholder="City / Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-navy outline-none" />
                                            </div>
                                            <textarea required rows={3} placeholder={t.liveChat.howHelp} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-navy outline-none resize-none" />
                                        </div>

                                        <div className="pt-4 mt-2 border-t border-gray-100 bg-white shrink-0">
                                            <div className="flex items-start gap-2 mb-4">
                                                <input type="checkbox" required checked={form.terms} onChange={e => setForm({...form, terms: e.target.checked})} className="mt-1" />
                                                <p className="text-[10px] text-gray-500 leading-tight">
                                                    {t.liveChat.acceptTerms} <a href="/terms" target="_blank" className="text-blue-600 underline">{t.auth.terms}</a>.
                                                </p>
                                            </div>
                                            <button disabled={loading} className="w-full bg-navy text-white py-3 rounded-xl font-bold text-sm hover:bg-navy-light transition-colors shadow-lg shadow-navy/20">
                                                {loading ? t.liveChat.starting : t.liveChat.startChat}
                                            </button>
                                        </div>
                                    </form>
                                ) : isClosed ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in p-4">
                                        <CheckCircleFill className="text-4xl text-green-500" />
                                        <h3 className="font-bold text-navy">{t.liveChat.chatEnded}</h3>
                                        <p className="text-xs text-gray-500">{t.liveChat.experience}</p>
                                        <div className="flex gap-2">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} onClick={() => setRating(star)} className={`text-2xl ${rating >= star ? 'text-gold' : 'text-gray-300'}`}><StarFill /></button>
                                            ))}
                                        </div>
                                        <textarea placeholder={t.liveChat.feedback} value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm text-navy bg-white focus:border-navy outline-none" rows={3}></textarea>
                                        <button onClick={submitRating} className="bg-navy text-white px-6 py-2 rounded-xl text-sm font-bold">{t.workspace.submitReview}</button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-2 custom-scrollbar">
                                            {messages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] flex flex-col ${msg.sender === 'guest' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`p-3 rounded-xl text-xs shadow-sm ${msg.sender === 'guest' ? 'bg-navy text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'}`}>
                                                            {msg.imageUrl ? (
                                                                <div className="mb-1">
                                                                    <button onClick={() => setPreviewImage(msg.imageUrl)} className="block overflow-hidden rounded-lg border border-white/20 group relative">
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img src={msg.imageUrl} alt="Shared" className="max-w-[200px] max-h-[150px] object-cover transition-transform group-hover:scale-105" />
                                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><ZoomIn className="text-xl" /></div>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <ChatText text={msg.content} isMe={msg.sender === 'guest'} />
                                                            )}
                                                        </div>
                                                        {msg.sender === 'guest' && (
                                                            <div className="flex items-center gap-1 mt-1 mr-1">
                                                                <StatusIcon status={msg.status} />
                                                                <span className="text-[9px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={bottomRef}></div>
                                        </div>

                                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end shrink-0">
                                            <label className="p-2.5 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-xl cursor-pointer transition-colors" title="Send Image">
                                                <ImageIcon className="text-lg" />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t.chat.type} className="flex-1 p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                                            <button disabled={isSending} className="p-3 text-navy bg-gray-100 rounded-xl hover:bg-gold hover:text-navy transition-colors disabled:opacity-50"><Send /></button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ✅ REVIEW PROMPT BUBBLE */}
        <AnimatePresence>
            {!isOpen && showReviewPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute bottom-20 right-0 bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-64 z-50 cursor-pointer"
                    onClick={() => { setIsOpen(true); setShowReviewPrompt(false); }} // Clicking bubble opens chat
                >
                    <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-navy text-sm">{t.liveChat.chatEnded}</h5>
                        <button onClick={(e) => { e.stopPropagation(); setShowReviewPrompt(false); }} className="text-gray-400 hover:text-red-500">
                            <X />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {t.liveChat.chatClosedInactivity || "Chat closed due to inactivity. Click the icon below to leave a review or view history."}
                    </p>
                    
                    {/* Little triangle pointer */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-100"></div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Toggle Button */}
          <button onClick={() => { setIsOpen(!isOpen); setShowReviewPrompt(false); }} className="bg-gold text-navy w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 transition-transform active:scale-95 border-4 border-white cursor-move">
              {isOpen ? <X className="text-3xl" /> : <ChatQuoteFill />}
          </button>
      </motion.div>

      {/* --- LIGHTBOX MODAL --- */}
      <AnimatePresence>
          {previewImage && (
              <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                  onClick={() => setPreviewImage(null)}
              >
                  <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-2 rounded-full transition-colors z-50"><X className="text-3xl" /></button>
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                      className="relative max-w-full max-h-full"
                      onClick={(e) => e.stopPropagation()}
                  >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewImage} alt="Preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-md shadow-2xl" />
                      <a href={previewImage} download target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-white/90 text-navy p-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white shadow-lg"><Download /> Download</a>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}