"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function useGoogleTranslate() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const translate = async (text: string): Promise<string> => {
    // If the app language matches the text language (assumed), don't translate
    // (This logic can be smarter, but for now, we rely on user trigger)
    
    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: language })
      });
      const data = await res.json();
      return data.translatedText || text;
    } catch (error) {
      console.error(error);
      return text; // Return original on fail
    } finally {
      setLoading(false);
    }
  };

  return { translate, loading };
}