"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { translations, Language } from "@/utils/translations"; 
import { MotionConfig } from "framer-motion"; 

// 1. Settings Type Definition
type Settings = {
  reduceAnimations: boolean;
  autoplayVideo: boolean;
  showOnlineStatus: boolean;
  soundEffects: boolean;
  theme: string; 
};

// 2. Context Type Definition
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  t: typeof translations["en"];
  dir: "ltr" | "rtl";
  user: any; 
  settings: Settings; 
  convertPrice: (amount: number, fromCurrency?: string) => string; 
  refreshUser: () => Promise<void>; 
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState("XAF"); 
  const [user, setUser] = useState<any>(null);
  
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ 
      XAF: 1, NGN: 2.6, KES: 0.21, GHS: 0.025, USD: 0.0016, EUR: 0.0015 
  });

  // 3. Default Settings (Strictly Light Mode)
  const defaultSettings: Settings = {
      reduceAnimations: false,
      autoplayVideo: true,
      showOnlineStatus: true,
      soundEffects: true,
      theme: "light", // <--- Force Light Default
  };

  // Derive settings safely
  const settings = user?.settings ? { ...defaultSettings, ...user.settings } : defaultSettings;

  // 4. Fetch Real Rates
  useEffect(() => {
    const fetchRates = async () => {
        try {
            const res = await fetch("/api/rates"); 
            const rates = await res.json();
            if (rates && rates.XAF) setExchangeRates(rates);
        } catch (e) {
            console.error("Rates fetch failed");
        }
    };
    fetchRates();
  }, []);

  // 5. Refresh User Logic
  const refreshUser = async () => {
      const storedUser = localStorage.getItem("afriqUser");
      if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          
          if (parsed.settings?.language) setLanguage(parsed.settings.language);
          if (parsed.settings?.currency) setCurrency(parsed.settings.currency); 
      }
  };

  useEffect(() => { refreshUser(); }, []);

  // 6. Handle Reduced Motion
  useEffect(() => {
      if (settings.reduceAnimations) document.documentElement.classList.add("reduce-motion");
      else document.documentElement.classList.remove("reduce-motion");
  }, [settings.reduceAnimations]);

  // 7. ROBUST THEME LOGIC (The Fix)
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = settings.theme || "light"; // Fallback is ALWAYS light

    const applyTheme = () => {
        const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        // Only allow dark mode if specifically "dark" or ("system" AND system is dark)
        const shouldBeDark = currentTheme === "dark" || (currentTheme === "system" && isSystemDark);

        if (shouldBeDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    // Apply immediately
    applyTheme();

    // Listen for system changes ONLY if setting is 'system'
    if (currentTheme === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", applyTheme);
        return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [settings.theme]); // Re-run whenever setting changes

  // 8. Dynamic Values
  const dir: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";
  const t = (translations[language] || translations["en"]) as typeof translations["en"];

  const convertPrice = (amount: number) => {
    if (!amount) return `0 ${currency}`;
    const rate = exchangeRates[currency] || 1; 
    const converted = amount * rate; 
    return `${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
  };

  const value = useMemo(() => ({
    language, setLanguage, currency, setCurrency, t, dir, user, settings, convertPrice, refreshUser
  }), [language, currency, user, exchangeRates, settings, t]);

  return (
    <LanguageContext.Provider value={value}>
      <MotionConfig reducedMotion={settings.reduceAnimations ? "always" : "user"}>
          <div dir={dir} className={language === "ar" ? "font-arabic" : "font-sans"}>
            {children}
          </div>
      </MotionConfig>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error("useLanguage error");
  return context;
}