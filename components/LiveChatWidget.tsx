"use client";

import { useState, useEffect, useRef } from "react";
import { 
    ChatQuoteFill, X, Send, Headset, StarFill, CheckCircleFill, 
    Power, Check, CheckAll, ExclamationCircleFill, Globe 
} from "react-bootstrap-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";
// NEW: Import Translation Hook
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";

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
            {/* Show Translate button only for incoming messages (Support) if language isn't English */}
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

  const [isOpen, setIsOpen] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  const isAdminPage = pathname?.startsWith("/dashboard/admin");
  
  // UI States
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Form State
  const [form, setForm] = useState({ 
      name: user?.name || "", 
      email: user?.email || "", 
      message: "", 
      terms: false 
  });

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  // Ref for drag constraints
  const constraintsRef = useRef(null);

  // AUTO-START Logic for Logged-In Users
  useEffect(() => {
      if (user && isOpen && !chatStarted && !sessionId) {
          setForm(prev => ({ 
              ...prev, 
              name: user.name, 
              email: user.email,
              terms: true 
          }));
      }
  }, [user, isOpen, chatStarted, sessionId]);

  useEffect(() => {
      const storedSession = localStorage.getItem("afriq_chat_session");
      if (storedSession) {
          setSessionId(storedSession);
          setChatStarted(true);
      }
  }, []);

  useEffect(() => {
      // Delay mounting by 4 seconds to prioritize main content loading
      const timer = setTimeout(() => setIsMounted(true), 4000);
      return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
      if (!chatStarted || !sessionId || !isOpen) return;
      
      const fetchMessages = async () => {
          try {
              const res = await fetch(`/api/chat/guest?sessionId=${sessionId}`);
              if (!res.ok) return;
              const data = await res.json();
              if (data && Array.isArray(data.messages)) {
                  setMessages(data.messages);
                  if (data.status === 'closed') setIsClosed(true);
                  if(messages.length !== data.messages.length) {
                      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
              }
          } catch (e) { console.error("Poll error", e); }
      };

      fetchMessages();
      const interval = setInterval(fetchMessages, 4000); 
      return () => clearInterval(interval);
  }, [chatStarted, sessionId, isOpen, messages.length]);

  const handleStartChat = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");
      
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
          const res = await fetch("/api/chat/guest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  type: 'start',
                  name: form.name,
                  email: form.email,
                  message: form.message,
                  sessionId: newSession
              })
          });
          
          if (!res.ok) throw new Error("Start failed");
          localStorage.setItem("afriq_chat_session", newSession);
      } catch (error) {
          setErrorMsg(t.postJob.errorConnection);
          setChatStarted(false);
      } finally {
          setLoading(false);
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
      try {
          await fetch("/api/chat/guest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: 'close', sessionId, rating, feedback })
          });
          localStorage.removeItem("afriq_chat_session");
      } catch(e) {
          console.error("Close failed");
      }
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
      setForm({ name: "", email: "", message: "", terms: false });
      setIsClosed(false);
      setRating(0);
      setFeedback("");
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
                    <div className="bg-navy p-3 flex justify-between items-center text-white shadow-md z-10">
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
                                <button 
                                    onClick={() => setShowEndConfirm(true)} 
                                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                                >
                                    <Power /> {t.liveChat.end}
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="hover:text-gold"><X className="text-xl"/></button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto relative">
                        
                        {/* END CHAT CONFIRMATION OVERLAY */}
                        {showEndConfirm && (
                            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                                <ExclamationCircleFill className="text-4xl text-orange-500 mb-3" />
                                <h3 className="font-bold text-navy text-lg mb-1">{t.liveChat.endConfirmTitle}</h3>
                                <p className="text-xs text-gray-500 mb-6">{t.liveChat.endConfirmText}</p>
                                <div className="flex gap-3 w-full">
                                    <button 
                                        onClick={() => setShowEndConfirm(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm"
                                    >
                                        {t.proposal.cancel}
                                    </button>
                                    <button 
                                        onClick={confirmEndChat}
                                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600"
                                    >
                                        {t.liveChat.yesEnd}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!chatStarted ? (
                            <form onSubmit={handleStartChat} className="space-y-4 h-full flex flex-col justify-center">
                                <div className="text-center mb-6">
                                    <h3 className="font-bold text-navy text-lg">{t.liveChat.welcome}</h3>
                                    <p className="text-xs text-gray-500">{t.liveChat.welcomeDesc}</p>
                                </div>
                                {errorMsg && <p className="text-xs text-red-500 text-center bg-red-50 p-2 rounded">{errorMsg}</p>}
                                <input required type="text" placeholder={t.liveChat.yourName} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm text-navy bg-white focus:border-navy outline-none focus:border-navy" />
                                <input required type="email" placeholder={t.liveChat.yourEmail} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm text-navy bg-white focus:border-navy outline-none focus:border-navy" />
                                <textarea required rows={3} placeholder={t.liveChat.howHelp} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm text-navy bg-white focus:border-navy outline-none focus:border-navy resize-none" />
                                
                                <div className="flex items-start gap-2">
                                    <input type="checkbox" required checked={form.terms} onChange={e => setForm({...form, terms: e.target.checked})} className="mt-1" />
                                    <p className="text-[10px] text-gray-500">{t.liveChat.acceptTerms} <a href="/terms" className="text-blue-600 underline">{t.auth.terms}</a> & <a href="/privacy" className="text-blue-600 underline">{t.auth.privacy}</a>.</p>
                                </div>

                                <button disabled={loading} className="w-full bg-navy text-white py-3 rounded-xl font-bold text-sm hover:bg-navy-light transition-colors">
                                    {loading ? t.liveChat.starting : t.liveChat.startChat}
                                </button>
                            </form>
                        ) : isClosed ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
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
                            <div className="space-y-3 pb-2">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] flex flex-col ${msg.sender === 'guest' ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-3 rounded-xl text-xs shadow-sm ${msg.sender === 'guest' ? 'bg-navy text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'}`}>
                                                {/* USE CHAT TEXT SUB-COMPONENT HERE */}
                                                <ChatText text={msg.content} isMe={msg.sender === 'guest'} />
                                            </div>
                                            {msg.sender === 'guest' && (
                                                <div className="flex items-center gap-1 mt-1 mr-1">
                                                    <StatusIcon status={msg.status} />
                                                    <span className="text-[9px] text-gray-400">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef}></div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    {chatStarted && !isClosed && (
                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input 
                                type="text" 
                                value={newMessage} 
                                onChange={e => setNewMessage(e.target.value)} 
                                placeholder={t.chat.type} 
                                className="flex-1 p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <button disabled={isSending} className="p-3 text-navy bg-gray-100 rounded-xl hover:bg-gold hover:text-navy transition-colors disabled:opacity-50">
                                <Send />
                            </button>
                        </form>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Toggle Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="bg-gold text-navy w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 transition-transform active:scale-95 border-4 border-white cursor-move">
              {isOpen ? <X className="text-3xl" /> : <ChatQuoteFill />}
          </button>
      </motion.div>
    </>
  );
}