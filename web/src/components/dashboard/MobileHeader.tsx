"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { Avatar } from "@/components/ui/Avatar";

export function MobileHeader() {
  const { logout, isAuthenticated } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [fetchProfile, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      // authStore에서 자동으로 랜딩 페이지로 리다이렉트
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        {/* 왼쪽: TEST 모드 표시 (비로그인 시) */}
        <div className="w-auto">
          {!isAuthenticated && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              TEST
            </span>
          )}
        </div>

        {/* 가운데: 로고 */}
        <Link href="/" className="text-lg font-extrabold text-primary">
          PPOPLINK
        </Link>

        {/* 오른쪽: 프로필 메뉴 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="relative flex items-center"
        >
          {isAuthenticated ? (
            <Avatar
              src={profile?.profile_image_url || "/avatar-placeholder.jpg"}
              alt={profile?.username || "User"}
              size={32}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
          )}
        </button>
      </header>

      {/* 프로필 드롭다운 메뉴 */}
      {isMenuOpen && (
        <>
          {/* 백드롭 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* 메뉴 */}
          <div className="fixed right-4 top-14 z-50 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {isAuthenticated 
                  ? (profile?.display_name || profile?.username || "User")
                  : "TEST 모드"}
              </p>
              {isAuthenticated && (
                <p className="text-xs text-gray-500 truncate">
                  @{profile?.username}
                </p>
              )}
            </div>
            
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

