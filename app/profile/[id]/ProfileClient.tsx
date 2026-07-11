"use client";

import { useState, useEffect } from "react";
import { 
    GeoAlt, Clock, Briefcase, StarFill, CheckCircleFill, 
    Share, PersonCircle, BoxArrowUpRight, ArrowLeft, 
    Translate, CurrencyExchange, Mortarboard, Award,
    Whatsapp, Facebook, Twitter, Linkedin, Link45deg, X, Globe,
    ChevronLeft, ChevronRight
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserBadge from "@/components/UserBadge";
import PageLoader from "@/components/PageLoader";
import dynamic from 'next/dynamic';
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";
const HireModal = dynamic(() => import('@/components/HireModal'), { ssr: false });
import { motion, AnimatePresence } from "framer-motion";

// --- SUB-COMPONENT: TRANSLATABLE TEXT ---
const TranslatableText = ({ text, className = "" }: { text: string, className?: string }) => {
    const { t, language } = useLanguage();
    const { translate, loading } = useGoogleTranslate();
    const [translatedText, setTranslatedText] = useState("");
    const [showTranslated, setShowTranslated] = useState(false);

    const handleTranslate = async () => {
        if (showTranslated) {
            setShowTranslated(false);
            return;
        }
        if (!translatedText) {
            const res = await translate(text);
            setTranslatedText(res);
        }
        setShowTranslated(true);
    };

    if (!text) return null;

    return (
        <div className={className}>
            <p className="whitespace-pre-wrap">{showTranslated ? translatedText : text}</p>
            {language !== "en" && (
                <button 
                    onClick={handleTranslate} 
                    disabled={loading}
                    className="text-xs text-blue-500 font-bold hover:underline mt-1 flex items-center gap-1 transition-colors"
                >
                    <Globe className="text-[10px]" />
                    {loading ? t.community.translating : showTranslated ? t.community.showOriginal : `${t.community.translate} ${language.toUpperCase()}`}
                </button>
            )}
        </div>
    );
};

// --- MAIN CONTENT COMPONENT ---
export default function ProfileContent({ id }: { id: string }) {
    const { t, user: currentUser, convertPrice, language, setLanguage, currency, setCurrency } = useLanguage();
    // Safely access profile translations
    const profileT = (t as any).profile || {}; 
    const router = useRouter();
  
    const [profile, setProfile] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
  
    // Share State
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareData, setShareData] = useState<{ url: string, text: string } | null>(null);

    const [showHireModal, setShowHireModal] = useState(false);

    // ✅ LIGHTBOX STATE
    const [lightboxMedia, setLightboxMedia] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resUser = await fetch(`/api/users/${id}`);
                if (!resUser.ok) throw new Error("User not found");
                const userData = await resUser.json();
                setProfile(userData);

                const resReviews = await fetch(`/api/reviews/list?userId=${id}`);
                const reviewData = await resReviews.json();
                setReviews(Array.isArray(reviewData) ? reviewData : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // --- ROBUST SHARE FUNCTION ---
    const handleShare = async () => {
        const data = {
            title: `${t.manage.hire} ${profile.name} on AfriqGig`,
            text: `Check out ${profile.name}, a ${profile.title} on AfriqGig.`,
            url: window.location.href 
        };

        if (navigator.share) {
            try { await navigator.share(data); return; } 
            catch (err) { console.log("Native share dismissed"); }
        }
        setShareData(data);
        setShowShareMenu(true);
    };

    // --- TOGGLES ---
    const cycleLanguage = () => {
        const langs = ["en", "fr", "ar"];
        const nextIndex = (langs.indexOf(language) + 1) % langs.length;
        setLanguage(langs[nextIndex] as any);
    };

    const cycleCurrency = () => {
        const currencies = ["XAF", "USD", "EUR", "NGN"];
        const nextIndex = (currencies.indexOf(currency) + 1) % currencies.length;
        setCurrency(currencies[nextIndex] as any);
    };

    // --- PROTECTED HIRE ACTION ---
    const handleHireClick = () => {
        if (!currentUser) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }
        setShowHireModal(true);
    };

    // ✅ LIGHTBOX HANDLERS
    const openLightbox = (images: string[], index: number = 0) => {
        if (!images || images.length === 0) return;
        setLightboxMedia(images);
        setLightboxIndex(index);
        setShowLightbox(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setShowLightbox(false);
        setLightboxMedia([]);
        setLightboxIndex(0);
        document.body.style.overflow = 'auto';
    };

    if (loading) return <PageLoader />;
    if (!profile) return <div className="p-20 text-center text-gray-400">{t.community.unknownUser}</div>;

    const isMe = currentUser?._id === profile._id;
  
    return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
        
        {/* --- TOP NAVIGATION BAR --- */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex justify-between items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 text-navy transition-colors">
                <ArrowLeft className="text-xl" />
            </button>
            <span className="font-bold text-navy text-sm hidden md:block">{profile.name}&apos;s Profile</span>
            <div className="flex gap-2">
                <button onClick={cycleLanguage} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-navy hover:bg-gray-200">
                    <Translate /> {language.toUpperCase()}
                </button>
                <button onClick={cycleCurrency} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-navy hover:bg-gray-200">
                    <CurrencyExchange /> {currency}
                </button>
            </div>
        </div>

        {/* --- COVER & HEADER --- */}
        <div className="bg-white shadow-sm pb-8 mb-6">
            <div className="h-32 md:h-48 bg-gradient-to-r from-navy to-blue-900 relative">
                {profile.coverPhoto && <img src={profile.coverPhoto} className="w-full h-full object-cover opacity-50" alt="Cover" />}
            </div>
            
            <div className="max-w-5xl mx-auto px-4 md:px-6 relative">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start -mt-12 md:-mt-16">
                    
                    {/* Avatar */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md flex-shrink-0">
                        {profile.avatar ? (
                            <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
                        ) : <PersonCircle className="w-full h-full text-gray-400 p-2" />}
                    </div>

                    {/* Info & Actions */}
                    <div className="flex-1 w-full pt-2 md:pt-20">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-navy flex items-center gap-2">
                                    <UserBadge user={profile} showRating={false} />
                                </h1>
                                <p className="text-base md:text-lg text-gray-600 font-medium mt-1">{profile.title || "Freelancer"}</p>
                                
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm text-gray-500 mt-2">
                                    <span className="flex items-center gap-1"><GeoAlt /> {profile.country}</span>
                                    <span className="flex items-center gap-1"><Clock /> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (Local)</span>
                                    {profile.isVerified && <span className="flex items-center gap-1 text-blue-600 font-bold"><CheckCircleFill /> {t.settings.verified}</span>}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
                                <button onClick={handleShare} className="flex-1 md:flex-none justify-center px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-navy transition-colors flex items-center gap-2 text-sm font-bold min-w-[100px]">
                                    <Share /> <span className="md:hidden">{t.community.share}</span>
                                </button>
                                
                                {isMe ? (
                                    <Link href="/dashboard/settings" className="flex-[2] md:flex-none justify-center px-6 py-2.5 bg-gray-100 text-navy font-bold rounded-xl hover:bg-gray-200 text-sm flex items-center gap-2 min-w-[140px]">
                                        {profileT.edit}
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={`/dashboard/messages?chatWith=${profile._id}`} className="flex-1 md:flex-none justify-center px-4 py-2.5 border border-navy text-navy font-bold rounded-xl hover:bg-blue-50 text-sm text-center min-w-[100px]">
                                            {t.manage.chat}
                                        </Link>
                                        <button 
                                            onClick={handleHireClick}
                                            className="flex-[2] md:flex-none justify-center px-4 py-2.5 bg-navy text-white font-bold rounded-xl hover:bg-navy-light shadow-lg text-sm text-center min-w-[120px]"
                                        >
                                            {t.dashboard.hireNow}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            {/* --- LEFT SIDEBAR (Stats & Skills) --- */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                        <span className="text-gray-500 text-sm">{profileT.hourly || "Hourly Rate"}</span>
                        <span className="font-bold text-navy text-lg">
                            {profile.rateType === 'negotiated' ? t.dashboard.negotiable : convertPrice(profile.hourlyRate || 0)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                        <span className="text-gray-500 text-sm">{t.profile.jobsCompleted}</span>
                        <span className="font-bold text-navy">{profile.jobsCompleted || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">{t.profile.rating}</span>
                        <div className="flex items-center gap-1 font-bold text-navy">
                            <StarFill className="text-gold" />
                            <span>{profile.rating?.toFixed(1) || "0.0"}</span>
                            <span className="text-gray-400 font-normal">({profile.reviewsCount || 0})</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-navy mb-4">{profileT.skills}</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills?.length > 0 ? profile.skills.map((skill: string, i: number) => (
                            <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs md:text-sm font-medium">
                                {skill}
                            </span>
                        )) : <span className="text-gray-400 italic text-sm">{t.profile.noSkills}</span>}
                    </div>
                </div>

                {/* LANGUAGES */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-navy mb-4">{t.profile.languages}</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                        {profile.languages?.length > 0 ? (
                            profile.languages.map((lang: any, i: number) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="font-medium text-navy">
                                        {typeof lang === 'string' ? lang : lang.name}
                                    </span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        {typeof lang === 'string' ? 'Fluent' : lang.level}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between"><span>English</span> <span className="text-gray-400">Fluent</span></div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT (Info Rich) --- */}
            <div className="md:col-span-2 space-y-6 md:space-y-8">
                
                {/* About */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg md:text-xl text-navy mb-4">{profileT.bio}</h3>
                    
                    {/* TRANSLATION HOOK */}
                    <TranslatableText 
                        text={profile.bio || t.profile.noBio} 
                        className="text-gray-600 text-sm md:text-base leading-relaxed" 
                    />
                </div>

                {/* EXPERIENCE */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg md:text-xl text-navy mb-6 flex items-center gap-2">
                        <Briefcase className="text-gold" /> {t.profile.experience}
                    </h3>
                    <div className="space-y-6">
                        {profile.experience?.length > 0 ? profile.experience.map((exp: any, i: number) => (
                            <div key={i} className="pl-4 border-l-2 border-gray-100">
                                <h4 className="font-bold text-navy">{exp.role}</h4>
                                <div className="text-sm text-gray-500 mb-2">{exp.company} • {exp.year}</div>
                                <TranslatableText text={exp.description} className="text-sm text-gray-600" />
                            </div>
                        )) : <p className="text-sm text-gray-400 italic">{t.profile.noExperience}</p>}
                    </div>
                </div>

                {/* EDUCATION */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg md:text-xl text-navy mb-6 flex items-center gap-2">
                        <Mortarboard className="text-gold" /> {t.profile.education}
                    </h3>
                    <div className="space-y-4">
                        {profile.education?.length > 0 ? profile.education.map((edu: any, i: number) => (
                            <div key={i} className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-navy text-sm">{edu.degree}</h4>
                                    <p className="text-sm text-gray-500">{edu.school}</p>
                                </div>
                                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{edu.year}</span>
                            </div>
                        )) : <p className="text-sm text-gray-400 italic">{t.profile.noEducation}</p>}
                    </div>
                </div>

                {/* Portfolio */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg md:text-xl text-navy mb-6">{profileT.portfolio}</h3>
                    
                    {/* External Link */}
                    {profile.externalPortfolio && (
                         <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                            <Link45deg className="text-xl text-blue-600"/>
                            <h4 className="font-bold text-sm text-navy">{t.profile.externalLink}:</h4>
                            <a href={profile.externalPortfolio} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline truncate block">
                                {profile.externalPortfolio}
                            </a>
                         </div>
                    )}

                    {profile.portfolio?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {profile.portfolio.map((item: any, i: number) => {
                                // Consolidate images (support both legacy 'image' and new 'images' array)
                                const projectImages = item.images && item.images.length > 0 
                                    ? item.images 
                                    : (item.image ? [item.image] : []);

                                return (
                                    <div key={i} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                        <div 
                                            className="h-40 bg-gray-100 overflow-hidden relative cursor-pointer"
                                            onClick={() => openLightbox(projectImages, 0)}
                                        >
                                            {projectImages.length > 0 ? (
                                                <>
                                                    <img src={projectImages[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                                                    
                                                    {/* Multiple Images Indicator */}
                                                    {projectImages.length > 1 && (
                                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                                            1/{projectImages.length}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Overlay Icon */}
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                                                            <BoxArrowUpRight className="text-white text-xl" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Briefcase className="text-4xl" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-navy text-sm mb-1">{item.title}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                                            {item.link && (
                                                <a href={item.link} target="_blank" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {t.manage.view} <BoxArrowUpRight />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                            {t.profile.noProjects}
                        </div>
                    )}
                </div>

                {/* Reviews */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg md:text-xl text-navy mb-6">{profileT.reviews} ({reviews.length})</h3>
                    
                    {reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map((review: any) => (
                                <div key={review._id} className="pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-navy text-sm">
                                                {review.reviewer ? <UserBadge user={review.reviewer} showRating={false} /> : t.community.unknownUser}
                                            </div>
                                            <span className="text-xs text-gray-400">• {new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex text-gold text-xs">
                                            {[...Array(5)].map((_, i) => (
                                                <StarFill key={i} className={i < review.rating ? "text-gold" : "text-gray-200"} />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <TranslatableText text={review.comment} className="text-sm text-gray-600 leading-relaxed" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            {t.profile.noReviews}
                        </div>
                    )}
                </div>

            </div>
        </div>

        {showHireModal && (
            <HireModal 
                freelancer={profile} 
                onClose={() => setShowHireModal(false)} 
            />
        )}

        {/* --- SHARE MODAL --- */}
        {showShareMenu && shareData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
                    <button onClick={() => setShowShareMenu(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X className="text-2xl" /></button>
                    <h3 className="font-bold text-navy text-lg mb-4 text-center">{t.community.share}</h3>
                    
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`} target="_blank" className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors"><Whatsapp /></div>
                            <span className="text-[10px] font-bold text-gray-500">WhatsApp</span>
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`} target="_blank" className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Facebook /></div>
                            <span className="text-[10px] font-bold text-gray-500">Facebook</span>
                        </a>
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`} target="_blank" className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 bg-gray-100 text-black rounded-full flex items-center justify-center text-2xl group-hover:bg-black group-hover:text-white transition-colors"><Twitter /></div>
                            <span className="text-[10px] font-bold text-gray-500">X / Twitter</span>
                        </a>
                        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`} target="_blank" className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-700 group-hover:text-white transition-colors"><Linkedin /></div>
                            <span className="text-[10px] font-bold text-gray-500">LinkedIn</span>
                        </a>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-200">
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">{shareData.url}</span>
                        <button onClick={() => { navigator.clipboard.writeText(shareData.url); alert(t.referrals.copied); setShowShareMenu(false); }} className="text-navy font-bold text-xs flex items-center gap-1 hover:underline">
                            <Link45deg className="text-lg" /> {t.referrals.copy}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ✅ LIGHTBOX MODAL */}
        <AnimatePresence>
            {showLightbox && lightboxMedia.length > 0 && (
                <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl animate-in fade-in flex items-center justify-center">
                    
                    {/* Close Button */}
                    <button onClick={closeLightbox} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-50">
                        <X className="text-3xl" />
                    </button>

                    {/* Navigation Buttons (Desktop) */}
                    {lightboxMedia.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : lightboxMedia.length - 1); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full z-20 backdrop-blur-md hidden md:block"
                            >
                                <ChevronLeft className="text-3xl" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % lightboxMedia.length); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full z-20 backdrop-blur-md hidden md:block"
                            >
                                <ChevronRight className="text-3xl" />
                            </button>
                        </>
                    )}

                    {/* Media Container */}
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        {/* Blurred Background Layer */}
                        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                            <img 
                                src={lightboxMedia[lightboxIndex]} 
                                className="w-full h-full object-cover blur-3xl opacity-40 scale-110" 
                                alt="blur-bg"
                            />
                        </div>

                        {/* Main Image */}
                        <motion.img 
                            key={lightboxIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            src={lightboxMedia[lightboxIndex]} 
                            className="relative z-10 max-w-full max-h-[90vh] object-contain shadow-2xl rounded-lg" 
                            alt={`Project Image ${lightboxIndex + 1}`}
                        />

                        {/* Pagination Badge */}
                        {lightboxMedia.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 z-20">
                                {lightboxIndex + 1} / {lightboxMedia.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AnimatePresence>

    </div>
  );
}