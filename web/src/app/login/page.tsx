"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { startOAuthLogin, error, isAuthenticated, loadUser } = useAuthStore();
  const hasRedirectedRef = useRef(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 이미 리다이렉트를 시도했으면 다시 시도하지 않음
    if (hasRedirectedRef.current) {
      return;
    }

    // 먼저 현재 인증 상태를 확인
    const checkAuthAndRedirect = async () => {
      try {
        // 사용자 정보를 다시 로드하여 실제 인증 상태 확인
        await loadUser();
        
        // 로그인되어 있으면 대시보드로 이동
        if (isAuthenticated) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // 로그인되어 있지 않음 - 정상
      } finally {
        setIsCheckingAuth(false);
      }

      // 로그인되어 있지 않으면 PPOP Auth로 리다이렉트
      hasRedirectedRef.current = true;
      try {
        await startOAuthLogin();
      } catch (err) {
        console.error("Failed to redirect to PPOP Auth:", err);
        // 에러 발생 시 플래그 리셋하여 재시도 허용
        hasRedirectedRef.current = false;
      }
    };

    checkAuthAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 에러가 있으면 에러 화면 표시
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

  // 로딩 화면 (인증 확인 중 또는 PPOP Auth로 리다이렉트 중)
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-3xl font-extrabold text-primary">
          PPOPLINK
        </Link>

        <div className="mt-8 flex flex-col items-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
          <p className="text-gray-600">
            {isCheckingAuth ? "Checking authentication..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    </div>
  );
}
