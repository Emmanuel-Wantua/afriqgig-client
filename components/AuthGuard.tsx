"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react"; // ✅ Use NextAuth Hook
import PageLoader from "@/components/PageLoader";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // 1. Check the official Session (Cookie) instead of LocalStorage
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until NextAuth determines if we are logged in or not
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // ❌ No Cookie found -> Redirect to Login
      const returnUrl = encodeURIComponent(pathname || "/dashboard/community");
      router.replace(`/login?returnUrl=${returnUrl}`);
    } 
    else if (status === "authenticated") {
      // ✅ Cookie found! User is logged in via Google/Email.
      
      // SYNC: Ensure LocalStorage matches the Cookie (Helper for your Context)
      const storedUser = localStorage.getItem("afriqUser");
      if (!storedUser && session?.user) {
          localStorage.setItem("afriqUser", JSON.stringify(session.user));
          // Notify the app that user data is now available
          window.dispatchEvent(new Event("afriq-user-update"));
      }
    }
  }, [status, session, router, pathname]);

  // Show Loader while NextAuth is checking the cookie
  if (status === "loading" || status === "unauthenticated") {
    return <PageLoader />;
  }

  // Render the protected page
  return <>{children}</>;
}