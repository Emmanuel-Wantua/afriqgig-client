"use client";

import dynamic from 'next/dynamic';

// Dynamically import the actual widget with SSR disabled
const LiveChatWidget = dynamic(
  () => import('@/components/LiveChatWidget'),
  { ssr: false }
);

export default function LiveChatWrapper() {
  return <LiveChatWidget />;
}