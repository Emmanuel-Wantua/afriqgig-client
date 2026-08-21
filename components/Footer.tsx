"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
    Facebook, Twitter, Linkedin, Lightbulb, 
    GeoAlt, Whatsapp, Envelope, Phone 
} from "react-bootstrap-icons";
import FeedbackModal from "@/components/FeedbackModal";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const [showFeedback, setShowFeedback] = useState(false);

  return (
      <footer className="bg-navy pt-24 pb-12 border-t-4 border-gold relative overflow-hidden font-sans text-blue-100">
          {/* Decorative Background Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
              
              {/* --- TOP SECTION: Brand & Navigation --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                  
                  {/* Brand Column */}
                  <div className="lg:col-span-4 space-y-6">
                      <Link href="/" className="inline-block">
                          <Image 
                             src="/assets/images/logo-white.png" 
                             alt="AfriqGig Logo" 
                             width={160} 
                             height={45} 
                             className="h-10 w-auto object-contain hover:opacity-100 transition-opacity"
                          />
                      </Link>
                      <p className="text-blue-100/70 leading-relaxed text-sm max-w-sm">
                          {t.footer.slogan}
                      </p>
                      
                      {/* Social Icons */}
                      <div className="flex gap-4 pt-2">
                          {[
                              { icon: <Facebook/>, href: "#" },
                              { icon: <Twitter/>, href: "#" },
                              { icon: <Linkedin/>, href: "#" }
                          ].map((social, idx) => (
                              <a 
                                  key={idx} 
                                  href={social.href} 
                                  className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-200 hover:bg-gold hover:text-navy transition-all duration-300 shadow-sm border border-white/5 hover:border-transparent"
                              >
                                  {social.icon}
                              </a>
                          ))}
                      </div>
                  </div>

                  {/* Spacer */}
                  <div className="hidden lg:block lg:col-span-1"></div>

                  {/* Links Column: Platform */}
                  <div className="lg:col-span-2">
                      <h4 className="font-bold text-white text-lg mb-6 relative inline-block">
                          {t.footer.platform}
                          <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-gold/50 rounded-full"></span>
                      </h4>
                      <ul className="space-y-4">
                          <li><Link href="/signup?role=client" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.landing.findTalent}</Link></li>
                          <li><Link href="/signup?role=freelancer" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.landing.findWork}</Link></li>
                          <li><Link href="/dashboard/community" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.nav.community}</Link></li>
                      </ul>
                  </div>

                  {/* Links Column: Company */}
                  <div className="lg:col-span-2">
                      <h4 className="font-bold text-white text-lg mb-6 relative inline-block">
                          {t.footer.company}
                          <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-gold/50 rounded-full"></span>
                      </h4>
                      <ul className="space-y-4">
                          <li><Link href="/about" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.nav.about}</Link></li>
                          <li><Link href="/terms" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.terms.title}</Link></li>
                          <li><Link href="/privacy" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.privacy.title}</Link></li>
                      </ul>
                  </div>

                  {/* Links Column: Support */}
                  <div className="lg:col-span-3">
                      <h4 className="font-bold text-white text-lg mb-6 relative inline-block">
                          {t.support.title}
                          <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-gold/50 rounded-full"></span>
                      </h4>
                      <ul className="space-y-4">
                          <li>
                              <button onClick={() => setShowFeedback(true)} className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 text-left group">
                                  <span className="bg-white/10 p-1.5 rounded-lg group-hover:bg-gold group-hover:text-navy transition-colors"><Lightbulb/></span> 
                                  {t.footer.suggestFeature}
                              </button>
                          </li>
                          <li><Link href="/contact" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.support.contactTitle}</Link></li>
                          <li><Link href="/faq" className="text-blue-100/70 hover:text-gold transition-colors text-sm flex items-center gap-2 group"><span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span> {t.support.faqTitle}</Link></li>
                      </ul>
                  </div>
              </div>

              {/* --- MIDDLE SECTION: Contact Info Horizontal Bar --- */}
              <div className="border-t border-white/5 py-10 mb-8">
                  {/* Changed grid-cols-1 md:grid-cols-3 to flex for better horizontal control on desktop */}
                  <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-4">
                      
                      {/* Location */}
                      <div className="flex items-start gap-4 group">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gold text-xl group-hover:bg-gold group-hover:text-navy transition-all duration-300 shadow-lg shadow-black/10 shrink-0">
                              <GeoAlt />
                          </div>
                          <div>
                              <h5 className="font-bold text-white text-sm mb-1 group-hover:text-gold transition-colors">Visit Us</h5>
                              <p className="text-xs text-blue-200/60 leading-relaxed">Buea, South West Region,<br/>Cameroon</p>
                          </div>
                      </div>

                      {/* WhatsApp */}
                      <a href="https://wa.me/237677079449" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gold text-xl group-hover:bg-gold group-hover:text-navy transition-all duration-300 shadow-lg shadow-black/10 shrink-0">
                              <Whatsapp />
                          </div>
                          <div>
                              <h5 className="font-bold text-white text-sm mb-1 group-hover:text-gold transition-colors">Chat Support</h5>
                              <p className="text-xs text-blue-200/60 group-hover:text-white transition-colors">+237 677 079 449</p>
                          </div>
                      </a>

                      {/* Phone Call */}
                      <a href="tel:+237677079449" className="flex items-start gap-4 group">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gold text-xl group-hover:bg-gold group-hover:text-navy transition-all duration-300 shadow-lg shadow-black/10 shrink-0">
                              <Phone />
                          </div>
                          <div>
                              <h5 className="font-bold text-white text-sm mb-1 group-hover:text-gold transition-colors">Call Us</h5>
                              <p className="text-xs text-blue-200/60 group-hover:text-white transition-colors">+237 677 079 449</p>
                          </div>
                      </a>

                      {/* Email */}
                      <a href="mailto:support@afriqgig.com" className="flex items-start gap-4 group">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gold text-xl group-hover:bg-gold group-hover:text-navy transition-all duration-300 shadow-lg shadow-black/10 shrink-0">
                              <Envelope />
                          </div>
                          <div>
                              <h5 className="font-bold text-white text-sm mb-1 group-hover:text-gold transition-colors">Email Us</h5>
                              <p className="text-xs text-blue-200/60 group-hover:text-white transition-colors">support@afriqgig.com</p>
                          </div>
                      </a>
                  </div>
              </div>
              
              {/* --- BOTTOM SECTION: Copyright --- */}
              <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-blue-100/40">
                  <p className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                      <span>&copy; {new Date().getFullYear()} AfriqGig. {t.footer.rightsReserved}</span>
                      <span className="inline-flex items-center gap-2 font-mono">
                          <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                          All systems operational
                      </span>
                  </p>
                  <p className="flex items-center gap-1">{t.footer.builtWithLove}</p>
              </div>
          </div>

          <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      </footer>
  );
}
