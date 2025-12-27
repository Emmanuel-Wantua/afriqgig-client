"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom"; // ✅ Fix: Portal for Top-Level UI
import { ArrowsAngleContract, ArrowsAngleExpand, TelephoneX } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: any; 
    type: 'audio' | 'video';
    isIncoming?: boolean;
}

export default function CallModal({ isOpen, onClose, contact, type, isIncoming = false }: CallModalProps) {
    const { user } = useLanguage();
    
    // Refs
    const zpRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dialingAudio = useRef<HTMLAudioElement | null>(null);
    
    // State
    const [isMinimized, setIsMinimized] = useState(false);
    const [callStatus, setCallStatus] = useState(isIncoming ? "Connected" : "Dialing...");
    const [callDuration, setCallDuration] = useState(0);
    const [mounted, setMounted] = useState(false);

    // Flags
    const isDestroying = useRef(false);
    const hasConnected = useRef(false);

    // Ensure hydration
    useEffect(() => setMounted(true), []);

    // --- HELPER: Send Signal ---
    const sendSignal = (signal: string) => {
        if (!user || !contact || contact._id === "unknown") return;
        fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sender: user._id,
                receiver: contact._id,
                content: signal,
                type: "text"
            }),
            keepalive: true
        }).catch(e => console.error("Signal Failed:", e));
    };

    const stopSound = () => {
        if (dialingAudio.current) {
            dialingAudio.current.pause();
            dialingAudio.current.currentTime = 0;
        }
    };

    // --- TIMER ---
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (callStatus === "Connected") {
            timer = setInterval(() => setCallDuration(p => p + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [callStatus]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- 1. IMMEDIATE ACTIONS ---
    useEffect(() => {
        if (!isOpen) return;

        if (isIncoming) {
            console.log("✅ [CallModal] Sending Accept Signal...");
            sendSignal("[CALL_ACCEPTED]");
            hasConnected.current = true;
        } else {
            if (!dialingAudio.current) {
                dialingAudio.current = new Audio("/assets/audio/dialing.mp3");
                dialingAudio.current.loop = true;
            }
            dialingAudio.current.play().catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // --- 2. ROBUST POLLING (Backup) ---
    useEffect(() => {
        if (!isOpen || !user || !contact || callStatus === "Connected") return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/messages/latest?userId=${user._id}&otherId=${contact._id}`);
                const lastMsg = await res.json();

                if (!lastMsg) return;

                if (lastMsg.content === "[CALL_ACCEPTED]" && lastMsg.sender === contact._id) {
                    setCallStatus("Connected");
                    stopSound();
                    hasConnected.current = true;
                }

                if (["[CALL_ENDED]", "[CALL_DECLINED]"].includes(lastMsg.content)) {
                    stopSound();
                    onClose();
                }
            } catch (e) { /* ignore */ }
        };

        const interval = setInterval(checkStatus, 1000); 
        return () => clearInterval(interval);
    }, [isOpen, user, contact, callStatus, onClose]);

    // --- 3. ZEGO INITIALIZATION ---
    useEffect(() => {
        if (!isOpen || !user || !contact) return;

        let active = true;
        const uId = String(user._id).replace(/[^a-zA-Z0-9]/g, ""); 
        const cId = String(contact._id).replace(/[^a-zA-Z0-9]/g, "");
        const roomId = `call_${[uId, cId].sort().join('_')}`;
        const userName = String(user.name || "User").replace(/[^a-zA-Z0-9 ]/g, "");

        const initCall = async () => {
            if (isDestroying.current || zpRef.current) return;

            const appID = 1198020067; 
            const serverSecret = "44328a1706af40f22796d6382e600df4"; 

            try {
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appID, serverSecret, roomId, uId, userName
                );

                if (!active || !containerRef.current) return;

                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zpRef.current = zp;

                zp.joinRoom({
                    container: containerRef.current,
                    scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
                    turnOnCameraWhenJoining: type === 'video',
                    turnOnMicrophoneWhenJoining: true,
                    showScreenSharingButton: false,
                    showPreJoinView: false, 
                    showTextChat: false,
                    showUserList: false,
                    showLeaveRoomConfirmDialog: false,

                    onUserJoin: () => {
                        setCallStatus("Connected");
                        stopSound();
                        sendSignal("[CALL_ACCEPTED]");
                    },

                    onLeaveRoom: () => {
                        stopSound();
                        sendSignal("[CALL_ENDED]");
                        onClose(); 
                    },
                });
            } catch (error) {
                console.error("Zego Init Error:", error);
            }
        };

        const t = setTimeout(initCall, 100);

        return () => {
            active = false;
            clearTimeout(t);
            stopSound();
            
            // ✅ CRITICAL FIX: Always destroy to release Camera/Mic
            if (zpRef.current) {
                const instance = zpRef.current;
                zpRef.current = null; // Detach immediately

                try {
                    // We attempt to destroy the instance to stop media tracks.
                    // This might throw 'createSpan' error because the DOM is gone,
                    // but we MUST run it to kill the camera light.
                    if (typeof instance.destroy === 'function') {
                        instance.destroy();
                    }
                } catch (error) {
                    // We expect a "Cannot read properties of null" error here 
                    // because the modal is already closed. We safely ignore it 
                    // knowing the hardware request was likely attempted.
                    console.warn("Zego shutdown warning (Hardware released):", error);
                }
                
                isDestroying.current = false;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); 

    if (!isOpen || !mounted) return null;

    // ✅ PORTAL: Force UI to be top-level (Covers Header/Footer)
    return createPortal(
        <div 
            className={`fixed z-[99999] transition-all duration-300 ease-in-out bg-gray-900 overflow-hidden shadow-2xl ${
                isMinimized 
                    ? "bottom-4 right-4 w-40 h-64 rounded-2xl border-2 border-white/20" 
                    : "inset-0 w-screen h-screen" 
            }`}
        >
            {/* Status Overlay (Hidden when Minimized) */}
            {!isMinimized && (
                <div className="absolute top-20 left-0 right-0 text-center z-[100] pointer-events-none">
                    <div className="inline-block bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-1">{contact.name}</h3>
                        {callStatus === "Dialing..." ? (
                            <p className="text-white/70 text-xs animate-pulse">Dialing...</p>
                        ) : (
                            <p className="text-green-400 text-sm font-mono font-bold tracking-widest">
                                {formatTime(callDuration)}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ZEGO CONTAINER */}
            {/* ✅ UI FIX: Force Video to Fill Container (No Black Bars) */}
            <div 
                ref={containerRef} 
                className="w-full h-full absolute inset-0 
                [&_.zego_model_parent]:!z-10 
                [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full
                [&_.ZegoVideoContainer]:!w-full [&_.ZegoVideoContainer]:!h-full"
            />

            {/* Controls */}
            <div className={`absolute z-[200] flex gap-2 ${isMinimized ? 'top-2 right-2' : 'bottom-10 left-1/2 -translate-x-1/2'}`}>
                {/* Minimize Button */}
                <button 
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-colors"
                >
                    {isMinimized ? <ArrowsAngleExpand className="text-xl"/> : <ArrowsAngleContract className="text-xl"/>}
                </button>
                
                {/* End Call Button (Only if Minimized) */}
                {isMinimized && (
                    <button 
                        onClick={() => {
                            sendSignal("[CALL_ENDED]");
                            onClose();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-md transition-colors"
                    >
                        <TelephoneX className="text-xl"/>
                    </button>
                )}
            </div>
        </div>,
        document.body // Target the body directly
    );
}