"use client";
import { useEffect, useRef } from "react";

export default function AnalyticsTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // 1. Check if "Unique Visitor" today
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem("afriq_last_visit");
    const isUnique = lastVisit !== today;

    // 2. Send Data
    fetch("/api/analytics/track", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUnique })
    }).catch(() => {});

    // 3. Mark as visited
    if (isUnique) localStorage.setItem("afriq_last_visit", today);

  }, []);

  return null;
}