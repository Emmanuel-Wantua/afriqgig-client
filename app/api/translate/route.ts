import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    if (!text) return NextResponse.json({ text: "" });

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    // 1. If no API key, return a Mock Translation (Safe Fallback)
    if (!apiKey) {
      console.warn("Missing GOOGLE_TRANSLATE_API_KEY. Using Mock.");
      return NextResponse.json({ 
        translatedText: `[${targetLang.toUpperCase()}] ${text}` 
      });
    }

    // 2. Real Google Translate API Call (Basic v2)
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: "text"
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({ 
      translatedText: data.data.translations[0].translatedText 
    });

  } catch (error) {
    console.error("Translation Error:", error);
    return NextResponse.json({ text: "Error translating" }, { status: 500 });
  }
}