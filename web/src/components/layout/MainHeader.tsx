"use client";

import React from "react";
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
  const { isAuthenticated } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-7xl">
          {/* 상단: 로고 + 카테고리 메뉴 + 버튼 */}
          <div className="flex h-16 items-center justify-between px-6 lg:px-8">
            {/* 로고 - 왼쪽 */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-extrabold text-primary">PPOPLINK</span>
            </Link>

            {/* 카테고리 메뉴 - 중앙 */}
            <nav className="flex items-center gap-8">
              {categoryMenuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive ? "text-primary" : "text-gray-700"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* 버튼 영역 - 오른쪽 */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
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
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="md:hidden">
        {/* 로고 (중앙) */}
        <div className="flex h-12 items-center justify-center border-b border-gray-100">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-extrabold text-primary">PPOPLINK</span>
          </Link>
        </div>

        {/* 모바일 카테고리 메뉴 */}
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