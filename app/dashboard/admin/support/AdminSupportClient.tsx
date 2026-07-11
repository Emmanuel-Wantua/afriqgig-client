"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, PersonCircle, Send, StarFill, CheckCircleFill,
    Image as ImageIcon, GeoAlt, ZoomIn, Download, X, Envelope, Telephone, ChevronDown
} from "react-bootstrap-icons";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/utils/upload";

export default function AdminSupportContent() {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showUserDetails, setShowUserDetails] = useState(false);

    // Poll for active chats
    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchChats = async () => {
        try {
            const res = await fetch("/api/admin/chats");
            const data = await res.json();
            if (Array.isArray(data)) {
                setChats(data);
                if (selectedChat) {
                    const updated = data.find(c => c._id === selectedChat._id);
                    if (updated) setSelectedChat(updated);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim() || !selectedChat) return;

        await fetch("/api/admin/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chatId: selectedChat._id, 
                content: reply 
            })
        });
        setReply("");
        fetchChats();
    };

    const handleAdminImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedChat) {
             const file = e.target.files[0];
             
             // Optimistic Update: Show image immediately in chat
             const tempId = Date.now();
             const tempMsg = { 
                 sender: 'agent', 
                 content: '📷 Sending image...', 
                 imageUrl: URL.createObjectURL(file), // Local preview
                 timestamp: new Date() 
             };
             
             // Add to local state immediately
             const updatedChat = { 
                 ...selectedChat, 
                 messages: [...selectedChat.messages, tempMsg] 
             };
             setSelectedChat(updatedChat);
             
             try {
                 const url = await uploadToCloudinary(file);
                 if (url) {
                     // Send to API
                     await fetch("/api/admin/chats", {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ 
                             chatId: selectedChat._id, 
                             content: "Image Sent", // Fallback text
                             type: "image",         // ✅ Signal it's an image
                             imageUrl: url          // ✅ The actual link
                         })
                     });
                     
                     // Refresh chat to get the real message from DB
                     fetchChats();
                 }
             } catch (error) {
                 console.error("Admin upload failed", error);
                 alert("Failed to send image.");
                 // Revert optimistic update if needed (optional)
             }
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="h-[calc(100vh-100px)] grid grid-cols-3 gap-6">
            {/* List */}
            <div className="col-span-1 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-navy">All Chats</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => (
                        <button 
                            key={chat._id} 
                            onClick={() => setSelectedChat(chat)}
                            className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-sm text-navy">{chat.guestName}</span>
                                <span className="text-[10px] text-gray-400">{new Date(chat.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">{chat.messages[chat.messages.length - 1]?.content || "No messages"}</p>
                            
                            {/* Status Badges */}
                            <div className="flex gap-2">
                                {chat.status === 'closed' && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">Closed</span>}
                                {chat.rating > 0 && <span className="text-[9px] bg-gold/10 text-navy px-1.5 py-0.5 rounded border border-gold/20 flex items-center gap-1"><StarFill className="text-[8px] text-gold"/> {chat.rating}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm relative h-full">
                {selectedChat ? (
                    <>
                        {/* Chat Header & User Info */}
                        <div className="border-b border-gray-100 bg-white z-20 shadow-sm relative transition-all duration-300">
                            {/* Decorative Top Line */}
                            <div className="h-1 w-full bg-gradient-to-r from-navy via-blue-600 to-gold"></div>

                            <div className="px-5 py-3">
                                <div className="flex justify-between items-center">
                                    
                                    {/* Left: Avatar & Name */}
                                    <div className="flex items-center gap-3">
                                        {/* Smart Avatar */}
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden shadow-sm flex items-center justify-center bg-gray-50 text-navy font-bold text-lg">
                                                {selectedChat.guestAvatar ? (
                                                    <img src={selectedChat.guestAvatar} alt={selectedChat.guestName} className="w-full h-full object-cover" />
                                                ) : (
                                                    selectedChat.guestName[0].toUpperCase()
                                                )}
                                            </div>
                                            {/* Online Dot (Optional, if real-time) */}
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-bold text-navy text-sm">{selectedChat.guestName}</h3>
                                                
                                                {/* Verified Badge */}
                                                {selectedChat.isVerified && (
                                                    <CheckCircleFill className="text-blue-500 text-[10px]" title="Verified User"/>
                                                )}

                                                {/* Rating Badge */}
                                                {(selectedChat.userRating || 0) > 0 && (
                                                    <div className="flex items-center gap-0.5 bg-gold/10 px-1 py-0.5 rounded text-[8px] font-bold text-navy border border-gold/20">
                                                        <StarFill className="text-gold text-[8px]" />
                                                        <span>{selectedChat.userRating?.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                {selectedChat.status === 'closed' ? (
                                                    <span className="text-gray-400 font-medium">Resolved</span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">Active Now</span>
                                                )}
                                                • Guest User
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Actions & Toggle */}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setShowUserDetails(!showUserDetails)}
                                            className={`p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 ${showUserDetails ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            {showUserDetails ? 'Hide Info' : 'Show Info'}
                                            <ChevronDown className={`transition-transform duration-200 ${showUserDetails ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Collapsible User Details Panel */}
                                <AnimatePresence>
                                    {showUserDetails && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: "auto", opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-3 mt-3 border-t border-dashed border-gray-200 grid grid-cols-2 gap-3 text-xs">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><Envelope/></div>
                                                    <span className="truncate">{selectedChat.guestEmail}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><Telephone/></div>
                                                    <span className="truncate">{selectedChat.guestPhone || "No Phone"}</span>
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2 text-gray-600">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><GeoAlt/></div>
                                                    <span className="truncate">
                                                        {selectedChat.guestAddress ? `${selectedChat.guestAddress}, ` : ""}
                                                        {selectedChat.guestLocation || "No Location"}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* NEW: Review Section (Shows only if rated) */}
                        {selectedChat.rating > 0 && (
                            <div className="bg-gold/10 p-3 border-b border-gold/20 flex items-start gap-3 shrink-0">
                                <div className="bg-white p-1.5 rounded-full text-gold shadow-sm"><StarFill className="text-xs" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-navy uppercase tracking-wider mb-0.5">User Feedback</p>
                                    <div className="flex items-center gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <StarFill key={i} className={`text-xs ${i < selectedChat.rating ? 'text-gold' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    {selectedChat.feedback && <p className="text-xs text-navy italic">"{selectedChat.feedback}"</p>}
                                </div>
                            </div>
                        )}
                        
                        {/* Messages Area (Flex-1 fills remaining space, no gaps) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/50">
                            {selectedChat.messages.map((msg: any, i: number) => (
                                <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'agent' ? 'bg-navy text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                        
                                        {/* ✅ Display Images with Lightbox Trigger */}
                                        {msg.imageUrl && (
                                            <button 
                                                onClick={() => setPreviewImage(msg.imageUrl)}
                                                className="block overflow-hidden rounded-lg border border-white/20 group relative mb-2 w-full text-left"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={msg.imageUrl} alt="Attachment" className="max-w-full max-h-[200px] object-cover" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <ZoomIn className="text-xl" />
                                                </div>
                                            </button>
                                        )}
                                        
                                        {msg.content}
                                        <p className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Input */}
                        <form onSubmit={sendReply} className="p-4 border-t border-gray-100 flex gap-3 bg-white items-end shrink-0 z-20">
                            <label className="p-3 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-xl cursor-pointer transition-colors mb-0.5" title="Send Image">
                                <ImageIcon className="text-lg" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAdminImageUpload} />
                            </label>
                            
                            <input 
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy transition-colors" 
                                placeholder="Type a reply..."
                            />
                            <button className="bg-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-light transition-colors shadow-lg">
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <PersonCircle className="text-6xl mb-4 opacity-20" />
                        <p>Select a conversation to view details</p>
                    </div>
                )}
                
                {/* ✅ LIGHTBOX MODAL (Inside the Admin Page) */}
                <AnimatePresence>
                    {previewImage && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                            onClick={() => setPreviewImage(null)}
                        >
                            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-2 rounded-full transition-colors z-50">
                                <X className="text-3xl" />
                            </button>
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="relative max-w-full max-h-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewImage} alt="Preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-md shadow-2xl" />
                                <a href={previewImage} download target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-white/90 text-navy p-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white shadow-lg">
                                    <Download /> Download
                                </a>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}