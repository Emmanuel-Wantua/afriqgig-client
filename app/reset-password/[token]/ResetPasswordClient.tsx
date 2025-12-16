"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeSlash, CheckCircleFill } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";

export default function ResetPasswordContent({ token }: { token: string }) {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setMessage(t.auth?.passwordMismatch || "Passwords do not match");
        setStatus("error");
        return;
    }

    setLoading(true);
    setStatus("idle");

    try {
        const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                token: token, 
                password 
            })
        });
        
        const data = await res.json();

        if (res.ok) {
            setStatus("success");
            setTimeout(() => router.push("/login"), 3000); // Redirect after 3s
        } else {
            setStatus("error");
            setMessage(data.message || "Something went wrong");
        }
    } catch (error) {
        setStatus("error");
        setMessage("Connection failed");
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy">
            {t.auth?.resetPassword || "Set New Password"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          
          {status === "success" ? (
              <div className="text-center animate-in zoom-in">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                      <CheckCircleFill className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy">Success!</h3>
                  <p className="mt-2 text-sm text-gray-500">
                      {t.auth?.resetSuccessDesc || "Your password has been reset. Redirecting to login..."}
                  </p>
              </div>
          ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                
                {status === "error" && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center">
                        {message}
                    </div>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1 ml-1">
                    {t.auth?.newPassword || "New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 py-3 pl-4 pr-10 focus:ring-navy focus:border-navy"
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-navy"
                    >
                        {showPassword ? <EyeSlash /> : <Eye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1 ml-1">
                    {t.auth?.confirmPassword || "Confirm Password"}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 py-3 px-4 focus:ring-navy focus:border-navy"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-navy hover:bg-navy-light transition-all"
                >
                  {loading ? "Updating..." : t.auth?.updatePassword || "Update Password"}
                </button>
              </form>
          )}
        </div>
      </div>
    </div>
  );
}