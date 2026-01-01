"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { Avatar } from "@/components/ui/Avatar";

export function Header() {
  const { logout, isAuthenticated } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();

  // 프로필 정보 로드
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
      // authStore에서 finally 블록에서 처리하므로 여기서는 추가 처리 불필요
    }
  };

  const handleLogin = () => {
    window.location.href = "/";
  };

  return (
    <header className="flex h-14 items-center justify-end border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        {/* TEST 모드 배지 (비로그인 시에만) */}
        {!isAuthenticated && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-xs font-semibold text-blue-600">TEST 모드</span>
          </div>
        )}

        {/* 로그인 버튼 (비로그인 시) */}
        {!isAuthenticated && (
          <button
            onClick={handleLogin}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            로그인
          </button>
        )}

        {/* 프로필 사진 (로그인 시) */}
        {isAuthenticated && (
          <Avatar
            src={profile?.profile_image_url || "/avatar-placeholder.jpg"}
            alt={profile?.username || "User"}
            size={32}
          />
        )}

        {/* 유저 이름 (로그인 시) */}
        {isAuthenticated && (
          <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
            {profile?.display_name || profile?.username || "User"}
          </span>
        )}

        {/* 로그아웃 버튼 (로그인 시) */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
