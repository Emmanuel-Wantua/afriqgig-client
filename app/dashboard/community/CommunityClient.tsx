"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Image as ImageIcon, CameraVideo, Send, Heart, HeartFill, Chat,
    Share, PersonCircle, ThreeDots, Globe, PlusLg, X, Pencil, Trash,
    Whatsapp, Facebook, Twitter, Linkedin, Link45deg, Megaphone,
    PinAngleFill, ExclamationCircleFill, CheckCircleFill,
    ChevronLeft, ChevronRight, ArrowsFullscreen
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"; 
import { uploadToCloudinary } from "@/utils/upload";
import UserBadge from "@/components/UserBadge";
import PageLoader from "@/components/PageLoader";
import { INTEREST_TOPICS } from "@/utils/data";
import { useGoogleTranslate } from "@/hooks/useGoogleTranslate";

// --- SUB-COMPONENT: POST CONTENT ---
const PostContent = ({ text }: { text: string }) => {
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

    return (
        <div className="px-4 pb-2">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {showTranslated ? translatedText : text}
            </p>
            {language !== "en" && (
                <button 
                    onClick={handleTranslate} 
                    disabled={loading}
                    className="text-xs text-blue-500 font-bold hover:underline mt-2 flex items-center gap-1 transition-colors"
                >
                    <Globe className="text-[10px]" />
                    {loading ? t.community.translating : showTranslated ? t.community.showOriginal : `${t.community.translate} ${language.toUpperCase()}`}
                </button>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: COMMENT CONTENT ---
const CommentContent = ({ text }: { text: string }) => {
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

    return (
        <div className="flex flex-col items-start gap-1">
            <p className="text-xs text-gray-700 mt-0.5 leading-relaxed bg-white p-2 rounded-lg shadow-sm border border-gray-100 inline-block">
                {showTranslated ? translatedText : text}
            </p>
            {language !== "en" && (
                <button 
                    onClick={handleTranslate} 
                    disabled={loading}
                    className="text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity ml-1"
                >
                    <Globe className="text-[9px]" />
                    {loading ? "..." : showTranslated ? t.community.showOriginal : t.community.translate}
                </button>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: MEDIA CAROUSEL ---
const PostMediaCarousel = ({ mediaUrls, mediaType, onOpenLightbox }: { mediaUrls: string[], mediaType: string, onOpenLightbox: (idx: number) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Track scroll position to update dots
    const handleScroll = () => {
        if (scrollRef.current) {
            const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
            setActiveIndex(index);
        }
    };

    // Scroll buttons logic
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth;
            scrollRef.current.scrollBy({ 
                left: direction === 'left' ? -scrollAmount : scrollAmount, 
                behavior: 'smooth' 
            });
        }
    };

    if (!mediaUrls || mediaUrls.length === 0) return null;

    return (
        <div className="mt-3 relative group w-full aspect-square bg-gray-900/5 rounded-xl border border-gray-100 overflow-hidden">
            
            {/* SCROLLABLE CONTAINER */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {mediaUrls.map((url, idx) => {
                    const isVideo = mediaType === "video" || url.includes(".mp4") || url.includes(".webm");
                    return (
                        <div 
                            key={idx} 
                            onClick={() => onOpenLightbox(idx)}
                            className="snap-center shrink-0 w-full h-full relative cursor-zoom-in flex items-center justify-center overflow-hidden bg-black/5"
                        >
                            {/* Blurred Background Layer */}
                            {isVideo ? (
                                <video src={url} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" muted />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" alt="bg"/>
                            )}
                            
                            {/* Main Content Layer */}
                            <div className="relative z-10 w-full h-full flex items-center justify-center p-0.5">
                                {isVideo ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <video src={url} className="max-w-full max-h-full object-contain shadow-sm" />
                                        {/* Play Icon Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-colors">
                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                                                <CameraVideo className="text-navy text-xl" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={url} className="max-w-full max-h-full object-contain shadow-sm" alt={`Slide ${idx}`} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* NAVIGATION BUTTONS (Desktop Only) */}
            {mediaUrls.length > 1 && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-navy p-2 rounded-full shadow-lg backdrop-blur-sm hover:scale-110 transition-all z-20 hidden md:flex ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronLeft className="text-xl" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-navy p-2 rounded-full shadow-lg backdrop-blur-sm hover:scale-110 transition-all z-20 hidden md:flex ${activeIndex === mediaUrls.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronRight className="text-xl" />
                    </button>
                </>
            )}

            {/* PAGINATION DOTS (Always Visible if Multiple) */}
            {mediaUrls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    {mediaUrls.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "bg-white scale-125 w-2" : "bg-white/50"}`} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CommunityContent() {
  const { t, language, user } = useLanguage();
  const router = useRouter(); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit & Menu State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filtering State
  const [activeFilter, setActiveFilter] = useState("All");
  const [customCategory, setCustomCategory] = useState("");

  // Animation State
  const { scrollY } = useScroll();
  const [isExpanded, setIsExpanded] = useState(true);

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null); 
  const [commentText, setCommentText] = useState("");

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareData, setShareData] = useState<{ url: string, text: string } | null>(null);
  
  // Post Creation State
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  
  // NEW: Multi-File State
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPosting, setIsPosting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error", message: string } | null>(null);

  // Delete Modal State
  const [postToDelete, setPostToDelete] = useState<any>(null); 
  const [isDeleting, setIsDeleting] = useState(false);

  // NEW: Lightbox State
  const [lightboxPost, setLightboxPost] = useState<any>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [uploadProgress, setUploadProgress] = useState(0);

  // --- LIGHTBOX STATE ---
  const [showMobileComments, setShowMobileComments] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Detect Scroll Direction
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    setIsExpanded(latest <= 50 || latest < previous); 
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
      const handleClick = () => setActiveMenuId(null);
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
  }, []);

  // --- SWIPE LOGIC ---
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      const mediaLen = getPostMedia(lightboxPost).length;
      if (mediaLen <= 1) return;

      if (isLeftSwipe) {
          // Next
          setLightboxIndex(prev => (prev + 1) % mediaLen);
      }
      if (isRightSwipe) {
          // Prev
          setLightboxIndex(prev => (prev === 0 ? mediaLen - 1 : prev - 1));
      }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/community", { cache: "no-store" });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Sort: Pinned first, then newest
        const sorted = data.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setPosts(sorted);
      } else {
        setPosts([]); 
      }
    } catch (error) {
      console.error("Network Error:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (post: any) => { setPostToDelete(post); };

  const confirmDelete = async () => {
        if (!postToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/community/${postToDelete._id}?userId=${user._id}`, { method: "DELETE" });
            
            if (res.ok) {
                setPosts(prev => prev.filter(p => p._id !== postToDelete._id));
                setPostToDelete(null); 
            } else {
                alert("Failed to delete post.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
  };

  const handlePostOrUpdate = async () => {
    // 1. Validation
    if (!content.trim() && mediaFiles.length === 0) {
        setFeedback({ type: "error", message: "Post cannot be empty. Add text or media." });
        return;
    }
    
    if (!user) {
        setFeedback({ type: "error", message: t.auth.login });
        return;
    }

    if (!editingPostId && (!category || category === "")) {
        setFeedback({ type: "error", message: t.community.errorCategory || "Please select a category" });
        return;
    }

    // ✅ FORCE UI UPDATE: Start posting state immediately
    setIsPosting(true);
    setUploadProgress(1); // Start at 1% so the bar appears instantly

    try {
      if (editingPostId) {
          // --- UPDATE LOGIC (No media upload needed usually) ---
          const res = await fetch(`/api/community/${editingPostId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content }) 
          });
          const data = await res.json(); 
          if (res.ok) {
              setPosts(prev => prev.map(p => p._id === editingPostId ? { ...data, author: p.author } : p));
              setEditingPostId(null);
              setContent("");
          } else {
              throw new Error(data.message || "Update failed");
          }
      } 
      else {
          // --- CREATE NEW POST ---
          let finalCategory = category;
          if (category === "Other") {
             if (!customCategory.trim()) {
                 setFeedback({ type: "error", message: t.community.errorCategory });
                 setIsPosting(false);
                 return;
             }
             finalCategory = customCategory.trim();
          }

          // ✅ ROBUST UPLOAD LOGIC
          const uploadedUrls: string[] = [];
          
          if (mediaFiles.length > 0) {
              const total = mediaFiles.length;
              
              for (let i = 0; i < total; i++) {
                  // Calculate progress bucket for this file (e.g., File 1 is 0-50%, File 2 is 50-100%)
                  const startProgress = Math.round((i / total) * 100);
                  const endProgress = Math.round(((i + 1) / total) * 100);
                  
                  setUploadProgress(startProgress + 5); // Move bar slightly to show activity
                  
                  // Artificial delay to let React render the start state (100ms)
                  await new Promise(r => setTimeout(r, 100));

                  const url = await uploadToCloudinary(mediaFiles[i]);
                  
                  if (url) {
                      uploadedUrls.push(url);
                      setUploadProgress(endProgress); // Jump to end of this file's progress
                  }
              }
              
              if (uploadedUrls.length === 0) throw new Error("Media upload failed");
          }

          setUploadProgress(100); // Upload complete, finalizing...

          let type = "none";
          if (mediaFiles.length > 0) {
              type = mediaFiles[0].type.startsWith("video") ? "video" : "image";
          }

          const payload = { 
              author: user._id, 
              content, 
              category: finalCategory,
              mediaType: type, 
              mediaUrl: uploadedUrls[0] || "", 
              mediaUrls: uploadedUrls 
          };

          const res = await fetch("/api/community", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          const data = await res.json(); 

          if (res.ok) {
            const newPost = data;
            newPost.author = { name: user.name, avatar: user.avatar, title: user.title, _id: user._id };
            setPosts([newPost, ...posts]);
            
            // Reset
            setContent("");
            setMediaFiles([]);
            setCategory(""); 
            setCustomCategory(""); 
            if (fileInputRef.current) fileInputRef.current.value = "";
            setFeedback({ type: "success", message: "Post created successfully!" });
          } else {
            throw new Error(data.message || "Server rejected the post");
          }
      }
    } catch (error: any) {
      console.error("Post Error:", error);
      setFeedback({ type: "error", message: error.message || "Action failed." });
    } finally {
      // ✅ DELAY RESET: Keep the "Posting..." state visible for 500ms so user sees 100%
      setTimeout(() => {
          setIsPosting(false);
          setUploadProgress(0);
      }, 500);
    }
  };

  const handleInteract = async (postId: string, type: "like" | "comment", text?: string) => {
      // 1. Optimistic Update (Immediate UI Feedback)
      setPosts(prev => prev.map(p => {
          if (p._id === postId) {
              if (type === "like") {
                  const hasLiked = p.likes.includes(user?._id);
                  const newLikes = hasLiked ? p.likes.filter((id: string) => id !== user?._id) : [...p.likes, user?._id];
                  
                  if (lightboxPost && lightboxPost._id === postId) {
                      setLightboxPost((prevLight: any) => ({ ...prevLight, likes: newLikes }));
                  }
                  
                  return { ...p, likes: newLikes };
              }
          }
          return p;
      }));

      if (type === "comment") { setCommentText(""); setActiveCommentId(null); }

      // 2. Server Request
      try {
          const res = await fetch(`/api/community/${postId}/interact`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user?._id, type, commentText: text })
          });
          
          if (res.ok) {
              const updatedPost = await res.json();
              
              // Update Main List with confirmed data
              setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
              
              // ✅ FIX: Sync Lightbox with confirmed data if open
              if (lightboxPost && lightboxPost._id === postId) {
                  setLightboxPost(updatedPost);
              }
          }
      } catch (error) {
          console.error("Interaction error", error);
      }
  };

  // Helper: Open Lightbox
  const openLightbox = (post: any, index: number = 0) => {
      setLightboxPost(post);
      setLightboxIndex(index);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeLightbox = () => {
      setLightboxPost(null);
      setLightboxIndex(0);
      document.body.style.overflow = 'auto';
  };

  // Helper: Get Media Array (Supports old single url + new array)
  const getPostMedia = (post: any) => {
      if (post.mediaUrls && post.mediaUrls.length > 0) return post.mediaUrls;
      if (post.mediaUrl) return [post.mediaUrl];
      return [];
  };

  // --- FILTERED POSTS ---
  const visiblePosts = posts.filter(post => {
      if (post.isPinned) return true; 
      if (activeFilter === "All") return true;
      if (activeFilter === "My Posts") return user && post.author?._id === user._id;
      if (activeFilter === "For You") {
          if (!user) return true;
          if (user.interests?.includes(post.category)) return true;
          const isStandard = INTEREST_TOPICS.includes(post.category) || post.category === "General";
          if (!isStandard && user.skills?.length > 0) {
              return user.skills.some((skill: string) => post.category.toLowerCase().includes(skill.toLowerCase()));
          }
          if ((!user.interests || user.interests.length === 0) && (!user.skills || user.skills.length === 0)) return true;
          return false;
      }
      return post.category === activeFilter;
  });

  const startEdit = (post: any) => {
      setContent(post.content);
      setEditingPostId(post._id);
      setCategory(post.category || "");
      
      // If the post has legacy media, set it (optional, mainly for text edits)
      // Note: We don't pre-fill file inputs for security reasons, 
      // but you could show a "Current Media" preview if you wanted.
      
      // Scroll to top to show the editor
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleShare = async (post: any) => {
        const safeText = Array.from(post.content || "").slice(0, 50).join("");
        const data = {
            title: 'AfriqGig Post',
            text: safeText + "...",
            url: window.location.href 
        };

        if (navigator.share) {
            try {
                await navigator.share(data);
                return; 
            } catch (err) {
                console.log("Native share dismissed/failed");
            }
        }

        setShareData(data);
        setShowShareMenu(true);
    };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative pb-24 px-4 md:px-0">
      
      {/* --- HEADER & FILTER --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-0 z-30">
         <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-white to-gray-50/30">
             <h1 className="text-xl md:text-2xl font-extrabold text-navy">{t.community.title}</h1>
             <p className="text-xs md:text-sm text-gray-500 mt-1">{t.community.subtitle}</p>
         </div>
         
         <div className="px-4 py-3 bg-white flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
             <button onClick={() => setActiveFilter("All")} className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeFilter === "All" ? "bg-navy text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"}`}>{t.community.filterAll}</button>
             <button onClick={() => setActiveFilter("For You")} className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeFilter === "For You" ? "bg-gold text-navy shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"}`}>{t.community.filterForYou}</button>
             {user && (
                <button onClick={() => setActiveFilter("My Posts")} className={`flex-shrink-0 flex items-center gap-1 px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeFilter === "My Posts" ? "bg-navy text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"}`}>
                    <PersonCircle /> {t.community.filterMyPosts}
                </button>
             )}
             {INTEREST_TOPICS.map(topic => (
                 <button key={topic} onClick={() => setActiveFilter(topic)} className={`flex-shrink-0 whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeFilter === topic ? "bg-navy text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"}`}>{topic}</button>
             ))}
         </div>
      </div>

      {/* --- CREATE POST BOX --- */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm relative transition-shadow hover:shadow-md">
        <div className="flex gap-3 md:gap-4">
           <div className="w-10 h-10 md:w-11 md:h-11 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="User"/> : <PersonCircle className="text-4xl text-gray-300" />}
           </div>
           <div className="flex-1">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 focus-within:border-navy focus-within:bg-white transition-colors">
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={editingPostId ? t.community.updatePlaceholder : `${t.community.placeholder}, ${user?.name.split(' ')[0]}?`}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm min-h-[80px] placeholder:text-gray-400 text-navy"
                  />

                  {/* UPLOAD PROGRESS BAR */}
                  {isPosting && (
                      <div className="mt-3 px-1 animate-in fade-in slide-in-from-top-1">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-bold">
                              <span>
                                  {uploadProgress < 100 ? "Uploading media..." : "Finalizing post..."}
                              </span>
                              <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                              <div 
                                  className="h-full bg-navy transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,128,0.3)]" 
                                  style={{ width: `${Math.max(5, uploadProgress)}%` }} // Always show at least 5% so user sees it
                              />
                          </div>
                      </div>
                  )}
                  
                  {/* PREVIEW AREA (Square + Grid) */}
                  {mediaFiles.length > 0 && !editingPostId && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {mediaFiles.map((file, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                                {file.type.startsWith("video") ? (
                                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" /> 
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                                )}
                                <button 
                                    onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))} 
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500/80 transition-colors"
                                >
                                    <X className="text-xs"/>
                                </button>
                            </div>
                        ))}
                    </div>
                  )}
              </div>

              <div className="flex flex-col gap-3 pt-3 border-t border-gray-50 mt-1 md:flex-row md:items-center md:justify-between">
                 {!editingPostId && (
                     <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)} 
                                className={`w-full md:w-auto appearance-none bg-gray-50 border border-gray-200 rounded-full pl-4 pr-8 py-2 text-xs font-bold outline-none focus:border-navy focus:bg-white transition-all cursor-pointer ${category === "" ? "text-gray-400" : "text-navy"}`}
                                style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`}}
                            >
                                <option value="" disabled>{t.community.selectCategory}</option>
                                <option value="General">{t.community.general}</option>
                                {INTEREST_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                                <option value="Other" className="font-bold text-gold">{t.community.other}</option>
                            </select>
                        </div>

                        {category === "Other" && (
                            <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder={t.community.specifyCategory} className="flex-1 min-w-[120px] bg-white border border-gold/50 rounded-full px-4 py-2 text-xs outline-none focus:border-gold animate-in fade-in slide-in-from-left-2" />
                        )}
                        
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-navy px-3 py-2 rounded-full text-xs font-bold transition-colors ml-auto md:ml-0">
                            <ImageIcon className="text-base" /> <span className="hidden sm:inline">{t.community.mediaBtn}</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple onChange={(e) => e.target.files && setMediaFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
                     </div>
                 )}
                 
                 <div className={editingPostId ? "ml-auto" : "w-full md:w-auto flex justify-end"}>
                     <button onClick={handlePostOrUpdate} disabled={isPosting || (!content && mediaFiles.length === 0)} className={`w-full md:w-auto bg-navy text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${isPosting || (!content && mediaFiles.length === 0) ? "opacity-50 cursor-not-allowed" : "hover:bg-navy-light hover:shadow-lg hover:-translate-y-0.5"}`}>
                        <Send /> {isPosting ? t.community.posting : editingPostId ? t.community.update : t.community.post}
                     </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* FEED */}
      <div className="space-y-6">
        {visiblePosts.length === 0 ? (
            <div className="text-center py-24 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 md:mx-0">
                <Megaphone className="text-5xl mx-auto mb-4 opacity-20 text-navy" />
                <h3 className="font-bold text-navy text-lg mb-2">{t.community.quiet}</h3>
                <p className="text-sm">{t.community.beFirst}</p>
            </div>
        ) : (
           visiblePosts.map((post) => {
             const postMedia = getPostMedia(post);
             return (
             <div key={post._id} className={`bg-white rounded-2xl border ${post.isPinned ? "border-gold/40 bg-gold/5 shadow-sm" : "border-gray-100 shadow-sm"} overflow-visible relative transition-shadow hover:shadow-md`}>
                
                {post.isPinned && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-gold to-amber-400 text-navy text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1 z-10 shadow-sm">
                        <PinAngleFill /> {t.community.pinned}
                    </div>
                )}

                <div className="p-4 flex justify-between items-start relative">
                    <div className="flex gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                {post.author ? <UserBadge user={post.author} showRating={true} /> : <span className="font-bold text-navy text-sm">{t.community.unknownUser}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {post.author?.title || t.community.member} • {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                    
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === post._id ? null : post._id); }} className="text-gray-400 hover:text-navy p-1">
                        <ThreeDots />
                    </button>
                    
                    {activeMenuId === post._id && (
                        <div className="absolute right-4 top-10 bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden z-20 w-40 animate-in fade-in zoom-in-95">
                            {user && (post.author?._id === user?._id || user.role === 'admin') ? (
                                <>
                                    {post.author?._id === user?._id && (
                                      <button onClick={() => startEdit(post)} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"><Pencil className="text-blue-500" /> {t.community.edit}</button>
                                    )}

                                    <button 
                                        onClick={() => handleDeleteClick(post)} 
                                        className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                    >
                                        <Trash /> {t.community.delete}
                                    </button>
                                </>
                            ) : (
                                <button className="w-full text-left px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50">{t.community.report}</button>
                            )}
                        </div>
                    )}
                </div>

                <PostContent text={post.content} />

                <PostMediaCarousel 
                    mediaUrls={postMedia} 
                    mediaType={post.mediaType} 
                    onOpenLightbox={(idx) => openLightbox(post, idx)} 
                />

                <div className="p-4 border-t border-gray-50 flex gap-6 text-gray-500 mt-2">
                    <button onClick={() => handleInteract(post._id, "like")} className={`flex items-center gap-2 text-sm transition-colors ${user && post.likes.includes(user._id) ? 'text-red-500' : 'hover:text-red-500'}`}>
                        {user && post.likes.includes(user?._id) ? <HeartFill /> : <Heart />} <span>{post.likes.length}</span>
                    </button>
                    <button onClick={() => setActiveCommentId(activeCommentId === post._id ? null : post._id)} className={`flex items-center gap-2 text-sm transition-colors ${activeCommentId === post._id ? 'text-navy font-bold' : 'hover:text-navy'}`}>
                        <Chat /> <span>{post.comments?.length || 0}</span>
                    </button>
                    <button onClick={() => handleShare(post)} className="flex items-center gap-2 text-sm hover:text-navy transition-colors ml-auto">
                        <Share /> <span className="hidden sm:inline">{t.community.share}</span>
                    </button>
                </div>

                {activeCommentId === post._id && (
                    <div className="px-4 pb-4 bg-gray-50/50 rounded-b-2xl border-t border-gray-100">
                        <div className="flex gap-2 mb-4 pt-3">
                            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t.community.writeComment} className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-navy placeholder:text-gray-400 outline-none focus:border-navy" />
                            <button onClick={() => handleInteract(post._id, "comment", commentText)} className="bg-navy text-white p-2 rounded-full hover:bg-navy-light shadow-sm" disabled={!commentText.trim()}><Send className="text-sm" /></button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                            {post.comments?.map((comment: any, idx: number) => (
                                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                        {comment.user?.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover" /> : <PersonCircle className="text-3xl text-gray-400" />}
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none flex-1 shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>{comment.user ? <UserBadge user={comment.user} showRating={false} /> : <span className="font-bold text-navy text-xs">{t.community.unknownUser}</span>}</div>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(comment.date).toLocaleDateString()} at {new Date(comment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <CommentContent text={comment.text} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
           )})
        )}
      </div>

      {/* --- LIGHTBOX MODAL (Full Screen View) --- */}
      {lightboxPost && (
          <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl animate-in fade-in flex flex-col md:flex-row">
              
              {/* --- MEDIA AREA (Full Screen Mobile / Split Desktop) --- */}
              <div 
                  className={`relative flex items-center justify-center bg-transparent h-full w-full ${showMobileComments ? 'hidden md:flex md:w-[calc(100%-400px)]' : 'flex-1'}`}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
              >
                  {/* 1. DYNAMIC BLURRED BACKGROUND */}
                  <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                        {lightboxPost.mediaType === "image" || !getPostMedia(lightboxPost)[lightboxIndex].includes(".mp4") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                src={getPostMedia(lightboxPost)[lightboxIndex]} 
                                className="w-full h-full object-cover blur-3xl opacity-40 scale-110" 
                                alt="blur-bg"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-900/80 backdrop-blur-3xl" />
                        )}
                  </div>

                  {/* 2. TOP OVERLAY (User Info & Close) */}
                  <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                      <div className="flex items-center gap-3">
                          <button onClick={closeLightbox} className="text-white/90 hover:text-white p-1 rounded-full bg-black/20 backdrop-blur-md">
                              <X className="text-3xl"/>
                          </button>
                          {/* Mobile User Info (Only visible if not commented sidebar on desktop) */}
                          <div className="flex items-center gap-2 md:hidden text-white drop-shadow-md">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                    {lightboxPost.author?.avatar ? <img src={lightboxPost.author.avatar} className="w-full h-full object-cover" /> : <PersonCircle className="w-full h-full"/>}
                                </div>
                                <div>
                                    <p className="text-sm font-bold leading-none">{lightboxPost.author?.name}</p>
                                    <p className="text-[10px] opacity-80">{new Date(lightboxPost.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                          </div>
                      </div>

                      {/* Pagination Badge */}
                      {getPostMedia(lightboxPost).length > 1 && (
                          <div className="bg-black/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                              {lightboxIndex + 1} / {getPostMedia(lightboxPost).length}
                          </div>
                      )}
                  </div>

                  {/* 3. MAIN MEDIA CONTENT */}
                  <div className="relative z-10 w-full h-full max-h-screen flex items-center justify-center p-0 md:p-8">
                        {getPostMedia(lightboxPost)[lightboxIndex].includes(".mp4") || getPostMedia(lightboxPost)[lightboxIndex].includes(".webm") || lightboxPost.mediaType === "video" ? (
                            <video 
                                src={getPostMedia(lightboxPost)[lightboxIndex]} 
                                controls 
                                className="max-w-full max-h-full object-contain drop-shadow-2xl" 
                                autoPlay
                                playsInline
                            />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                src={getPostMedia(lightboxPost)[lightboxIndex]} 
                                className="max-w-full max-h-full object-contain drop-shadow-2xl" 
                                alt="Fullscreen"
                            />
                        )}
                  </div>

                  {/* 4. DESKTOP NAVIGATION BUTTONS (Hidden on Mobile) */}
                  {getPostMedia(lightboxPost).length > 1 && (
                      <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : getPostMedia(lightboxPost).length - 1); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full z-20 backdrop-blur-md hidden md:block"
                          >
                              <ChevronLeft className="text-3xl" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % getPostMedia(lightboxPost).length); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full z-20 backdrop-blur-md hidden md:block"
                          >
                              <ChevronRight className="text-3xl" />
                          </button>
                      </>
                  )}

                  {/* 5. MOBILE BOTTOM ACTIONS (Floating) */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent md:hidden">
                      <div className="flex items-center gap-6">
                          <button 
                              onClick={() => handleInteract(lightboxPost._id, "like")} 
                              className="flex flex-col items-center gap-1 text-white"
                          >
                              {user && lightboxPost.likes.includes(user?._id) ? <HeartFill className="text-2xl text-red-500 drop-shadow-sm"/> : <Heart className="text-2xl drop-shadow-sm"/>} 
                              <span className="text-[10px] font-bold">{lightboxPost.likes.length}</span>
                          </button>

                          <button 
                              onClick={() => setShowMobileComments(true)} 
                              className="flex flex-col items-center gap-1 text-white"
                          >
                              <Chat className="text-2xl drop-shadow-sm"/>
                              <span className="text-[10px] font-bold">{lightboxPost.comments.length}</span>
                          </button>

                          <button onClick={() => handleShare(lightboxPost)} className="flex flex-col items-center gap-1 text-white">
                              <Share className="text-2xl drop-shadow-sm"/>
                              <span className="text-[10px] font-bold">Share</span>
                          </button>
                      </div>
                  </div>
              </div>

              {/* --- SIDEBAR / MOBILE DRAWER (Comments & Details) --- */}
              {/* Desktop: Always visible on right. Mobile: Slides up when requested */}
              <div className={`
                  bg-white flex flex-col border-l border-gray-800 transition-transform duration-300 ease-in-out
                  ${showMobileComments ? 'fixed inset-0 z-30 translate-y-0' : 'hidden translate-y-full'} 
                  md:flex md:static md:w-[400px] md:translate-y-0
              `}>
                  {/* Header: User Info & Timestamp */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                {lightboxPost.author?.avatar ? <img src={lightboxPost.author.avatar} className="w-full h-full object-cover" /> : <PersonCircle className="text-4xl text-gray-400" />}
                            </div>
                            <div>
                                <UserBadge user={lightboxPost.author} showRating={true} />
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(lightboxPost.createdAt).toLocaleDateString()} at {new Date(lightboxPost.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                        {/* Mobile Close Button for Drawer */}
                        <button onClick={() => setShowMobileComments(false)} className="md:hidden p-2 text-gray-500 hover:text-navy bg-gray-100 rounded-full">
                            <X className="text-xl" />
                        </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50">
                      {lightboxPost.content && (
                          <div className="mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{lightboxPost.content}</p>
                          </div>
                      )}
                      
                      <div className="space-y-4">
                          {lightboxPost.comments?.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center italic mt-10">No comments yet. Start the conversation!</p>
                          ) : (
                              lightboxPost.comments?.map((comment: any, idx: number) => (
                                  <div key={idx} className="flex gap-3">
                                      <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                          {comment.user?.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover" /> : <PersonCircle className="text-3xl text-gray-300" />}
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-xs text-navy">{comment.user?.name || "User"}</span>
                                              <span className="text-[10px] text-gray-400">
                                                  {new Date(comment.date).toLocaleDateString()} {new Date(comment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </span>
                                          </div>
                                          <CommentContent text={comment.text} />
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Footer: Likes & Comment Input */}
                  <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                        {/* Desktop Likes (Hidden on Mobile since they are on the image overlay) */}
                        <div className="hidden md:flex items-center justify-between mb-3 text-sm text-gray-500 px-1">
                            <button 
                                onClick={() => handleInteract(lightboxPost._id, "like")} 
                                className={`flex items-center gap-1.5 transition-colors font-bold ${
                                    user && lightboxPost.likes.includes(user._id) ? 'text-red-500' : 'hover:text-red-500'
                                }`}
                            >
                                {user && lightboxPost.likes.includes(user?._id) ? <HeartFill className="text-lg"/> : <Heart className="text-lg"/>} 
                                <span>{lightboxPost.likes.length} Likes</span>
                            </button>
                            <span className="flex items-center gap-1.5"><Chat className="text-lg"/> {lightboxPost.comments.length} Comments</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={commentText} 
                                onChange={(e) => setCommentText(e.target.value)} 
                                placeholder={t.community.writeComment} 
                                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy/20 transition-all" 
                                onKeyDown={(e) => e.key === 'Enter' && commentText.trim() && handleInteract(lightboxPost._id, "comment", commentText)}
                            />
                            <button 
                                onClick={() => handleInteract(lightboxPost._id, "comment", commentText)} 
                                className="bg-navy text-white p-2.5 rounded-full hover:bg-navy-light transition-colors shadow-md disabled:opacity-50 flex-shrink-0" 
                                disabled={!commentText.trim()}
                            >
                                <Send className="text-sm" />
                            </button>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- CUSTOM DELETE MODAL --- */}
      {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
                  <h3 className="text-xl font-bold text-navy mb-2">{t.community.deleteConfirm}</h3>
                  <p className="text-sm text-gray-500 mb-6">
                      Are you sure you want to delete this post? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setPostToDelete(null)} className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors">{t.proposal.cancel}</button>
                      <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 shadow-lg transition-colors flex items-center justify-center gap-2">
                          {isDeleting ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <Trash />}
                          {t.community.delete}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SHARE MENU MODAL --- */}
      {showShareMenu && shareData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
                <button onClick={() => setShowShareMenu(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X className="text-2xl" /></button>
                <h3 className="font-bold text-navy text-lg mb-4 text-center">Share to...</h3>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors"><Whatsapp /></div><span className="text-[10px] font-bold text-gray-500">WhatsApp</span></a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Facebook /></div><span className="text-[10px] font-bold text-gray-500">Facebook</span></a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 bg-gray-100 text-black rounded-full flex items-center justify-center text-2xl group-hover:bg-black group-hover:text-white transition-colors"><Twitter /></div><span className="text-[10px] font-bold text-gray-500">X / Twitter</span></a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-700 group-hover:text-white transition-colors"><Linkedin /></div><span className="text-[10px] font-bold text-gray-500">LinkedIn</span></a>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-200">
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{shareData.url}</span>
                    <button onClick={() => { navigator.clipboard.writeText(shareData.text + " " + shareData.url); alert("Link Copied!"); setShowShareMenu(false); }} className="text-navy font-bold text-xs flex items-center gap-1 hover:underline"><Link45deg className="text-lg" /> Copy</button>
                </div>
            </div>
        </div>
      )}

      {/* --- FEEDBACK MODAL --- */}
      {feedback && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in zoom-in">
                <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {feedback.type === 'success' ? <CheckCircleFill /> : <ExclamationCircleFill />}
                    </div>
                    <h3 className="font-bold text-navy mb-1">{feedback.type === 'success' ? 'Success' : 'Error'}</h3>
                    <p className="text-sm text-gray-500 mb-6">{feedback.message}</p>
                    <button onClick={() => setFeedback(null)} className="w-full py-2 bg-gray-100 text-navy font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        )}

      {/* Animated FAB for Clients */}
      {user?.role === 'client' && (
          <motion.button 
            onClick={() => router.push("/dashboard/client/post-job")}
            layout
            className="fixed bottom-10 right-10 h-14 bg-gold text-navy rounded-full shadow-xl flex items-center justify-center z-50 overflow-hidden"
            style={{ borderRadius: 28 }} 
            animate={{ width: isExpanded ? 140 : 56, scale: [1, 1.05, 1], boxShadow: ["0px 10px 15px -3px rgba(0, 0, 0, 0.1)", "0px 20px 25px -5px rgba(255, 215, 0, 0.4)", "0px 10px 15px -3px rgba(0, 0, 0, 0.1)"] }}
            transition={{ width: { type: "spring", stiffness: 300, damping: 30 }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }, boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }}}
          >
            <div className="flex items-center justify-center px-4 whitespace-nowrap">
                <PlusLg className="text-2xl font-bold flex-shrink-0" />
                <AnimatePresence>
                    {isExpanded && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="ml-2 font-bold text-sm">{t.nav.postJob}</motion.span>
                    )}
                </AnimatePresence>
            </div>
          </motion.button>
      )}

    </div>
  );
}