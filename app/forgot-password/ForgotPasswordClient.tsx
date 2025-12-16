"use client";

import { useState } from "react";
import Link from "next/link";
import { Envelope, ArrowLeft } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordContent() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        // Always show success for security
        setSuccess(true);
    } catch (error) {
        setSuccess(true);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-navy">

        {/* Language Switcher (Top Right) */}
        <div className="absolute top-4 right-4 z-50">
            <button 
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className="px-4 py-2 bg-white rounded-full shadow-sm text-xs font-bold text-navy hover:bg-gray-50 border border-gray-100 transition-all"
            >
                {language === 'en' ? '🇫🇷 FR' : '🇬🇧 EN'}
            </button>
        </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Simple Logo Placeholder or Image */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy">
            {t.auth.forgotPassword}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
            {t.auth.resetDesc || "Enter your email to receive a reset link."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          {!success ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700">
                    {t.auth.email}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Envelope className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-navy focus:border-navy sm:text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-all"
                >
                  {loading ? "Sending..." : t.auth.sendResetLink || "Send Reset Link"}
                </button>
              </form>
          ) : (
              <div className="text-center animate-in fade-in">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <Envelope className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                  <p className="mt-2 text-sm text-gray-500">
                      If an account exists for <strong>{email}</strong>, we have sent a password reset link.
                  </p>
              </div>
          )}

          <div className="mt-6">
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-navy transition-colors">
               <ArrowLeft /> {t.auth.backToLogin || "Back to Login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}