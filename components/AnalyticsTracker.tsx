"use client";
import { useEffect, useRef } from "react";

export default function AnalyticsTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent double counting in Strict Mode or re-renders
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Fire and forget
    fetch("/api/analytics/track", { method: "POST" }).catch(() => {});
  }, []);

  return null; // Invisible component
}