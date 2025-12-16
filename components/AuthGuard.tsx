"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import PageLoader from "@/components/PageLoader";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Check LocalStorage directly for immediate feedback (faster than Context sometimes)
    const storedUser = localStorage.getItem("afriqUser");

    if (!storedUser) {
      // Not logged in -> Redirect to Login with return URL
      // We encode the current path so we can send them back after login
      const returnUrl = encodeURIComponent(pathname || "/dashboard/client");
      router.replace(`/login?returnUrl=${returnUrl}`);
    } else {
      // Logged in -> Allow access
      setIsAuthorized(true);
    }
  }, [router, pathname]);

  // Show Loader while checking (prevents "flash" of protected content)
  if (!isAuthorized) {
    return <PageLoader />;
  }

  return <>{children}</>;
}