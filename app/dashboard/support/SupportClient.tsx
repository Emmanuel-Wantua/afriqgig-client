"use client";

import Link from "next/link";
import { ArrowLeft, QuestionCircle, ChatQuote, LifePreserver } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";

export default function SupportContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-navy">
      <div className="bg-navy pt-16 pb-32 px-6 text-center relative">
          <div className="max-w-2xl mx-auto relative z-10">
              <h1 className="text-3xl font-extrabold text-white mb-4">{t.support.title}</h1>
              <p className="text-blue-100">{t.support.subtitle}</p>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-20 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
              <Link href="/faq" className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-1 transition-transform group">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors"><QuestionCircle/></div>
                  <h3 className="font-bold text-lg mb-2">{t.support.faqTitle}</h3>
                  <p className="text-sm text-gray-500">{t.support.faqDesc}</p>
              </Link>

              <Link href="/contact" className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-1 transition-transform group">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors"><LifePreserver/></div>
                  <h3 className="font-bold text-lg mb-2">{t.support.contactTitle}</h3>
                  <p className="text-sm text-gray-500">{t.support.contactDesc}</p>
              </Link>

              <Link href="/dashboard/community" className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-1 transition-transform group">
                  <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-gold group-hover:text-white transition-colors"><ChatQuote/></div>
                  <h3 className="font-bold text-lg mb-2">{t.support.communityTitle}</h3>
                  <p className="text-sm text-gray-500">{t.support.communityDesc}</p>
              </Link>
          </div>

          <div className="mt-12 bg-white rounded-3xl p-8 md:p-12 border border-gray-100 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t.support.stillNeedHelp}</h2>
                  <p className="text-gray-600 mb-6">{t.support.helpText}</p>
                  <div className="flex flex-wrap gap-4 text-sm font-bold text-navy">
                      <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> {t.support.liveChat}</span>
                      <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> {t.support.emailSupport}</span>
                  </div>
              </div>
              <Link href="/contact" className="px-8 py-4 bg-navy text-white rounded-xl font-bold shadow-lg hover:bg-navy-light transition-colors whitespace-nowrap">
                  {t.support.openTicket}
              </Link>
          </div>
      </div>
    </div>
  );
}