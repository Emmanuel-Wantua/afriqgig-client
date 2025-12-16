"use client";

import { useState } from "react";
import { Envelope, GeoAlt, Telephone, Send, CheckCircleFill } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext"; // Import Context
import Header from "@/components/Header"; // Reusable Header
import Footer from "@/components/Footer"; // Reusable Footer

export default function ContactContent() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
          await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  name: `${formData.firstName} ${formData.lastName}`,
                  email: formData.email,
                  message: formData.message
              })
          });
          setSent(true);
      } catch (error) {
          alert(t.contact.error); // Use translated error message
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-navy flex flex-col">
      
      {/* Reusable Header */}
      <Header />

      <main className="flex-1 pt-20"> {/* Added pt-20 to account for fixed header */}
          
          <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
              {/* Info Side */}
              <div className="space-y-8">
                  <div>
                      <h1 className="text-4xl font-extrabold text-navy mb-4">{t.contact.title}</h1>
                      <p className="text-gray-600 text-lg">{t.contact.subtitle}</p>
                  </div>

                  <div className="space-y-6">
                      <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-navy text-xl shrink-0"><Envelope/></div>
                          <div>
                              <h4 className="font-bold text-navy">{t.contact.emailTitle}</h4>
                              <p className="text-gray-500 text-sm mb-1">{t.contact.emailText}</p>
                              <a href="mailto:support@afriqgig.com" className="text-gold font-bold hover:underline">support@afriqgig.com</a>
                          </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-navy text-xl shrink-0"><GeoAlt/></div>
                          <div>
                              <h4 className="font-bold text-navy">{t.contact.visitTitle}</h4>
                              <p className="text-gray-500 text-sm mb-1">{t.contact.visitText}</p>
                              <p className="font-medium text-navy">Buea, Southwest Region, Cameroon</p>
                          </div>
                      </div>

                      <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-navy text-xl shrink-0"><Telephone/></div>
                          <div>
                              <h4 className="font-bold text-navy">{t.contact.callTitle}</h4>
                              <p className="text-gray-500 text-sm mb-1">{t.contact.callText}</p>
                              <p className="font-medium text-navy">+237 677 079 449</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Form Side */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  {sent ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10">
                          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6"><CheckCircleFill/></div>
                          <h3 className="text-2xl font-bold text-navy mb-2">{t.contact.successTitle}</h3>
                          <p className="text-gray-500">{t.contact.successText}</p>
                          <button onClick={() => setSent(false)} className="mt-6 text-sm font-bold text-navy underline">{t.contact.sendAnother}</button>
                      </div>
                  ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-navy uppercase mb-1">{t.contact.firstName}</label>
                                  <input 
                                      type="text" 
                                      required 
                                      value={formData.firstName}
                                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy transition-colors" 
                                      placeholder="Jane"  
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-navy uppercase mb-1">{t.contact.lastName}</label>
                                  <input 
                                      type="text" 
                                      required 
                                      value={formData.lastName}
                                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy transition-colors" 
                                      placeholder="Doe" 
                                  />
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold text-navy uppercase mb-1">{t.auth.email}</label>
                              <input 
                                  type="email" 
                                  required 
                                  value={formData.email}
                                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy transition-colors" 
                                  placeholder="you@company.com" 
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-navy uppercase mb-1">{t.contact.messageLabel}</label>
                              <textarea 
                                  required 
                                  rows={5} 
                                  value={formData.message}
                                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy transition-colors resize-none" 
                                  placeholder={t.contact.messagePlaceholder} 
                              />
                          </div>

                          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                              {isSubmitting ? t.contact.sending : <><Send /> {t.contact.sendBtn}</>}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      </main>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}