"use client";

// OAuth2 callback – commentato fino a configurazione Google/GitHub.
// Questa pagina viene chiamata dal backend dopo il login OAuth2.

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");

    if (token && refresh) {
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", refresh);
      router.push("/dashboard");
    } else {
      router.push("/login?error=oauth_failed");
    }
  }, [searchParams, router]);

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
