"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { syncSessionDataToServer } from "@/lib/utils/syncSessionData";
import Link from "next/link";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");

        if (errorParam) {
          throw new Error(searchParams.get("error_description") || errorParam);
        }

        if (!code || !state) {
          throw new Error("Missing callback parameters");
        }

        const savedState = sessionStorage.getItem("oauth_state");
        if (savedState !== state) {
          throw new Error("Invalid state parameter");
        }

        const response = await authApi.oauthCallback({ code, state });
        setUser(response.user);

        sessionStorage.removeItem("oauth_state");

        await syncSessionDataToServer();

        router.push("/dashboard/links");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Login failed");
      }
    };

    processCallback();
  }, [router, searchParams, setUser]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <Link href="/" className="text-3xl font-extrabold text-primary">
              PPOPLINK
            </Link>
          </div>

          <div className="rounded-lg bg-red-50 p-6">
            <h1 className="mb-2 text-xl font-bold text-red-600">
              Login Failed
            </h1>
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            PPOPLINK
          </Link>
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
          <p className="text-gray-600">Completing login...</p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            PPOPLINK
          </Link>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

