"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="text-6xl font-extrabold text-red-600">오류 발생</h1>
            <h2 className="mt-4 text-2xl font-bold text-gray-700">
              예상치 못한 오류가 발생했습니다
            </h2>
            <p className="mt-2 text-gray-600">
              {error.message || "알 수 없는 오류가 발생했습니다."}
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <Button variant="primary" onClick={reset}>
                다시 시도
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.assign("/")}
              >
                홈으로 가기
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

