"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Send, PersonCircle, Search, Globe, Telephone, CameraVideo, 
    ThreeDotsVertical, ArrowLeft, ChatDots, ShieldExclamation, 
    CashCoin, Mic, StopCircle, PlayFill, PauseFill, MicFill,
    BoxArrowUpRight, X, Ban, Flag, TelephoneX
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";
import { uploadToCloudinary } from "@/utils/upload";
import UserBadge from "@/components/UserBadge";
import PageLoader from "@/components/PageLoader";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";
import dynamic from 'next/dynamic';
const CallModal = dynamic(() => import("@/components/CallModal"), { ssr: false });

// --- PROFESSIONAL VOICE PLAYER COMPONENT ---
const VoiceMessagePlayer = ({ src, isMe }: { src: string, isMe: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
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
        if (audioRef.current) {
            const d = audioRef.current.duration;
            if(d !== Infinity) setDuration(d);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time) || time === Infinity) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? "0" + sec : sec}`;
    };

    return (
        <div className={`flex items-center gap-3 p-2 pr-4 rounded-xl min-w-[240px] select-none transition-colors ${
            isMe ? 'bg-white/10' : 'bg-gray-200/50'
        }`}>
            <button 
                onClick={togglePlay}
                className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-sm transition-transform active:scale-95 ${
                    isMe ? 'bg-white text-navy' : 'bg-navy text-white'
                }`}
            >
                {isPlaying ? <PauseFill className="text-lg" /> : <PlayFill className="text-xl ml-0.5" />}
            </button>
            
            <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-[120px]">
                <div className="relative w-full h-1.5 bg-black/10 rounded-full overflow-visible">
                    <div className={`absolute top-0 left-0 h-full rounded-full ${isMe ? 'bg-white/30' : 'bg-gray-300'}`} style={{ width: '100%' }} />
                    <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear ${isMe ? 'bg-gold' : 'bg-navy'}`} 
                        style={{ width: `${progress}%` }}
                    >
                        <div className={`absolute -right-1.5 -top-1 w-3.5 h-3.5 rounded-full shadow-sm ${isMe ? 'bg-white' : 'bg-navy'}`} />
                    </div>
                </div>
                <div className={`flex justify-between text-[10px] font-medium font-mono ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className={`opacity-50 ${isMe ? 'text-white' : 'text-gray-400'}`}>
                <MicFill className="text-lg" />
            </div>

            <audio 
                ref={audioRef} 
                src={src} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
                className="hidden"
            />
        </div>
    );
};

// --- SUB-COMPONENT: Message Bubble (Handles Translation) ---
const MessageBubble = ({ text, isMe }: { text: string, isMe: boolean }) => {
    const { t, language } = useLanguage();
    const { translate, loading } = useGoogleTranslate();
    const [translatedText, setTranslatedText] = useState("");
    const [showTranslated, setShowTranslated] = useState(false);

    // 1. Check if message contains the Invite Tag
    const inviteMatch = text.match(/\[JOB_INVITE:([a-zA-Z0-9]+)\]/);
    const jobId = inviteMatch ? inviteMatch[1] : null;

    // 2. Clean the text
    const cleanText = text.replace(/\[JOB_INVITE:[a-zA-Z0-9]+\]/, "").trim();

    const handleTranslate = async () => {
        if (showTranslated) {
            setShowTranslated(false);
            return;
        }
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
             
             {/* Render Button if Job Invite */}
             {jobId && (
                 <a 
                     href={`/dashboard/freelancer?jobId=${jobId}`}
                     className="self-start inline-flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-navy-light transition-all shadow-md no-underline mt-1"
                 >
                     <BoxArrowUpRight className="text-sm" /> 
                     <span>{t.manage.view}</span> {/* Using existing translation */}
                 </a>
             )}

             {/* Translate Button */}
             {!isMe && language !== "en" && cleanText && (
                <button 
                    onClick={handleTranslate} 
                    className={`absolute -bottom-5 right-0 text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-white' : 'text-blue-500'}`}
                    title={t.chat.translate}
                >
                    <Globe /> {loading ? "..." : showTranslated ? t.chat.original : t.chat.translate}
                </button>
             )}
        </div>
    );
};


