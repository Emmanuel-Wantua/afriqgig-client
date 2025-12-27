"use client";

import Link from "next/link";
import { PatchCheckFill, StarFill } from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";

export default function UserBadge({ user, showRating = true }: { user: any, showRating?: boolean }) {
  const { t } = useLanguage();
  
  if (!user) return null;

  return (
    <Link href={`/profile/${user._id}`} className="flex items-center gap-1.5 align-middle inline-flex hover:opacity-80 transition-opacity cursor-pointer group">
      {/* Name */}
      <span className="font-bold text-navy truncate group-hover:underline">{user.name}</span>
      
      {/* Verified Badge */}
      {user.isVerified && (
        <PatchCheckFill className="text-blue-500 text-sm" title={t.profile.verifiedUser} />
      )}

      {/* Star Rating (Optional) */}
      {showRating && (user.rating || 0) > 0 && (
        <div className="flex items-center gap-0.5 bg-gold/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-navy ml-1 border border-gold/20">
            <StarFill className="text-gold text-[8px]" />
            <span>{user.rating?.toFixed(1)}</span>
            <span className="text-gray-400 font-normal">({user.reviewsCount})</span>
        </div>
      )}
    </Link>
  );
}