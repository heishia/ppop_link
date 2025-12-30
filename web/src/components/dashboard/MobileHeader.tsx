"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { Avatar } from "@/components/ui/Avatar";

export function MobileHeader() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // API 실패해도 로컬 토큰 삭제하고 로그인 페이지로
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      router.replace("/login");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        {/* 왼쪽: 빈 공간 (균형용) */}
        <div className="w-8" />

        {/* 가운데: 로고 */}
        <Link href="/" className="text-lg font-extrabold text-primary">
          PPOPLINK
        </Link>

        {/* 오른쪽: 프로필 메뉴 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="relative flex items-center"
        >
          <Avatar
            src={profile?.profile_image_url || "/avatar-placeholder.jpg"}
            alt={profile?.username || "User"}
            size={32}
          />
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
                {profile?.display_name || profile?.username || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                @{profile?.username}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </>
  );
}