// --- MAIN CONTENT LOGIC ---
export default function MessagesContent() {
  const { t, user, language, convertPrice } = useLanguage();
  const searchParams = useSearchParams();
  const chatWithId = searchParams.get("chatWith");
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const [showSafetyWarning, setShowSafetyWarning] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling'>('idle');
  const [loading, setLoading] = useState(true);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAutoScrollEnabled = useRef(true);

  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- CALL STATE ---
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  const [incomingCall, setIncomingCall] = useState<{ type: 'audio' | 'video', contact: any } | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const [activeContract, setActiveContract] = useState<any>(null);

  useEffect(() => {
    if (user) fetchInbox();
  }, [user]);

  useEffect(() => {
    if (user && chatWithId) {
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

  useEffect(() => {
    if (user && activeContact) {
        fetchConversation(activeContact._id);
        const interval = setInterval(() => fetchConversation(activeContact._id), 3000);
        return () => clearInterval(interval);
    }
  }, [user, activeContact]);

  useEffect(() => {
    if (isAutoScrollEnabled.current && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch active contract when contact changes
  useEffect(() => {
      const fetchContractInfo = async () => {
          // LOG 1: Check inputs
          console.log("🔍 [CONTRACT CHECK] Triggered.");
          console.log("   - User ID:", user?._id);
          console.log("   - Contact ID:", activeContact?._id);

          if (!user?._id || !activeContact?._id) {
              console.log("⚠️ [CONTRACT CHECK] Aborted: Missing User or Contact ID.");
              return;
          }

          try {
              // Construct URL
              const url = `/api/contracts?freelancer=${user._id}&client=${activeContact._id}&status=active`;
              console.log("🚀 [CONTRACT CHECK] Fetching URL:", url);

              const res = await fetch(url);
              
              // LOG 2: Check Response Status
              console.log("📡 [CONTRACT CHECK] API Status:", res.status);

              const contentType = res.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                  console.error("❌ [CONTRACT CHECK] Error: API returned HTML instead of JSON.");
                  return;
              }

              const data = await res.json();
              console.log("📦 [CONTRACT CHECK] Data Received:", data);
              
              // LOG 3: Check Logic
              if (Array.isArray(data) && data.length > 0) {
                  // Check if we found the contract where specific roles match
                  // Try to find one where current user is involved
                  const contract = data[0]; 
                  console.log("✅ [CONTRACT CHECK] Active Contract Found:", contract._id, "Amount:", contract.amount);
                  setActiveContract(contract); 
              } else {
                  console.log("⚠️ [CONTRACT CHECK] No active contracts found between these users.");
                  // Fallback: Try swapping IDs in case roles are reversed in URL logic?
                  // (Usually the API handles 'freelancer OR client' logic, but let's stick to standard first)
                  setActiveContract(null);
              }
          } catch (error) {
              console.error("❌ [CONTRACT CHECK] Fetch Exception:", error);
              setActiveContract(null);
          }
      };

      if (activeContact) fetchContractInfo();
  }, [user, activeContact]);

  const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isAutoScrollEnabled.current = distanceFromBottom < 100;
  };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [newMessage]);

  // Add a ref to track the last processed message ID to prevent loops
  const lastProcessedMsgId = useRef<string | null>(null);



  const fetchInbox = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${user._id}`);
      const data = await res.json();
      
      const uniqueUsersMap = new Map();
      if (Array.isArray(data)) {
          data.forEach((msg: any) => {
              const isSenderMe = msg.sender._id === user._id || msg.sender === user._id;
              const otherUser = isSenderMe ? msg.receiver : msg.sender;
              
              if (otherUser && !uniqueUsersMap.has(otherUser._id)) {
                  const count = data.filter((m: any) => {
                      const mSender = m.sender._id || m.sender;
                      const mReceiver = m.receiver._id || m.receiver;
                      return mSender === otherUser._id && mReceiver === user._id && !m.isRead;
                  }).length;

                  uniqueUsersMap.set(otherUser._id, { 
                      ...otherUser, 
                      lastMsg: msg.content.includes("[VOICE_NOTE]") ? "🎤 Voice Note" : msg.content, 
                      time: msg.createdAt,
                      unread: count 
                  });
              }
          });
      }
      setContacts(Array.from(uniqueUsersMap.values()));
    } catch (error) { 
        console.error("Inbox Load Error:", error); 
    } finally {
        setLoading(false); 
    }
  };

  const fetchConversation = async (otherId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${user._id}&otherId=${otherId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
          setMessages(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
              return prev;
          });
      }
    } catch (error) { console.error(error); }
  };

  const sendMessage = async (contentOverride?: string) => {
    const contentToSend = contentOverride || newMessage;
    if (!contentToSend.trim()) return;
    
    if (!contentOverride) setNewMessage(""); 
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    isAutoScrollEnabled.current = true;

    const tempMsg = {
        _id: Date.now().toString(), 
        sender: user._id,
        receiver: activeContact._id,
        content: contentToSend,
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              sender: user._id,
              receiver: activeContact._id,
              content: contentToSend
          })
      });
      fetchConversation(activeContact._id);
      fetchInbox(); 
    } catch (error) { console.error("Send failed", error); }
  };

  const startRecording = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return alert(t.chat.micError);
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
              if (timerRef.current) clearInterval(timerRef.current);
              setRecordingTime(0);

              setIsUploadingAudio(true);
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              
              if (audioBlob.size < 1000) {
                  setIsUploadingAudio(false);
                  setIsRecording(false);
                  return; 
              }

              const audioFile = new File([audioBlob], "voice_note.webm", { type: "audio/webm" });
              stream.getTracks().forEach(track => track.stop()); 

              const url = await uploadToCloudinary(audioFile);
              setIsUploadingAudio(false);
              
              if (url) {
                  await sendMessage(`[VOICE_NOTE]${url}`);
              } else {
                  alert(t.workspace.errorUpload);
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
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          audioChunksRef.current = []; 
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setRecordingTime(0);
      }
  };

  const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- OUTGOING CALL (Initiator Only) ---
  const startCall = async (type: 'audio' | 'video') => {
      await sendMessage(`[CALL_STARTED:${type}]`); 
      setCallType(type);
      setShowCallModal(true); // Open modal immediately for caller
  };

  // --- UPDATED HELPER: Render Content ---
  const renderMessageContent = (text: string) => {
      // 1. Handle Job Invites
      const inviteMatch = text.match(/\[JOB_INVITE:([a-zA-Z0-9]+)\]/);
      if (inviteMatch) {
          const cleanText = text.replace(/\[JOB_INVITE:[a-zA-Z0-9]+\]/, "").trim();
          return (
              <div className="flex flex-col gap-2">
                  <span className="whitespace-pre-wrap">{cleanText}</span>
                  <a 
                      href={`/dashboard/freelancer?jobId=${inviteMatch[1]}`}
                      className="self-start inline-flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-navy-light transition-all shadow-md no-underline mt-1"
                  >
                      <BoxArrowUpRight className="text-sm" /> 
                      <span>{t.manage.view}</span>
                  </a>
              </div>
          );
      }

      // 2. Handle Calls (NEW)
      const callMatch = text.match(/\[CALL_STARTED:(audio|video)\]/);
      if (callMatch) {
          const type = callMatch[1];
          return (
              <div className="flex items-center gap-2 text-xs font-bold italic opacity-80">
                  {type === 'video' ? <CameraVideo /> : <Telephone />}
                  <span>{type === 'video' ? "Video Call Started" : "Audio Call Started"}</span>
              </div>
          );
      }

      // 3. Default Text
      return <span className="whitespace-pre-wrap">{text}</span>;
  };

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
                   <div 
                       key={contact._id}
                       onClick={() => { setActiveContact(contact); setShowChatOnMobile(true); }}
                       className={`p-4 flex gap-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${activeContact?._id === contact._id ? 'bg-blue-50/60' : ''}`}
                   >
                       <div className="relative flex-shrink-0">
                           <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                               {contact.avatar ? (
                                   // eslint-disable-next-line @next/next/no-img-element
                                   <img src={contact.avatar} className="w-full h-full object-cover" alt="Avatar"/>
                               ) : <PersonCircle className="text-5xl text-gray-300 -ml-1 -mt-1" />}
                           </div>
                           {contact.unread > 0 && (
                               <span className="absolute -top-1 -right-1 bg-red-500 border-2 border-white text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
                                   {contact.unread}
                               </span>
                           )}
                       </div>
                       <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <div className="truncate">
                                    <UserBadge user={contact} showRating={false} />
                                </div>
                                <span className={`text-[10px] ${contact.unread > 0 ? "text-blue-600 font-bold" : "text-gray-400"}`}>
                                    {new Date(contact.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className={`text-xs truncate max-w-[180px] ${contact.unread > 0 ? "font-bold text-navy" : "text-gray-500"}`}>
                                {contact.lastMsg}
                            </p>
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
                       <button onClick={() => setShowChatOnMobile(false)} className="md:hidden text-gray-500 hover:text-navy p-2">
                           <ArrowLeft className="text-xl" />
                       </button>
                       <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                           {activeContact.avatar ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img src={activeContact.avatar} className="w-full h-full object-cover" alt="Avatar"/>
                           ) : <PersonCircle className="text-4xl text-gray-400" />}
                       </div>
                       <div className="min-w-0 flex-1"> {/* ✅ Enable shrinking */}
                            <div className="flex items-center">
                                <span className="truncate max-w-[150px]"> {/* ✅ Force Truncation */}
                                    <UserBadge user={activeContact} showRating={true} />
                                </span>
                            </div>
                           <div className="flex items-center gap-1.5 mt-0.5">
                               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                               <p className="text-xs text-gray-500">{t.chat.online}</p>
                           </div>
                       </div>
                   </div>
                   <div className="flex items-center gap-2">
                           <button onClick={() => startCall('audio')} className="p-2.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"><Telephone className="text-lg" /></button>
                           <button onClick={() => startCall('video')} className="p-2.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"><CameraVideo className="text-lg" /></button>
                           
                           <div className="relative">
                               <button onClick={() => setShowOptions(!showOptions)} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"><ThreeDotsVertical className="text-lg" /></button>
                               {showOptions && (
                                   <div className="absolute right-0 top-full mt-2 w-40 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden z-20 py-1">
                                           <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Ban/> {t.chat.block}</button>
                                           <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"><Flag/> {t.chat.report}</button>
                                   </div>
                               )}
                           </div>
                       </div>
               </div>

               {/* ⚠️ SAFETY WARNING */}
                   {showSafetyWarning && (
                       <div className="bg-orange-50 border-b border-orange-100 p-3 flex items-start gap-3 relative animate-in slide-in-from-top-2">
                           <ShieldExclamation className="text-orange-500 text-xl mt-0.5 shrink-0" />
                           <div className="flex-1">
                               <p className="text-xs text-orange-800 font-bold">{t.chat.safetyTitle}</p>
                               <p className="text-[11px] text-orange-700 leading-tight">
                                   {t.chat.safety}
                               </p>
                           </div>
                           <button onClick={() => setShowSafetyWarning(false)} className="text-orange-400 hover:text-orange-600"><X /></button>
                       </div>
                   )}

               {/* Messages Feed */}
               <div 
                   ref={scrollContainerRef}
                   onScroll={handleScroll}
                   className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
               >
                   {/* Currency Bubble - Shows ONLY if there is an active contract */}
                   {activeContract && (
                       <div className="flex justify-center my-4 sticky top-0 z-10">
                           <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xs text-gray-600 animate-in fade-in zoom-in backdrop-blur-sm bg-white/90">
                               <div className="flex items-center gap-2">
                                   <CashCoin className="text-xl text-gold" />
                                   <span className="font-bold text-navy uppercase tracking-wide">Active Contract:</span>
                               </div>
                               
                               <div className="flex items-center gap-1">
                                   <span className="text-base font-bold text-green-600">
                                       {convertPrice(activeContract.amount)}
                                   </span>
                                   
                                   {/* ✅ FIX: Show Net Amount ONLY to the Freelancer */}
                                   {/* We check if the current logged-in user's ID matches the freelancer's ID on the contract */}
                                   {(activeContract.freelancer === user?._id || activeContract.freelancer?._id === user?._id) && (
                                       <span className="text-gray-400 font-medium ml-1">
                                           (Net: {convertPrice(activeContract.amount * 0.95)})
                                       </span>
                                   )}
                               </div>
                           </div>
                       </div>
                   )}

                   {messages.map((msg, idx) => {
                       const isMe = msg.sender === user?._id;
                       const isAudio = msg.content.startsWith("[VOICE_NOTE]");
                       const audioUrl = isAudio ? msg.content.replace("[VOICE_NOTE]", "") : "";

                       return (
                           <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] md:max-w-[75%] p-3 rounded-2xl text-sm shadow-sm relative group ${
                                   isMe ? 'bg-navy text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm'
                               }`}>
                                   
                                   {/* CONTENT RENDERER */}
                                   {isAudio ? (
                                       <VoiceMessagePlayer src={audioUrl} isMe={isMe} />
                                   ) : (
                                       <MessageBubble text={msg.content} isMe={isMe} />
                                   )}
                                   
                                   {/* Hide timestamp for audio (player has its own), show for text */}
                                   {!isAudio && (
                                       <div className={`text-[10px] mt-1 flex items-center justify-end gap-2 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                       );
                   })}
                   <div ref={bottomRef} />
               </div>

               {/* Input Area (Text + Mic) */}
               <div className="sticky bottom-0 z-30 bg-white border-t border-gray-100 p-3 shrink-0 w-full">
                   {isRecording ? (
                       <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-2xl px-4 py-2 animate-in fade-in slide-in-from-bottom-2">
                           <div className="flex items-center gap-3">
                               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                               <span className="text-red-600 font-mono font-bold text-sm">
                                   {formatDuration(recordingTime)}
                               </span>
                               {/* Fake Waveform Visual */}
                               <div className="flex gap-0.5 items-end h-4">
                                   {[1,2,3,4,5].map(i => (
                                       <div key={i} className="w-1 bg-red-300 rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                                   ))}
                               </div>
                           </div>
                           
                           <div className="flex gap-2">
                               <button onClick={cancelRecording} className="text-xs text-gray-500 font-bold px-3 py-2 hover:text-red-600">
                                   {t.proposal.cancel}
                               </button>
                               <button onClick={stopRecording} className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-transform hover:scale-110">
                                   <Send className="text-sm" />
                               </button>
                           </div>
                       </div>
                   ) : isUploadingAudio ? (
                        <div className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-500 italic">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-navy rounded-full animate-spin"></div>
                            {t.chat.sendingVoice}
                        </div>
                   ) : (
                       <div className="flex items-end gap-2">
                           {/* Default Text Input State */}
                           <button onClick={startRecording} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3.5 rounded-full transition-colors flex-shrink-0 group">
                               <Mic className="text-lg group-hover:text-red-500 transition-colors" />
                           </button>
                           
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
                               className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base text-navy outline-none focus:border-navy transition-colors resize-none max-h-32"
                           />
                           
                           <button 
                               onClick={() => sendMessage()}
                               className="bg-gold hover:bg-gold-light text-navy p-3.5 rounded-full transition-transform hover:scale-105 shadow-md flex-shrink-0"
                           >
                               <Send className="text-lg" />
                           </button>
                       </div>
                   )}
               </div>
             </>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <ChatDots className="text-5xl text-gray-200" />
                 </div>
                 <p className="font-medium text-gray-400">{t.chat.select}</p>
             </div>
         )}
      </div>

      {/* --- OUTGOING CALL MODAL --- */}
      <CallModal isOpen={showCallModal} onClose={() => setShowCallModal(false)} contact={activeContact} type={callType} />

    </div>
  );
}