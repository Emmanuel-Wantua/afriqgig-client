"use client";
import { useState } from "react";
import { X, ChatQuote, Send } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext"; // Import Context

export default function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, user } = useLanguage(); // Get User AND Translation 't'
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setIsSending(true);
    
    try {
        await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                content: feedback,
                userId: user?._id // Send User ID if logged in
            })
        });

        setSent(true);
        setTimeout(() => {
            setSent(false);
            setFeedback("");
            onClose();
        }, 2000);
    } catch (error) {
        console.error("Failed to send feedback");
    } finally {
        setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X className="text-2xl" /></button>
        
        {!sent ? (
          <>
            <div className="flex items-center gap-3 mb-4 text-navy">
              <div className="p-3 bg-blue-50 rounded-full"><ChatQuote className="text-xl" /></div>
              <h3 className="font-bold text-lg">{t.feedback.title}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">{t.feedback.subtitle}</p>
            <textarea 
              value={feedback} 
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t.feedback.placeholder}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-32 outline-none focus:border-navy mb-4 resize-none text-navy"
            />
            <button 
              onClick={handleSubmit} 
              disabled={isSending}
              className="w-full py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSending ? t.contact.sending : <><Send /> {t.feedback.send}</>}
            </button>
          </>
        ) : (
          <div className="py-10 text-center text-green-600">
            <h3 className="font-bold text-xl mb-2">{t.feedback.thankYou}</h3>
            <p>{t.feedback.successMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}