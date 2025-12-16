"use client";

import { useState } from "react";
import { Globe } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer";

export default function ProposalContent({ text }: { text: string }) {
    const { t, language } = useLanguage();
    const { translate, loading } = useGoogleTranslate();
    const [translatedText, setTranslatedText] = useState("");
    const [showTranslated, setShowTranslated] = useState(false);

    // 1. Separate Voice Note URL from Message Text
    // Logic: We look for the tag we added during submission
    const voiceTag = "[VOICE_PROPOSAL]:";
    const parts = text.split(voiceTag);
    const originalMessage = parts[0].trim();
    const voiceUrl = parts.length > 1 ? parts[1].trim() : null;

    // 2. Handle Translation
    const handleTranslate = async () => {
        if (showTranslated) {
            setShowTranslated(false);
            return;
        }
        // Only fetch from API if we haven't already
        if (!translatedText) {
            const res = await translate(originalMessage);
            setTranslatedText(res);
        }
        setShowTranslated(true);
    };

    return (
        <div className="space-y-3">
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700 text-sm">
                {showTranslated ? translatedText : (originalMessage || t.manage.noCover)}
            </p>

            {/* Voice Player */}
            {voiceUrl && (
                <div className="mt-2 p-3 bg-white/80 rounded-xl border border-blue-100 shadow-sm w-fit">
                    <p className="text-[10px] font-bold text-navy uppercase mb-2 flex items-center gap-1">
                        {t.manage.voicePitch}
                    </p>
                    <VoiceMessagePlayer src={voiceUrl} isMe={false} />
                </div>
            )}

            {/* Translate Button (Only if not English and has text) */}
            {language !== "en" && originalMessage && (
                <button 
                    onClick={handleTranslate} 
                    disabled={loading}
                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 transition-colors mt-2"
                >
                    <Globe className="text-[10px]" />
                    {loading ? t.community.translating : showTranslated ? t.community.showOriginal : `${t.community.translate} ${language.toUpperCase()}`}
                </button>
            )}
        </div>
    );
}