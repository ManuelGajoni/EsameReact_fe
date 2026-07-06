"use client";

// Questa pagina viene chiamata dal backend dopo il login OAuth2 (Google/GitHub).

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completeOAuthLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");
    console.log("[DEBUG callback] mounted, pathname:", window.location.pathname, "token present:", !!token, "refresh present:", !!refresh);

    if (token && refresh) {
      completeOAuthLogin(token, refresh);
    } else {
      console.log("[DEBUG callback] missing token/refresh, redirecting to /login?error=oauth_failed");
      router.push("/login?error=oauth_failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Completamento dell&apos;accesso...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
