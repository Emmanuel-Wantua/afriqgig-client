"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, PersonCircle, Send, StarFill, CheckCircleFill } from "react-bootstrap-icons";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

export default function AdminSupportContent() {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(true);

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
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                    <PersonCircle className="text-xl"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-navy">{selectedChat.guestName}</h3>
                                    <p className="text-xs text-gray-500">{selectedChat.guestEmail}</p>
                                </div>
                            </div>
                            {selectedChat.status === 'closed' && (
                                <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <CheckCircleFill /> Resolved
                                </span>
                            )}
                        </div>

                        {/* NEW: Review Section (Shows if rated) */}
                        {selectedChat.rating > 0 && (
                            <div className="bg-gold/10 p-4 border-b border-gold/20 flex items-start gap-3">
                                <div className="bg-white p-2 rounded-full text-gold shadow-sm"><StarFill /></div>
                                <div>
                                    <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1">User Feedback</p>
                                    <div className="flex items-center gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <StarFill key={i} className={`text-xs ${i < selectedChat.rating ? 'text-gold' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    {selectedChat.feedback && <p className="text-sm text-navy italic">"{selectedChat.feedback}"</p>}
                                </div>
                            </div>
                        )}
                        
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {selectedChat.messages.map((msg: any, i: number) => (
                                <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'agent' ? 'bg-navy text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Input */}
                        <form onSubmit={sendReply} className="p-4 border-t border-gray-100 flex gap-3 bg-white">
                            <input 
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy transition-colors" 
                                placeholder="Type a reply..."
                            />
                            <button className="bg-navy text-white px-6 rounded-xl font-bold hover:bg-navy-light transition-colors shadow-lg">
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
            </div>
        </div>
    );
}