"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, CameraVideo, Send, Heart, HeartFill, Chat, Share, PersonCircle, ThreeDots, Globe, PlusLg, X, Pencil, Trash, Whatsapp, Facebook, Twitter, Linkedin, Link45deg, Megaphone, PinAngleFill } from "react-bootstrap-icons";
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

  // Custom Category State
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
  const [media, setMedia] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete Modal State
    const [postToDelete, setPostToDelete] = useState<any>(null); 
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (post: any) => {
        setPostToDelete(post);
    };

    const confirmDelete = async () => {
        if (!postToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/community/${postToDelete._id}`, { method: "DELETE" });
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

  const handlePostOrUpdate = async () => {
    if (!content.trim() && !media) return;
    if (!user) return alert(t.auth.login);

    if (!editingPostId && (!category || category === "")) {
        alert(t.community.errorCategory);
        return;
    }

    setIsPosting(true);

    try {
      if (editingPostId) {
          const res = await fetch(`/api/community/${editingPostId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content }) 
          });
          
          if (res.ok) {
              const updated = await res.json();
              setPosts(prev => prev.map(p => p._id === editingPostId ? { ...updated, author: p.author } : p));
              setEditingPostId(null);
              setContent("");
          }
      } 
      else {
          let finalCategory = category;
          if (category === "Other") {
             if (!customCategory.trim()) {
                 alert(t.community.errorCategory);
                 setIsPosting(false);
                 return;
             }
             finalCategory = customCategory.trim();
          }

          let cloudUrl = "";
          let type = "none";

          if (media) {
              const url = await uploadToCloudinary(media);
              if (url) { cloudUrl = url; type = media.type.startsWith("video") ? "video" : "image"; }
          }

          const res = await fetch("/api/community", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                author: user._id, 
                content, 
                category: finalCategory,
                mediaType: type, 
                mediaUrl: cloudUrl 
            })
          });

          if (res.ok) {
            const newPost = await res.json();
            newPost.author = { name: user.name, avatar: user.avatar, title: user.title };
            setPosts([newPost, ...posts]);
            setContent("");
            setMedia(null);
            setCategory(""); 
            setCustomCategory(""); 
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
      }
    } catch (error) {
      alert("Action failed.");
    } finally {
      setIsPosting(false);
    }
  };

  const startEdit = (post: any) => {
      setContent(post.content);
      setEditingPostId(post._id);
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

  const handleInteract = async (postId: string, type: "like" | "comment", text?: string) => {
      setPosts(prev => prev.map(p => {
          if (p._id === postId) {
              if (type === "like") {
                  const hasLiked = p.likes.includes(user?._id);
                  return { ...p, likes: hasLiked ? p.likes.filter((id: string) => id !== user?._id) : [...p.likes, user?._id] };
              }
          }
          return p;
      }));

      if (type === "comment") { setCommentText(""); setActiveCommentId(null); }

      const res = await fetch(`/api/community/${postId}/interact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?._id, type, commentText: text })
      });
      
      if (res.ok && type === "comment") {
          const updatedPost = await res.json();
          setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      }
  };

  const visiblePosts = posts.filter(post => {
      if (post.isPinned) return true; 

      if (activeFilter === "All") return true;
      
      if (activeFilter === "My Posts") {
          return user && post.author?._id === user._id;
      }
      
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
                  
                  {media && !editingPostId && (
                    <div className="mt-2 relative rounded-lg overflow-hidden max-h-64 bg-gray-900">
                       {media.type.startsWith("video") ? <video src={URL.createObjectURL(media)} controls className="w-full h-full" /> : <img src={URL.createObjectURL(media)} className="w-full h-full object-contain" alt="Preview" />}
                       <button onClick={() => { setMedia(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-500/80 transition-colors"><X className="text-lg"/></button>
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
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => e.target.files && setMedia(e.target.files[0])} />
                     </div>
                 )}
                 
                 <div className={editingPostId ? "ml-auto" : "w-full md:w-auto flex justify-end"}>
                     <button onClick={handlePostOrUpdate} disabled={isPosting || (!content && !media)} className={`w-full md:w-auto bg-navy text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${isPosting || (!content && !media) ? "opacity-50 cursor-not-allowed" : "hover:bg-navy-light hover:shadow-lg hover:-translate-y-0.5"}`}>
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
           visiblePosts.map((post) => (
             <div key={post._id} className={`bg-white rounded-2xl border ${post.isPinned ? "border-gold/40 bg-gold/5 shadow-sm" : "border-gray-100 shadow-sm"} overflow-visible relative transition-shadow hover:shadow-md`}>
                
                {post.isPinned && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-gold to-amber-400 text-navy text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1 z-10 shadow-sm">
                        <PinAngleFill /> {t.community.pinned}
                    </div>
                )}

                <div className="p-4 flex justify-between items-start relative">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            {post.author?.avatar ? <img src={post.author.avatar} className="w-full h-full object-cover" alt="Avatar"/> : <PersonCircle className="text-4xl text-gray-400" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                {post.author ? <UserBadge user={post.author} showRating={true} /> : <span className="font-bold text-navy text-sm">{t.community.unknownUser}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{post.author?.title || t.community.member} • {new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === post._id ? null : post._id); }} className="text-gray-400 hover:text-navy p-1">
                        <ThreeDots />
                    </button>
                    
                    {activeMenuId === post._id && (
                        <div className="absolute right-4 top-10 bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden z-20 w-40 animate-in fade-in zoom-in-95">
                            {user && post.author?._id === user?._id ? (
                                <>
                                    <button onClick={() => startEdit(post)} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"><Pencil className="text-blue-500" /> {t.community.edit}</button>
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

                {post.mediaType === "image" && post.mediaUrl && <div className="w-full h-64 bg-black mt-2"><img src={post.mediaUrl} className="w-full h-full object-contain" /></div>}
                {post.mediaType === "video" && post.mediaUrl && <div className="w-full bg-black mt-2"><video src={post.mediaUrl} controls className="w-full max-h-96 mx-auto" /></div>}

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
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{new Date(comment.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
           ))
        )}
      </div>

      {/* --- CUSTOM DELETE MODAL --- */}
      {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
                  <h3 className="text-xl font-bold text-navy mb-2">{t.community.deleteConfirm}</h3>
                  <p className="text-sm text-gray-500 mb-6">
                      Are you sure you want to delete this post? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setPostToDelete(null)} 
                          className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors"
                      >
                          {t.proposal.cancel}
                      </button>
                      <button 
                          onClick={confirmDelete} 
                          disabled={isDeleting}
                          className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 shadow-lg transition-colors flex items-center justify-center gap-2"
                      >
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
                <button 
                    onClick={() => setShowShareMenu(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                >
                    <X className="text-2xl" />
                </button>
                
                <h3 className="font-bold text-navy text-lg mb-4 text-center">Share to...</h3>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors"><Whatsapp /></div>
                        <span className="text-[10px] font-bold text-gray-500">WhatsApp</span>
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Facebook /></div>
                        <span className="text-[10px] font-bold text-gray-500">Facebook</span>
                    </a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 bg-gray-100 text-black rounded-full flex items-center justify-center text-2xl group-hover:bg-black group-hover:text-white transition-colors"><Twitter /></div>
                        <span className="text-[10px] font-bold text-gray-500">X / Twitter</span>
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-700 group-hover:text-white transition-colors"><Linkedin /></div>
                        <span className="text-[10px] font-bold text-gray-500">LinkedIn</span>
                    </a>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-200">
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{shareData.url}</span>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(shareData.text + " " + shareData.url);
                            alert("Link Copied!");
                            setShowShareMenu(false);
                        }}
                        className="text-navy font-bold text-xs flex items-center gap-1 hover:underline"
                    >
                        <Link45deg className="text-lg" /> Copy
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}