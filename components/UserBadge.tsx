"use client";

import Link from "next/link";
import { PatchCheckFill, StarFill, PersonCircle } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";

export default function UserBadge({ user, showRating = true }: { user: any, showRating?: boolean }) {
  const { t } = useLanguage();
  
  if (!user) return null;

  return (
    <Link href={`/profile/${user._id}`} className="flex items-center gap-3 align-middle inline-flex hover:opacity-80 transition-opacity cursor-pointer group">
      
      {/* ✅ NEW: Gradient Avatar */}
      <div className="relative">
          <div className="p-0.5 bg-gradient-to-br from-gold to-navy rounded-full">
               <div className="w-8 h-8 bg-white border-2 border-white rounded-full flex items-center justify-center text-navy font-bold text-xs uppercase shadow-sm overflow-hidden">
                   {user.avatar ? (
                       // eslint-disable-next-line @next/next/no-img-element
                       <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                   ) : (
                       user.name ? user.name[0] : <PersonCircle />
                   )}
               </div>
          </div>
          {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          )}
      </div>

      <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1">
              <span className="font-bold text-navy text-sm truncate group-hover:underline">{user.name}</span>
              
              {/* ✅ NEW: Bootstrap Verified Badge */}
              {user.isVerified && (
                <PatchCheckFill className="text-blue-500 text-xs" title={t.profile.verifiedUser || "Verified"} />
              )}
          </div>

          {/* Star Rating */}
          {showRating && (user.rating || 0) > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
                <StarFill className="text-gold text-[10px]" />
                <span className="text-[10px] font-bold text-gray-600">{user.rating?.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">({user.reviewsCount})</span>
            </div>
          )}
      </div>
    </Link>
  );
}