"use client";

import ReferralPromo from "./ReferralPromo";

export default function PageLoader() {
  return (
    // 1. Main Container: Fixed full screen, flex column
    // The loader renders immediately with zero JS wait time
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
      
      {/* 2. Visual Centerpiece: Stack Logo & Spinner */}
      <div className="relative flex items-center justify-center w-32 h-32">
        
        {/* Layer A: The Spinning Ring (Outer) - Starts spinning instantly via CSS */}
        <div className="absolute inset-0 w-full h-full border-4 border-gray-100 border-t-gold rounded-full animate-spin"></div>
        
        {/* Layer B: The Logo (Inner & Pulsing) */}
        {/* Applied animation to the parent DIV so it starts before the image even decodes */}
        <div className="relative z-10 w-16 h-16 animate-pulse-slow flex items-center justify-center">
          {/* ✅ SPEED FIX: Used standard <img> tag for instant rendering without hydration delay */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/icon.svg" 
            alt="Loading" 
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* 3. Text: Pushed down with margin to avoid touching the spinner */}
      <p className="mt-8 text-[10px] font-extrabold text-[#0A1929] tracking-[0.3em] uppercase animate-pulse">
          Loading...
      </p>

      {/* Custom Pulse Animation */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
