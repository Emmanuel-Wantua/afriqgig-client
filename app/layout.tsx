import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// IMPORT CONTEXTS
import { LanguageProvider } from "@/context/LanguageContext";
import Provider from "@/components/SessionProvider"; 
import LiveChatWidget from "@/components/LiveChatWidget";
import ReferralTracker from "@/components/ReferralTracker";
import { ToastProvider } from "@/context/ToastContext";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import Script from "next/script"; // ✅ NEW IMPORT

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
  display: "swap",
});

// --- BEAUTIFUL SOCIAL PREVIEWS & SEO ---
export const metadata: Metadata = {
  title: "AfriqGig | The #1 Freelance Marketplace Simplified for African Talent",
  description: "Connect with verified freelance talent across Africa. Secure escrow payments (MOMO/Card), local expertise, and quality work guaranteed. Join AfriqGig today.",
  
  // ✅ FIX 1: Favicon Configuration
  icons: {
    icon: "/assets/images/logo-symbol.png",
    shortcut: "/assets/images/logo-symbol.png",
    apple: "/assets/images/logo-symbol.png",
  },

  // ✅ FIX 2: Google Ownership Verification
  verification: {
    google: "lzwSVF39OJ7PjaO9gF0ymwr0BlDy7kwUL97sNc9gQFM", 
  },

  openGraph: {
      title: "Hire Top African Freelancers Securely | AfriqGig",
      description: "Get 50% off your first job. The safest way to hire vetted freelancers in Cameroon, Nigeria, Kenya, and beyond. Secure Escrow & MOMO payments.",
      url: "https://afriqgig.com",
      siteName: "AfriqGig",
      images: [
          {
              url: "https://afriqgig.com/assets/images/social-preview.png",
              width: 1200,
              height: 630,
              alt: "AfriqGig - Freelance Simplified for Africa"
          }
      ],
      locale: 'en_US',
      type: "website",
  },
  twitter: {
      card: "summary_large_image",
      title: "AfriqGig | Hire African Talent",
      description: "Get 50% off your first job commission. Secure payments & verified pros.",
      images: ["https://afriqgig.com/assets/images/social-preview.webp"],
      creator: "@afriqgig" // Add your handle if you have one
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ SEO: Structured Data (Organization Schema)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AfriqGig",
    "url": "https://afriqgig.com",
    "logo": "https://afriqgig.com/assets/images/logo-symbol.png",
    "sameAs": [
      "https://facebook.com/afriqgig",
      "https://twitter.com/afriqgig",
      "https://linkedin.com/company/afriqgig"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+237-677-079-449",
      "contactType": "customer service",
      "areaServed": ["CM", "NG", "KE", "GH", "ZA", "RW"],
      "availableLanguage": ["English", "French", "Spanish", "Arabic", "Swahili"]
    }
  };

  return (
    <html lang="en">
      <head>
        {/* ✅ Inject JSON-LD Structure for Google Rich Results */}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${inter.className} font-sans bg-light dark:bg-navy-dark text-navy dark:text-white transition-colors duration-300`}>
        <Provider>
          <AnalyticsTracker />
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