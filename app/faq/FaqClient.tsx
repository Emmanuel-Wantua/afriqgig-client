"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Search, QuestionCircle, Wallet2, Briefcase, ShieldCheck } from "react-bootstrap-icons";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function FaqContent() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggle = (id: string) => setOpenIndex(openIndex === id ? null : id);

  // FAQ DATA MOVED INSIDE COMPONENT TO USE TRANSLATIONS
  const FAQ_DATA = [
      {
          category: t.faq.catGeneral,
          icon: <QuestionCircle />,
          items: [
              { q: t.faq.q1, a: t.faq.a1 },
              { q: t.faq.q2, a: t.faq.a2 },
              { q: t.faq.q3, a: t.faq.a3 },
              { q: t.faq.q4, a: t.faq.a4 }
          ]
      },
      {
          category: t.faq.catFreelancers,
          icon: <Briefcase />,
          items: [
              { q: t.faq.q5, a: t.faq.a5 },
              { q: t.faq.q6, a: t.faq.a6 },
              { q: t.faq.q7, a: t.faq.a7 }, // Bring Own Client logic
              { q: t.faq.q8, a: t.faq.a8 },
              { q: t.faq.q9, a: t.faq.a9 }
          ]
      },
      {
          category: t.faq.catClients,
          icon: <ShieldCheck />,
          items: [
              { q: t.faq.q10, a: t.faq.a10 },
              { q: t.faq.q11, a: t.faq.a11 },
              { q: t.faq.q12, a: t.faq.a12 },
              { q: t.faq.q13, a: t.faq.a13 }
          ]
      },
      {
          category: t.faq.catPayments,
          icon: <Wallet2 />,
          items: [
              { q: t.faq.q14, a: t.faq.a14 },
              { q: t.faq.q15, a: t.faq.a15 },
              { q: t.faq.q16, a: t.faq.a16 },
              { q: t.faq.q17, a: t.faq.a17 }
          ]
      }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-navy flex flex-col">
      <Header />

      <main className="flex-1">
          <div className="bg-navy pt-32 pb-32 px-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10 max-w-2xl mx-auto">
                  <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 text-sm font-bold">
                      <ArrowLeft/> {t.about.backHome}
                  </Link>
                  <h1 className="text-4xl font-extrabold text-white mb-4">{t.faq.title}</h1>
                  <p className="text-blue-100 mb-8">{t.faq.subtitle}</p>
                  
                  <div className="bg-white p-2 rounded-xl flex items-center shadow-lg">
                      <Search className="text-gray-400 ml-3 text-xl" />
                      <input 
                        type="text" 
                        placeholder={t.faq.searchPlaceholder} 
                        className="w-full p-3 outline-none text-navy"
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-12 -mt-12 relative z-20">
              <div className="space-y-8">
                  {FAQ_DATA.map((category, catIdx) => {
                      // Filter items based on search
                      const filteredItems = category.items.filter(i => 
                          i.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.a.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      if (filteredItems.length === 0) return null;

                      return (
                          <div key={catIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-3">
                                  <div className="text-gold text-xl">{category.icon}</div>
                                  <h3 className="font-bold text-navy text-lg">{category.category}</h3>
                              </div>
                              <div className="divide-y divide-gray-100">
                                  {filteredItems.map((item, idx) => {
                                      const id = `${catIdx}-${idx}`;
                                      return (
                                          <div key={idx}>
                                              <button 
                                                  onClick={() => toggle(id)}
                                                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                                              >
                                                  <span className="font-medium text-navy pr-4">{item.q}</span>
                                                  {openIndex === id ? <ChevronUp className="text-gold shrink-0"/> : <ChevronDown className="text-gray-400 shrink-0"/>}
                                              </button>
                                              {openIndex === id && (
                                                  <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1">
                                                      {item.a}
                                                  </div>
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      );
                  })}
              </div>

              <div className="mt-12 text-center">
                  <p className="text-gray-500">{t.support.stillNeedHelp}</p>
                  <Link href="/contact" className="text-navy font-bold hover:text-gold underline mt-2 inline-block">
                      {t.support.contactTitle}
                  </Link>
              </div>
          </div>
      </main>

      <Footer />
    </div>
  );
}