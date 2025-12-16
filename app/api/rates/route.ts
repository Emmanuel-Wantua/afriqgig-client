import { NextResponse } from "next/server";

// Cache rates in memory for 1 hour to save API quota
let cachedRates: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600 * 1000; // 1 Hour

export async function GET() {
  try {
    const now = Date.now();

    // 1. Return Cache if valid
    if (cachedRates && (now - lastFetchTime < CACHE_DURATION)) {
      return NextResponse.json(cachedRates);
    }

    // 2. Fetch from Real API (Base: XAF)
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/XAF`);
    const data = await res.json();

    if (data.result !== "success") throw new Error("Failed to fetch rates");

    // 3. Update Cache
    cachedRates = data.conversion_rates;
    lastFetchTime = now;

    return NextResponse.json(cachedRates);
  } catch (error) {
    console.error("Currency API Error:", error);
    // Fallback rates if API fails
    return NextResponse.json({
      XAF: 1,
      NGN: 2.6,
      KES: 0.21,
      GHS: 0.025,
      USD: 0.0016,
      EUR: 0.0015
    });
  }
}