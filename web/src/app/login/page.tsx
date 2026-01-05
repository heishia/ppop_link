"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const authenticated = await checkAuth();

      setIsChecking(false);
      
      if (authenticated) {
        router.push("/dashboard/links");
        return;
      }

      try {
        const response = await authApi.getOAuthLoginURL();
        sessionStorage.setItem("oauth_state", response.state);

        window.location.replace(response.login_url);
      } catch (err) {
        console.error("Failed to start login:", err);
        setError("Failed to start login. Please try again.");
      }
    };
    init();
  }, [checkAuth, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            PPOPLINK
          </Link>

          <div className="mt-8 flex flex-col items-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            PPOPLINK
          </Link>

          <div className="mt-8 rounded-lg bg-red-50 p-6">
            <h1 className="mb-2 text-xl font-bold text-red-600">Login Error</h1>
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-3xl font-extrabold text-primary">
          PPOPLINK
        </Link>

        <div className="mt-8 flex flex-col items-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
          <p className="text-gray-600">Redirecting to PPOP Auth...</p>
        </div>
      </div>
    </div>
  );
}
