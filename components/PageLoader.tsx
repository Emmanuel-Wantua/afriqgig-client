"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        {/* Pulsing Logo Container */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10"
        >
          <Image 
            src="/icon.svg" 
            alt="AfriqGig Loading" 
            width={80} 
            height={80} 
            priority 
            className="w-20 h-20 object-contain drop-shadow-xl"
          />
        </motion.div>
        
        {/* Spinning Ring (Gold) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute w-32 h-32 border-4 border-gray-100 border-t-gold rounded-full"
        />

        <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-xs font-bold text-navy tracking-[0.2em] uppercase animate-pulse"
        >
            Loading...
        </motion.p>
      </div>
    </div>
  );
}