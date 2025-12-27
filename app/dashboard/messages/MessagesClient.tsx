"use client";

import useSWR from 'swr';
import { useState, useEffect, useRef } from "react";
import { 
    Send, PersonCircle, Search, Globe, Telephone, CameraVideo, 
    ThreeDotsVertical, ArrowLeft, ChatDots, ShieldExclamation, 
    CashCoin, Mic, StopCircle, PlayFill, PauseFill, MicFill,
    BoxArrowUpRight, X, Ban, Flag, TelephoneX, ImageFill, Reply, ArrowDown
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";
import { uploadToCloudinary } from "@/utils/upload";
import UserBadge from "@/components/UserBadge";
import PageLoader from "@/components/PageLoader";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";
import dynamic from 'next/dynamic';

const CallModal = dynamic(() => import("@/components/CallModal"), { ssr: false });
const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- HELPERS (Date & Time) ---
const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) return "Today";
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatSidebarTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
};

const formatLastSeen = (dateString: string | undefined) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    if (date > now) return "Online";
    const diff = now.getTime() - date.getTime();
    
    if (diff < 5 * 60 * 1000) return "Online";

    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Last seen today at ${timeStr}`;
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Last seen yesterday at ${timeStr}`;
    
    return `Last seen ${date.toLocaleDateString()} at ${timeStr}`;
};

// --- SUB-COMPONENTS ---
const VoiceMessagePlayer = ({ src, isMe }: { src: string, isMe: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration || 1;
            setCurrentTime(current);
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current && audioRef.current.duration !== Infinity) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false); setProgress(0); setCurrentTime(0);
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time) || time === Infinity) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? "0" + sec : sec}`;
    };

    return (
        <div className={`flex items-center gap-3 p-2 pr-4 rounded-xl min-w-[240px] select-none transition-colors ${isMe ? 'bg-white/10' : 'bg-gray-200/50'}`}>
            <button onClick={togglePlay} className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-sm transition-transform active:scale-95 ${isMe ? 'bg-white text-navy' : 'bg-navy text-white'}`}>
                {isPlaying ? <PauseFill className="text-lg" /> : <PlayFill className="text-xl ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-[120px]">
                <div className="relative w-full h-1.5 bg-black/10 rounded-full overflow-visible">
                    <div className={`absolute top-0 left-0 h-full rounded-full ${isMe ? 'bg-white/30' : 'bg-gray-300'}`} style={{ width: '100%' }} />
                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear ${isMe ? 'bg-gold' : 'bg-navy'}`} style={{ width: `${progress}%` }}>
                        <div className={`absolute -right-1.5 -top-1 w-3.5 h-3.5 rounded-full shadow-sm ${isMe ? 'bg-white' : 'bg-navy'}`} />
                    </div>
                </div>
                <div className={`flex justify-between text-[10px] font-medium font-mono ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
            <div className={`opacity-50 ${isMe ? 'text-white' : 'text-gray-400'}`}><MicFill className="text-lg" /></div>
            <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} preload="metadata" className="hidden" />
        </div>
    );
};

const MessageBubble = ({ text, isMe }: { text: string, isMe: boolean }) => {
    const { t, language } = useLanguage();
    const { translate, loading } = useGoogleTranslate();
    const [translatedText, setTranslatedText] = useState("");
    const [showTranslated, setShowTranslated] = useState(false);

    const inviteMatch = text.match(/\[JOB_INVITE:([a-zA-Z0-9]+)\]/);
    const jobId = inviteMatch ? inviteMatch[1] : null;
    const cleanText = text.replace(/\[JOB_INVITE:[a-zA-Z0-9]+\]/, "").trim();

    const handleTranslate = async () => {
        if (showTranslated) { setShowTranslated(false); return; }
        if (!translatedText) {
            const res = await translate(cleanText);
            setTranslatedText(res);
        }
        setShowTranslated(true);
    };

    return (
        <div className="flex flex-col gap-2 relative group">
             <div className="whitespace-pre-wrap leading-relaxed">
                 {showTranslated ? translatedText : cleanText}
             </div>
             {jobId && (
                 <a href={`/dashboard/freelancer?jobId=${jobId}`} className="self-start inline-flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-navy-light transition-all shadow-md no-underline mt-1">
                     <BoxArrowUpRight className="text-sm" /> 
                     <span>{t.manage.view}</span>
                 </a>
             )}
             {!isMe && language !== "en" && cleanText && (
                <button onClick={handleTranslate} className={`absolute -bottom-5 right-0 text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-white' : 'text-blue-500'}`} title={t.chat.translate}>
                    <Globe /> {loading ? "..." : showTranslated ? t.chat.original : t.chat.translate}
                </button>
             )}
        </div>
    );
};

