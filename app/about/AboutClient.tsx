"use client";

import Image from "next/image";
import { Globe, People, Lightbulb, Heart } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Header from "@/components/Header"; 
import Footer from "@/components/Footer"; 

export default function AboutContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white font-sans text-navy flex flex-col">
      
      {/* Shared Landing Page Header */}
      <Header />

      <main className="flex-1">
          {/* Hero */}
          <div className="py-20 px-6 text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-navy">{t.about.heroTitle}</h1>
              <p className="text-xl text-gray-500 leading-relaxed">
                  {t.about.heroSubtitle}
              </p>
          </div>

          {/* Story Section */}
          <div className="bg-gray-50 py-20 px-6">
              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                  {/* IMAGE SECTION */}
                  <div className="relative h-[500px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                      <Image 
                          src="/assets/images/about-us.jpg" 
                          alt="AfriqGig Team Collaboration"
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-700"
                          priority
                      />
                      {/* Subtle Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent"></div>
                  </div>

                  <div className="space-y-8">
                      <h2 className="text-3xl font-bold text-navy">{t.about.storyTitle}</h2>
                      <p className="text-gray-600 leading-relaxed text-lg">
                          {t.about.storyText1}
                      </p>
                      <p className="text-gray-600 leading-relaxed text-lg">
                          {t.about.storyText2} <strong className="text-navy">AfriqGig</strong> {t.about.storyText3}
                      </p>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-6 pt-4">
                          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                              <h3 className="text-3xl font-bold text-gold">500+</h3>
                              <p className="text-xs font-bold text-navy uppercase tracking-widest mt-1">{t.roles.freelancer}s</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                              <h3 className="text-3xl font-bold text-gold">15+</h3>
                              <p className="text-xs font-bold text-navy uppercase tracking-widest mt-1">{t.auth.location}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Values */}
          <div className="py-24 px-6 max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-navy text-center mb-16">{t.about.valuesTitle}</h2>
              <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-8 border border-gray-100 rounded-3xl hover:shadow-xl transition-all hover:-translate-y-1 bg-white text-center group">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Globe /></div>
                      <h3 className="font-bold text-xl mb-3 text-navy">{t.about.value1Title}</h3>
                      <p className="text-gray-500 leading-relaxed">{t.about.value1Text}</p>
                  </div>
                  <div className="p-8 border border-gray-100 rounded-3xl hover:shadow-xl transition-all hover:-translate-y-1 bg-white text-center group">
                      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors"><Heart /></div>
                      <h3 className="font-bold text-xl mb-3 text-navy">{t.about.value2Title}</h3>
                      <p className="text-gray-500 leading-relaxed">{t.about.value2Text}</p>
                  </div>
                  <div className="p-8 border border-gray-100 rounded-3xl hover:shadow-xl transition-all hover:-translate-y-1 bg-white text-center group">
                      <div className="w-16 h-16 bg-gold/10 text-gold rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-gold group-hover:text-white transition-colors"><Lightbulb /></div>
                      <h3 className="font-bold text-xl mb-3 text-navy">{t.about.value3Title}</h3>
                      <p className="text-gray-500 leading-relaxed">{t.about.value3Text}</p>
                  </div>
              </div>
          </div>
      </main>

      {/* Shared Landing Page Footer */}
      <Footer />
    </div>
  );
}