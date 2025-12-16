import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// IMPORT CONTEXTS
import { LanguageProvider } from "@/context/LanguageContext";
import Provider from "@/components/SessionProvider"; 
import LiveChatWidget from "@/components/LiveChatWidget";
import ReferralTracker from "@/components/ReferralTracker";
import { ToastProvider } from "@/context/ToastContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
  display: "swap",
});

// --- BEAUTIFUL SOCIAL PREVIEWS & SEO ---
export const metadata: Metadata = {
  title: "AfriqGig | Freelance Simplified for Africa",
  description: "Connect with top freelance talent across Africa. Secure payments, verified pros.",
  
  // ✅ FIX 1: Favicon Configuration
  icons: {
    icon: "/assets/images/logo-symbol.png",
    shortcut: "/assets/images/logo-symbol.png",
    apple: "/assets/images/logo-symbol.png",
  },

  // ✅ FIX 2: Google Ownership Verification
  verification: {
    // 👇 PASTE YOUR GOOGLE CODE INSIDE THESE QUOTES 👇
    google: "lzwSVF39OJ7PjaO9gF0ymwr0BlDy7kwUL97sNc9gQFM", 
  },

  openGraph: {
      title: "Join me on AfriqGig! 🚀",
      description: "Get 50% off your first job. The safest way to hire freelancers in Africa.",
      url: "https://afriqgig.com",
      siteName: "AfriqGig",
      images: [
          {
              url: "https://afriqgig.com/assets/images/social-preview.png",
              width: 1200,
              height: 630,
              alt: "AfriqGig Referral Preview"
          }
      ],
      type: "website",
  },
  twitter: {
      card: "summary_large_image",
      title: "AfriqGig | Hire African Talent",
      description: "Get 50% off your first job commission.",
      images: ["https://afriqgig.com/assets/images/social-preview.webp"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} font-sans bg-light dark:bg-navy-dark text-navy dark:text-white transition-colors duration-300`}>
        <Provider>
              <LanguageProvider>
                  <ReferralTracker /> 
                  <LiveChatWidget />
                  <ToastProvider> 
                    {children}
                  </ToastProvider>
              </LanguageProvider>
        </Provider>
      </body>
    </html>
  );
}