const ImageMessage = ({ src, isMe }: { src: string, isMe: boolean }) => (
    <div className={`relative rounded-xl overflow-hidden mb-1 border ${isMe ? 'border-white/20' : 'border-gray-200'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Shared" className="max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(src, '_blank')} />
    </div>
);

// --- MAIN COMPONENT ---
export default function MessagesContent() {
  const { t, user, language, convertPrice } = useLanguage();
  const searchParams = useSearchParams();
  const chatWithId = searchParams.get("chatWith");
  
  // State
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling'>('idle');
  const [loading, setLoading] = useState(true);
  
  // Media State
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAutoScrollEnabled = useRef(true);

  // New Features State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  // Call State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [incomingCall, setIncomingCall] = useState<{ type: 'audio' | 'video', contact: any } | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const [activeContract, setActiveContract] = useState<any>(null);

  // --- INITIAL LOAD & ROUTING ---
  useEffect(() => {
    if (user && chatWithId && contacts.length > 0) {
        const existing = contacts.find(c => c._id === chatWithId);
        if (existing) {
            setActiveContact(existing);
            setShowChatOnMobile(true);
        } else {
            setActiveContact({ _id: chatWithId, name: t.chat.new, avatar: null });
            setShowChatOnMobile(true);
        }
    }
  }, [chatWithId, contacts, user]);

  // --- SWR HOOKS ---
  const { data: chatData, mutate: mutateChat } = useSWR(
      user && activeContact ? `/api/messages?userId=${user._id}&otherId=${activeContact._id}` : null,
      fetcher, { refreshInterval: 1500, keepPreviousData: true }
  );

  const { data: inboxData, mutate: mutateInbox } = useSWR(
      user ? `/api/messages?userId=${user._id}` : null,
      fetcher, { refreshInterval: 4000, keepPreviousData: true }
  );

  // --- EFFECT: PROCESS CHAT DATA ---
  useEffect(() => {
      if (chatData && Array.isArray(chatData)) {
          setMessages(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(chatData)) return chatData;
              return prev;
          });

          // Call Signals & Last Seen
          if (chatData.length > 0) {
              const lastMsg = chatData[chatData.length - 1];
              const otherUser = lastMsg.sender._id === user._id ? lastMsg.receiver : lastMsg.sender;
              
              if (otherUser && otherUser._id === activeContact._id && otherUser.lastSeen) {
                  const lastSeenTime = new Date(otherUser.lastSeen).getTime();
                  const isActuallyOnline = (Date.now() - lastSeenTime) < 5 * 60 * 1000;
                  setActiveContact((prev: any) => ({ ...prev, lastSeen: otherUser.lastSeen, isOnline: isActuallyOnline }));
              }

              if (lastMsg.sender !== user._id && ["[CALL_ENDED]", "[CALL_DECLINED]"].includes(lastMsg.content)) {
                  if (showCallModal) setShowCallModal(false);
              }
          }
      }
  }, [chatData, user, activeContact, showCallModal]);

  // --- EFFECT: PROCESS INBOX DATA ---
  useEffect(() => {
      if (inboxData && Array.isArray(inboxData)) {
          const uniqueUsersMap = new Map();
          inboxData.forEach((msg: any) => {
              const mSenderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
              const isSenderMe = String(mSenderId) === String(user._id);
              const otherUser = isSenderMe ? msg.receiver : msg.sender;
              
              if (otherUser && otherUser._id && !uniqueUsersMap.has(otherUser._id)) {
                  const count = inboxData.filter((m: any) => {
                      const sId = typeof m.sender === 'object' ? m.sender._id : m.sender;
                      const rId = typeof m.receiver === 'object' ? m.receiver._id : m.receiver;
                      return String(sId) === String(otherUser._id) && String(rId) === String(user._id) && !m.isRead;
                  }).length;

                  const lastSeenTime = new Date(otherUser.lastSeen || 0).getTime();
                  const isActuallyOnline = (Date.now() - lastSeenTime) < 5 * 60 * 1000;

                  uniqueUsersMap.set(otherUser._id, { 
                      ...otherUser, 
                      lastSeen: otherUser.lastSeen, isOnline: isActuallyOnline,
                      lastMsg: msg.content.includes("[VOICE_NOTE]") ? "🎤 Voice Note" : msg.content, 
                      time: msg.createdAt, unread: count 
                  });
              }
          });
          setContacts(Array.from(uniqueUsersMap.values()));
          setLoading(false);
      }
  }, [inboxData, user]);

  // --- SCROLL LOGIC ---
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isAutoScrollEnabled.current = distanceFromBottom < 100;
    setShowScrollBtn(distanceFromBottom > 300);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("bg-blue-50");
        setTimeout(() => el.classList.remove("bg-blue-50"), 1000);
    }
  };

  useEffect(() => {
    if (isAutoScrollEnabled.current && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [newMessage]);


  const sendMessage = async (contentOverride?: string) => {
    const contentToSend = contentOverride || newMessage;
    if (!contentToSend.trim()) return;
    
    if (!contentOverride) {
        setNewMessage(""); 
        setReplyingTo(null);
    }
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    isAutoScrollEnabled.current = true;

    if (!contentToSend.startsWith("[")) {
        const tempMsg = {
            _id: Date.now().toString(), 
            sender: user._id, receiver: activeContact._id, content: contentToSend, createdAt: new Date().toISOString(),
            replyTo: replyingTo
        };
        setMessages(prev => [...prev, tempMsg]);
    }

    try {
      const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              sender: user._id,
              receiver: activeContact._id,
              content: contentToSend,
              replyTo: replyingTo?._id
          })
      });

      if (res.status === 400) {
           const data = await res.json();
           setMessages(prev => prev.filter(m => m.content !== contentToSend)); 
           
           if (data.message && (data.message.includes("blocked") || data.message.includes("contact info"))) {
               setShowSecurityModal(true);
           }
      } else {
           mutateChat(); mutateInbox();
      }
    } catch (error) { console.error("Send failed", error); }
  };

  // --- MEDIA & CALL HANDLERS ---
  const startRecording = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return alert(t.chat.micError || "Microphone access denied.");
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = async () => {
              // Cleanup tracks
              stream.getTracks().forEach(track => track.stop());
              
              if (timerRef.current) clearInterval(timerRef.current);
              setRecordingTime(0);

              // 1. Check if it was a real recording (not cancelled)
              // We check this by seeing if isRecording is still true in the state logic flow
              // But since this is a callback, we use the logic below:
              
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              
              // Ignore tiny/empty recordings (< 1 sec usually empty)
              if (audioBlob.size < 1000) {
                  setIsUploadingAudio(false);
                  setIsRecording(false);
                  return; 
              }

              setIsUploadingAudio(true); // Show loading spinner

              try {
                  const audioFile = new File([audioBlob], "voice_note.webm", { type: "audio/webm" });
                  const url = await uploadToCloudinary(audioFile); // Ensure this utility is working
                  
                  if (url) {
                      // Send as 'audio' type for better handling
                      await fetch("/api/messages", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                              sender: user._id,
                              receiver: activeContact._id,
                              content: `[VOICE_NOTE]${url}`, // Legacy text support
                              type: "audio", // Explicit type
                              imageUrl: "", // No image
                              replyTo: replyingTo?._id
                          })
                      });
                      mutateChat();
                      mutateInbox();
                  }
              } catch (error) {
                  console.error("Audio Upload Failed:", error);
                  alert(t.workspace.errorUpload);
              } finally {
                  setIsUploadingAudio(false);
                  setIsRecording(false);
              }
          };

          mediaRecorder.start();
          setIsRecording(true);
          
          setRecordingTime(0);
          timerRef.current = setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);

      } catch (err: any) {
          console.error("Mic Error:", err);
          alert(t.chat.micError);
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
          // State update happens in onstop
      }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current) {
          // Temporarily remove onstop to prevent upload
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
          
          // Cleanup tracks manually since onstop didn't run
          mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
          
          audioChunksRef.current = []; 
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setRecordingTime(0);
      }
  };
  const formatDuration = (sec: number) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; };
  const startCall = async (type: 'audio' | 'video') => { await sendMessage(`[CALL_STARTED:${type}]`); setCallType(type); setShowCallModal(true); };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]; 
        
        // Reset input so same file can be selected again if needed
        e.target.value = ""; 
        
        setIsUploadingImage(true);
        try {
            const url = await uploadToCloudinary(file, "compress");
            if (url) {
                await fetch("/api/messages", { 
                    method: "POST", 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        sender: user._id, 
                        receiver: activeContact._id, 
                        content: "📷 Image", 
                        type: "image", 
                        imageUrl: url,
                        replyTo: replyingTo?._id
                    })
                });
                mutateChat();
                mutateInbox();
                setReplyingTo(null); // Clear reply if any
            }
        } catch (err) { 
            console.error("Image upload failed", err);
            alert("Failed to upload image");
        } finally { 
            setIsUploadingImage(false); 
        }
      }
  };

  // Fetch active contract when contact changes
  useEffect(() => {
    const fetchContractInfo = async () => {
        if (!user?._id || !activeContact?._id) return;
        try {
            const res = await fetch(`/api/contracts?freelancer=${user._id}&client=${activeContact._id}&status=active`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) setActiveContract(data[0]); 
            else setActiveContract(null);
        } catch (error) { setActiveContract(null); }
    };
    if (activeContact) fetchContractInfo();
  }, [user, activeContact]);


  if (loading) return <PageLoader />;

  return (
    <div className="fixed top-16 bottom-16 left-0 right-0 z-40 bg-white md:static md:h-[calc(100vh-140px)] md:rounded-2xl md:shadow-sm md:border border-gray-200 overflow-hidden flex font-sans">
      
      {/* LEFT: CONTACT LIST */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex-col bg-white ${showChatOnMobile ? 'hidden md:flex' : 'flex h-full'}`}>
         <div className="p-4 border-b border-gray-100 shrink-0">
            <h2 className="font-bold text-navy text-xl mb-4">{t.chat.title}</h2>
            <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2 border border-transparent focus-within:border-gray-200 transition-colors">
               <Search className="text-gray-400" />
               <input type="text" placeholder={t.chat.search} className="bg-transparent outline-none text-sm w-full text-navy" />
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
               <div className="p-8 text-center text-gray-400 text-sm">{t.chat.noConversations}</div>
            ) : (
               contacts.map(contact => (
                   <div key={contact._id} onClick={() => { setActiveContact(contact); setShowChatOnMobile(true); }} className={`p-4 flex gap-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${activeContact?._id === contact._id ? 'bg-blue-50/60' : ''}`}>
                       <div className="relative flex-shrink-0">
                           <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                               {contact.avatar ? <img src={contact.avatar} className="w-full h-full object-cover" alt="Avatar"/> : <PersonCircle className="text-5xl text-gray-300 -ml-1 -mt-1" />}
                           </div>
                           {contact.unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 border-2 border-white text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">{contact.unread}</span>}
                       </div>
                       <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <div className="truncate"><UserBadge user={contact} showRating={false} /></div>
                                <span className={`text-[10px] ${contact.unread > 0 ? "text-blue-600 font-bold" : "text-gray-400"}`}>{formatSidebarTime(contact.time)}</span>
                            </div>
                            <p className={`text-xs truncate max-w-[180px] ${contact.unread > 0 ? "font-bold text-navy" : "text-gray-500"}`}>{contact.lastMsg}</p>
                       </div>
                   </div>
               ))
            )}
         </div>
      </div>

      {/* RIGHT: CHAT AREA */}
      <div className={`flex-1 flex-col bg-gray-50 h-full ${!showChatOnMobile ? 'hidden md:flex' : 'flex w-full'}`}>
         {activeContact ? (
             <>
               {/* Chat Header */}
               <div className="sticky top-0 z-30 p-3 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm shrink-0">
                   <div className="flex items-center gap-3">
                        <button onClick={() => setShowChatOnMobile(false)} className="md:hidden text-gray-500 hover:text-navy p-2"><ArrowLeft className="text-xl" /></button>
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                            {activeContact.avatar ? <img src={activeContact.avatar} className="w-full h-full object-cover" alt="Avatar" sizes="40px"/> : <PersonCircle className="text-4xl text-gray-400" />}
                        </div>
                        <div className="min-w-0 flex-1 ml-2">
                             <div className="flex items-center"><UserBadge user={activeContact} showRating={true} /></div>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                 {(() => {
                                     const statusText = formatLastSeen(activeContact.lastSeen);
                                     const isOnline = statusText === "Online";
                                     return (
                                         <>
                                             <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                             <p className={`text-xs ${isOnline ? 'text-gray-600 font-bold' : 'text-gray-400'}`}>{isOnline ? (t.chat.online || "Active Now") : statusText}</p>
                                         </>
                                     );
                                 })()}
                             </div>
                        </div>
                   </div>
                   <div className="flex items-center gap-2">
                        <button onClick={() => startCall('audio')} className="p-2.5 text-gray-500 hover:bg-blue-50 rounded-full"><Telephone className="text-lg" /></button>
                        <button onClick={() => startCall('video')} className="p-2.5 text-gray-500 hover:bg-blue-50 rounded-full"><CameraVideo className="text-lg" /></button>
                        <button onClick={() => setShowOptions(!showOptions)} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full"><ThreeDotsVertical className="text-lg" /></button>
                        {showOptions && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white shadow-xl rounded-xl border border-gray-100 z-20 py-1">
                                <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Ban/> {t.chat.block}</button>
                            </div>
                        )}
                   </div>
               </div>

               {/* ✅ INSERT THIS BLOCK HERE: STRICT SAFETY WARNING */}
               {showSafetyWarning && (
                   <div className="bg-red-50 border-b border-red-100 p-3 flex items-start gap-3 relative animate-in slide-in-from-top-2 z-20">
                       <div className="bg-red-100 p-1.5 rounded-full shrink-0 mt-0.5">
                           <ShieldExclamation className="text-red-600 text-lg" />
                       </div>
                       <div className="flex-1">
                           <p className="text-xs text-red-800 font-bold uppercase tracking-wide mb-0.5">
                               {t.chat.securityTitle || "Account Security Warning"}
                           </p>
                           <p className="text-[11px] text-red-700 leading-snug">
                               {t.chat.securityText || "Do NOT share phone numbers, emails, or external links. Detection will lead to immediate account deactivation. Keep all communication inside AfriqGig for your protection."}
                           </p>
                       </div>
                       <button 
                           onClick={() => setShowSafetyWarning(false)} 
                           className="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded-lg transition-colors"
                       >
                           <X className="text-lg"/>
                       </button>
                   </div>
               )}
               {/* ✅ END INSERT */}

               {/* Messages Feed */}
               <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 relative">
                   {/* Currency Bubble */}
                   {activeContract && (
                        <div className="flex justify-center my-4 sticky top-0 z-10">
                            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xs text-gray-600 animate-in fade-in zoom-in backdrop-blur-sm bg-white/90">
                                <div className="flex items-center gap-2">
                                    <CashCoin className="text-xl text-gold" />
                                    <span className="font-bold text-navy uppercase tracking-wide">Active Contract:</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-base font-bold text-green-600">{convertPrice(activeContract.amount)}</span>
                                    {(activeContract.freelancer === user?._id || activeContract.freelancer?._id === user?._id) && (
                                        <span className="text-gray-400 font-medium ml-1">(Net: {convertPrice(activeContract.amount * 0.95)})</span>
                                    )}
                                </div>
                            </div>
                        </div>
                   )}
                   
                   {/* Messages */}
                   {messages.map((msg, idx) => {
                       const isMe = msg.sender === user?._id;
                       const isAudio = msg.content.startsWith("[VOICE_NOTE]");
                       const audioUrl = isAudio ? msg.content.replace("[VOICE_NOTE]", "") : "";
                       
                       const currentDateLabel = formatMessageDate(msg.createdAt);
                       const prevDateLabel = idx > 0 ? formatMessageDate(messages[idx - 1].createdAt) : null;
                       const showDateSeparator = currentDateLabel !== prevDateLabel;

                       return (
                           <div key={idx} id={`msg-${msg._id}`} className="group relative">
                               {/* Date Divider */}
                               {showDateSeparator && (
                                   <div className="flex justify-center my-6 opacity-80">
                                       <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-gray-200">{currentDateLabel}</span>
                                   </div>
                               )}

                               <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                   
                                   {/* REPLY BUTTON (Hover) - Receiver */}
                                   {!isMe && (
                                       <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-navy hover:bg-gray-200 rounded-full transition-all" title="Reply">
                                           <Reply className="text-sm" />
                                       </button>
                                   )}

                                   <div className={`max-w-[85%] md:max-w-[75%] flex flex-col items-${isMe ? 'end' : 'start'}`}>
                                       
                                       {/* REPLY PREVIEW BUBBLE */}
                                       {msg.replyTo && (
                                           <div onClick={() => scrollToMessage(msg.replyTo._id)} className={`mb-1 px-3 py-2 rounded-lg text-xs cursor-pointer border-l-4 opacity-80 ${isMe ? 'bg-blue-800 text-blue-100 border-blue-400' : 'bg-gray-200 text-gray-600 border-gray-400'}`}>
                                               <p className="font-bold text-[10px] mb-0.5">{msg.replyTo.sender === user._id ? "You" : activeContact.name}</p>
                                               <p className="truncate max-w-[200px] italic">{msg.replyTo.content?.substring(0, 50)}...</p>
                                           </div>
                                       )}

                                       <div className={`p-3 rounded-2xl text-sm shadow-sm relative ${isMe ? 'bg-navy text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm'}`}>
                                           {msg.type === 'image' ? <ImageMessage src={msg.imageUrl} isMe={isMe} /> : isAudio ? <VoiceMessagePlayer src={audioUrl} isMe={isMe} /> : <MessageBubble text={msg.content} isMe={isMe} />}
                                           <div className={`text-[10px] mt-1 flex items-center justify-end gap-2 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                {isMe && <span>{msg.isRead ? <span className="text-blue-300 text-base">✓✓</span> : "✓"}</span>}
                                           </div>
                                       </div>
                                   </div>

                                   {/* REPLY BUTTON (Hover) - Sender */}
                                   {isMe && (
                                       <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-navy hover:bg-gray-200 rounded-full transition-all order-first" title="Reply">
                                           <Reply className="text-sm" />
                                       </button>
                                   )}
                               </div>
                           </div>
                       );
                   })}
                   <div ref={bottomRef} />
                   
                   {/* ✅ FIXED SCROLL BUTTON POSITION (Moved up to bottom-36) */}
                   {showScrollBtn && (
                       <button 
                           onClick={scrollToBottom} 
                           className="fixed bottom-36 right-6 bg-white/90 backdrop-blur text-navy p-3 rounded-full shadow-lg border border-gray-200 hover:bg-navy hover:text-white transition-all z-20 animate-in fade-in slide-in-from-bottom-4"
                       >
                           <ArrowDown className="text-lg" />
                       </button>
                   )}
               </div>

               {/* --- INPUT AREA --- */}
               <div className="sticky bottom-0 z-30 bg-white border-t border-gray-100 p-3 shrink-0 w-full">
                   
                   {/* REPLY BANNER */}
                   {replyingTo && (
                       <div className="flex items-center justify-between bg-gray-50 p-2 rounded-t-xl border-b border-gray-100 mb-2 animate-in slide-in-from-bottom-2">
                           <div className="flex flex-col text-xs pl-2 border-l-4 border-blue-500">
                               <span className="text-blue-600 font-bold mb-0.5">Replying to {replyingTo.sender === user._id ? "yourself" : activeContact.name}</span>
                               <span className="text-gray-500 truncate max-w-[250px]">{replyingTo.content}</span>
                           </div>
                           <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><X className="text-lg" /></button>
                       </div>
                   )}

                   {/* RECORDING UI OVERLAY */}
                   {isRecording ? (
                        <div className="flex items-center justify-between bg-white px-2 py-1 animate-in fade-in duration-200">
                            <div className="flex items-center gap-4 text-red-500 animate-pulse">
                                <MicFill className="text-xl" />
                                <span className="font-mono font-bold text-base">{formatDuration(recordingTime)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-gray-400 text-xs tracking-widest uppercase">
                                <span>Recording...</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={cancelRecording} 
                                    className="text-red-500 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    {t.proposal.cancel}
                                </button>
                                <button 
                                    onClick={stopRecording} 
                                    className="bg-navy text-white w-10 h-10 flex items-center justify-center rounded-full shadow-md hover:bg-navy-light transform hover:scale-105 transition-all"
                                >
                                    <Send className="text-sm ml-0.5" />
                                </button>
                            </div>
                        </div>
                   ) : isUploadingAudio ? (
                        <div className="flex items-center justify-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500 italic">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-navy rounded-full animate-spin"></div>
                            <span>{t.chat.sendingVoice}</span>
                        </div>
                   ) : (
                        <div className="flex items-end gap-2">
                            {/* Attach Image Button */}
                            <button 
                                onClick={() => imageInputRef.current?.click()} 
                                disabled={isUploadingImage} 
                                className="p-3 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-full transition-colors relative"
                                title="Attach Image"
                            >
                                {isUploadingImage ? (
                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-navy rounded-full animate-spin" />
                                ) : (
                                    <ImageFill className="text-xl" />
                                )}
                            </button>
                            {/* Hidden Input */}
                            <input 
                                type="file" 
                                ref={imageInputRef} 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageUpload} 
                            />
                            
                            {/* Text Input */}
                            <textarea 
                                ref={textareaRef} 
                                value={newMessage} 
                                onChange={(e) => setNewMessage(e.target.value)} 
                                onKeyDown={(e) => { 
                                    if (e.key === 'Enter' && !e.shiftKey) { 
                                        e.preventDefault(); 
                                        sendMessage(); 
                                    } 
                                }} 
                                placeholder={t.chat.type} 
                                rows={1} 
                                className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-3 text-base text-navy placeholder-gray-400 focus:ring-1 focus:ring-navy/20 transition-all resize-none max-h-32 scrollbar-thin" 
                            />
                            
                            {/* Send / Mic Button */}
                            {newMessage.trim() ? (
                                <button 
                                    onClick={() => sendMessage()} 
                                    className="bg-navy text-white w-11 h-11 flex items-center justify-center rounded-full shadow-md hover:bg-navy-light transform hover:scale-105 transition-all flex-shrink-0"
                                >
                                    <Send className="text-lg ml-0.5" />
                                </button>
                            ) : (
                                <button 
                                    onClick={startRecording} 
                                    className="bg-gold text-navy w-11 h-11 flex items-center justify-center rounded-full shadow-sm hover:bg-gold-light transform hover:scale-105 transition-all flex-shrink-0"
                                >
                                    <Mic className="text-lg" />
                                </button>
                            )}
                        </div>
                   )}
               </div>
             </>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4"><ChatDots className="text-5xl text-gray-200" /></div>
                 <p className="font-medium text-gray-400">{t.chat.select}</p>
             </div>
         )}
      </div>

      {/* CALL MODAL */}
      <CallModal isOpen={showCallModal} onClose={() => setShowCallModal(false)} contact={activeContact} type={callType} isIncoming={false} />
      
      {/* SECURITY MODAL */}
      {showSecurityModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><ShieldExclamation className="text-4xl text-red-600" /></div>
                  <h3 className="text-xl font-extrabold text-navy mb-2 uppercase tracking-wide">{t.chat.securityTitle || "Security Warning"}</h3>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">{t.chat.securityText || "Sharing contact information is strictly prohibited."}</p>
                  <button onClick={() => setShowSecurityModal(false)} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg">{t.manage.close || "I Understand"}</button>
              </div>
          </div>
      )}
    </div>
  );
}