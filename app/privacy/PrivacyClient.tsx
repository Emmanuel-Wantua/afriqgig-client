"use client";

import Link from "next/link";
import { ArrowLeft, ShieldLock } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext"; // Import Context
import Header from "@/components/Header"; // Reusable Header
import Footer from "@/components/Footer"; // Reusable Footer

export default function PrivacyContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-navy flex flex-col">
      
      {/* Reusable Header */}
      <Header />

      {/* Main Content (Added padding-top for fixed header) */}
      <main className="flex-1 pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center mb-6">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy transition-colors">
              <ArrowLeft /> {t.about.backHome}
            </Link>
          </div>

          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-8">
                <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center text-2xl">
                  <ShieldLock />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-navy">{t.privacy.title}</h1>
                  <p className="text-gray-500 text-sm">{t.privacy.lastUpdated}</p>
                </div>
              </div>

              <div className="space-y-8 text-gray-600 leading-relaxed">
                <section>
                  <h3 className="text-xl font-bold text-navy mb-3">{t.privacy.section1Title}</h3>
                  <p>
                    {t.privacy.section1Text}
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-navy mb-3">{t.privacy.section2Title}</h3>
                  <p>{t.privacy.section2Intro}</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>{t.privacy.section2Li1}</li>
                    <li>{t.privacy.section2Li2}</li>
                    <li>{t.privacy.section2Li3}</li>
                    <li>{t.privacy.section2Li4}</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-navy mb-3">{t.privacy.section3Title}</h3>
                  <p>
                    {t.privacy.section3Text}
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-navy mb-3">{t.privacy.section4Title}</h3>
                  <p>
                    {t.privacy.section4Text}
                  </p>
                </section>
              </div>
            </div>
          </div>
      </main>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}