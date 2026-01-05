"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        const response = await authApi.getOAuthLoginURL();
        sessionStorage.setItem("oauth_state", response.state);
        window.location.replace(response.login_url);
      } catch (err) {
        console.error("Failed to start registration:", err);
        setError("Failed to start registration. Please try again.");
      }
    };
    redirect();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            PPOPLINK
          </Link>

          <div className="mt-8 rounded-lg bg-red-50 p-6">
            <h1 className="mb-2 text-xl font-bold text-red-600">
              Registration Error
            </h1>
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

