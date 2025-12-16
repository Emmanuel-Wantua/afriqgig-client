"use client";

import { useEffect, useRef } from "react";
import { X } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: any; 
    type: 'audio' | 'video';
}

export default function CallModal({ isOpen, onClose, contact, type }: CallModalProps) {
    const { user } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const zpRef = useRef<any>(null);

    const getRoomId = () => {
        if (!user || !contact) return null;
        const ids = [user._id, contact._id].sort();
        return `call_${ids[0]}_${ids[1]}`;
    };

    useEffect(() => {
        let active = true;

        const startCall = async () => {
            if (!isOpen || !user || !contact || !containerRef.current) return;
            
            // Cleanup old instance if exists
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }

            const roomId = getRoomId();
            if (!roomId) return;

            const appID = 1198020067; 
            const serverSecret = "44328a1706af40f22796d6382e600df4"; 

            try {
                // Generate Kit Token
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    Number(appID), // Ensure it's a number
                    serverSecret, 
                    roomId, 
                    user._id, 
                    user.name || "User"
                );

                // Create Instance
                const zp = ZegoUIKitPrebuilt.create(kitToken);
                
                if (!active) return;
                zpRef.current = zp;

                // Join Room
                zp.joinRoom({
                    container: containerRef.current,
                    scenario: {
                        mode: ZegoUIKitPrebuilt.OneONoneCall, 
                    },
                    turnOnCameraWhenJoining: type === 'video',
                    turnOnMicrophoneWhenJoining: true,
                    showScreenSharingButton: false,
                    showPreJoinView: false, 
                    
                    // Allow user to leave properly
                    onLeaveRoom: () => {
                        onClose(); 
                    },
                });
            } catch (error) {
                console.error("Zego Init Error:", error);
            }
        };

        // Small delay to ensure modal DOM is painted
        const timer = setTimeout(() => {
            startCall();
        }, 500);

        return () => {
            active = false;
            clearTimeout(timer);
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
        };
    }, [isOpen, user, contact, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-navy/90 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-4xl h-[80vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                
                {/* Close Button */}
                <button 
                    onClick={() => {
                        if (zpRef.current) {
                            zpRef.current.destroy();
                            zpRef.current = null;
                        }
                        onClose();
                    }} 
                    className="absolute top-4 right-4 z-[301] bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                >
                    <X className="text-2xl" />
                </button>

                {/* ZEGO CONTAINER */}
                <div 
                    ref={containerRef} 
                    className="w-full h-full [&_.zego_model_parent]:!z-10" 
                />
            </div>
        </div>
    );
}