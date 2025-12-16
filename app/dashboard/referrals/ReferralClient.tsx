"use client";

import { useState, useEffect } from "react";
import { 
    Gift, ShareFill, Clipboard, CheckCircleFill, 
    PeopleFill, CashCoin, Whatsapp, Facebook, Twitter 
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import PageLoader from "@/components/PageLoader";

export default function ReferralContent() {
  const { t, user } = useLanguage();
  const [data, setData] = useState<{ code: string; credits: number; totalReferred: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      if (user) {
          fetch(`/api/referrals?userId=${user._id}`)
              .then(res => res.json())
              .then(setData)
              .catch(console.error)
              .finally(() => setLoading(false));
      }
  }, [user]);

  const copyToClipboard = () => {
      if (!data?.code) return;
      const link = `${window.location.origin}/signup?ref=${data.code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = (platform: string) => {
      if (!data?.code) return;
      const link = `${window.location.origin}/signup?ref=${data.code}`; // UPDATED to signup per request
      const text = t.referrals.shareText;
      
      let url = "";
      if (platform === "whatsapp") url = `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`;
      if (platform === "twitter") url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
      if (platform === "facebook") url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
      
      window.open(url, "_blank");
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* HERO SECTION */}
      <div className="bg-navy text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl mb-10">
          <div className="relative z-10 max-w-xl">
              <span className="inline-block bg-gold text-navy text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {t.referrals.limitedOffer}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                  {t.referrals.heroTitle} <br/> {t.referrals.heroSubtitle}
              </h1>
              <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-8">
                  {t.referrals.heroDescStart} <span className="text-gold font-bold">{t.referrals.heroDescPercent}</span> {t.referrals.heroDescEnd}
              </p>
              
              {/* COPY LINK BOX */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl flex items-center gap-3 max-w-md">
                  <div className="bg-white text-navy font-mono font-bold px-4 py-2 rounded-lg text-sm truncate flex-1">
                      afriqgig.com/signup?ref={data?.code}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-gold text-navy hover:bg-gold-light"}`}
                  >
                      {copied ? <CheckCircleFill /> : <Clipboard />}
                      {copied ? t.referrals.copied : t.referrals.copy}
                  </button>
              </div>
          </div>

          {/* Decorative Icon */}
          <div className="absolute -right-10 -bottom-10 opacity-10">
              <Gift className="text-[250px]" />
          </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl">
                  <PeopleFill />
              </div>
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">{t.referrals.statFriends}</p>
                  <h3 className="text-2xl font-bold text-navy">{data?.totalReferred || 0}</h3>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl">
                  <CashCoin />
              </div>
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">{t.referrals.statDiscounts}</p>
                  <h3 className="text-2xl font-bold text-navy">{data?.credits || 0} <span className="text-xs font-normal text-gray-400">{t.referrals.jobs}</span></h3>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs text-gray-500 font-bold uppercase mb-3">{t.referrals.shareSocials}</p>
              <div className="flex gap-3">
                  <button onClick={() => shareLink("whatsapp")} className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors flex justify-center"><Whatsapp/></button>
                  <button onClick={() => shareLink("twitter")} className="flex-1 bg-blue-50 text-blue-400 py-2 rounded-lg hover:bg-blue-100 transition-colors flex justify-center"><Twitter/></button>
                  <button onClick={() => shareLink("facebook")} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex justify-center"><Facebook/></button>
              </div>
          </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h3 className="text-lg font-bold text-navy mb-6">{t.referrals.howItWorks}</h3>
          <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                  <span className="absolute -top-3 -left-3 w-8 h-8 bg-gold text-navy font-bold rounded-full flex items-center justify-center shadow-sm">1</span>
                  <div className="p-4 bg-gray-50 rounded-xl h-full">
                      <h4 className="font-bold text-navy mb-2">{t.referrals.step1Title}</h4>
                      <p className="text-sm text-gray-600">{t.referrals.step1Desc}</p>
                  </div>
              </div>
              <div className="relative">
                  <span className="absolute -top-3 -left-3 w-8 h-8 bg-gold text-navy font-bold rounded-full flex items-center justify-center shadow-sm">2</span>
                  <div className="p-4 bg-gray-50 rounded-xl h-full">
                      <h4 className="font-bold text-navy mb-2">{t.referrals.step2Title}</h4>
                      <p className="text-sm text-gray-600">{t.referrals.step2Desc}</p>
                  </div>
              </div>
              <div className="relative">
                  <span className="absolute -top-3 -left-3 w-8 h-8 bg-gold text-navy font-bold rounded-full flex items-center justify-center shadow-sm">3</span>
                  <div className="p-4 bg-gray-50 rounded-xl h-full">
                      <h4 className="font-bold text-navy mb-2">{t.referrals.step3Title}</h4>
                      <p className="text-sm text-gray-600">{t.referrals.step3Desc}</p>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
}