"use client";

import { useState, useRef } from "react";
import { PlayFill, PauseFill, MicFill } from "react-bootstrap-icons";

export default function VoiceMessagePlayer({ src, isMe = false }: { src: string, isMe?: boolean }) {
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
        <div className={`flex items-center gap-3 p-2 pr-4 rounded-xl min-w-[240px] select-none transition-colors border ${
            isMe ? 'bg-white/10 border-white/20' : 'bg-gray-100 border-gray-200'
        }`}>
            <button 
                onClick={togglePlay}
                type="button"
                className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-sm transition-transform active:scale-95 ${
                    isMe ? 'bg-white text-navy' : 'bg-navy text-white'
                }`}
            >
                {isPlaying ? <PauseFill className="text-lg" /> : <PlayFill className="text-xl ml-0.5" />}
            </button>
            
            <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-[120px]">
                <div className="relative w-full h-1.5 bg-gray-300 rounded-full overflow-visible">
                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear ${isMe ? 'bg-gold' : 'bg-navy'}`} style={{ width: `${progress}%` }}>
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
}