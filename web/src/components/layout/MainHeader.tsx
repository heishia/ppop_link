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
  const { isAuthenticated, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시에만 실행

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 - 왼쪽 */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-extrabold text-primary">PPOPLINK</span>
        </Link>

        {/* 카테고리 메뉴 - 중앙 */}
        <nav className="hidden md:flex items-center gap-6">
          {categoryMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-base font-heading font-normal transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-gray-700"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* 버튼 영역 - 오른쪽 */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-10 w-20" />
          ) : isAuthenticated ? (
            <Link href="/dashboard/links">
              <Button
                variant="primary"
                className="px-4 py-2 text-sm h-auto"
              >
                대시보드
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/dashboard/links">
                <Button
                  variant="secondary"
                  className="px-4 py-2 text-sm h-auto"
                >
                  시작하기
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="primary"
                  className="px-4 py-2 text-sm h-auto"
                >
                  로그인
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className="bg-white md:hidden">
        <nav className="flex items-center justify-around px-4 py-2">
          {categoryMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-heading font-normal px-2 py-1 transition-colors",
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

