"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const categoryMenuItems = [
  { name: "도움말", href: "/help" },
  { name: "소개", href: "/about" },
  { name: "업데이트 소식", href: "/updates" },
  { name: "컨텐츠", href: "/content" },
];

export function MainHeader() {
  const pathname = usePathname();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    init();
  }, [checkAuth]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden sm:flex mx-auto h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* 로고 - 왼쪽 */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-extrabold text-primary">PPOPLINK</span>
        </Link>

        {/* 버튼 영역 - 오른쪽 */}
        <div className="flex items-center gap-2">
          {isChecking ? (
            <div className="h-9 w-16" />
          ) : isAuthenticated ? (
            <Link href="/dashboard/links">
              <Button
                variant="primary"
                className="px-3 py-1.5 text-sm h-auto whitespace-nowrap"
              >
                대시보드
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/dashboard/links">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-sm h-auto whitespace-nowrap"
                >
                  시작하기
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="primary"
                  className="px-3 py-1.5 text-sm h-auto whitespace-nowrap"
                >
                  로그인
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 - 로고만 표시 */}
      <div className="sm:hidden">
        {/* 로고 (중앙) */}
        <div className="flex h-12 items-center justify-center">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-extrabold text-primary">PPOPLINK</span>
          </Link>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className="bg-white border-b border-gray-100">
        <nav className="flex items-center justify-around px-4 py-2 gap-1">
          {categoryMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[11px] xs:text-xs font-heading font-normal transition-colors whitespace-nowrap",
                  isActive ? "text-primary" : "text-gray-700"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );

}