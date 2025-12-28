"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { SocialPlatformIcon } from "@/components/ui/SocialPlatformIcon";
import { Link, SocialLink } from "@/lib/api/links";
import { User, ButtonStyle } from "@/lib/api/auth";
import { DEFAULT_BACKGROUND_COLOR } from "@/lib/constants/colors";
import { X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// 버튼 스타일별 클래스 정의 (미리보기용)
const BUTTON_STYLE_CLASSES: Record<ButtonStyle, string> = {
  // 기본: primary 색상 배경
  default:
    "bg-primary text-white hover:bg-primary/90",
  // 아웃라인: 흰색 배경 + 검은 얇은 외곽선
  outline:
    "bg-white text-gray-900 border border-gray-900 hover:bg-gray-50",
  // 채움: 검은 배경 + 흰 텍스트
  filled:
    "bg-gray-900 text-white hover:bg-gray-800",
};

interface LinkPreviewProps {
  profile: User | null;
  links: Link[];
  socialLinks: SocialLink[];
  buttonStyle?: ButtonStyle;
  onShareLinkClick?: () => void;
}

// 미리보기 전용 컴포넌트 - 대시보드에서 실제 링크 페이지가 어떻게 보일지 표시
export function LinkPreview({ profile, links, socialLinks, buttonStyle }: LinkPreviewProps) {
  const router = useRouter();
  const { subscription } = useAuthStore();
  
  // PRO 사용자 여부 확인
  const isProUser = subscription?.plan === "PRO" && subscription?.status === "ACTIVE" && subscription?.hasAccess;

  // 활성화된 링크만 필터링
  const activeLinks = links.filter((link) => link.is_active);
  // SNS 아이콘은 최대 5개까지만 표시
  const activeSocialLinks = socialLinks
    .filter((link) => link.is_active)
    .slice(0, 5);

  // 사용자가 설정한 배경색 사용 (없으면 기본 화이트)
  const bgColor = profile?.background_color || DEFAULT_BACKGROUND_COLOR;
  // 버튼 스타일 (prop > profile > default 순서로 우선순위)
  const currentButtonStyle = buttonStyle || profile?.button_style || "default";

  // X 버튼 클릭 시 결제 페이지로 이동
  const handleRemoveWatermark = () => {
    router.push("/dashboard/pricing");
  };

  return (
    <div
      className="relative mx-auto h-[600px] w-[280px] overflow-hidden rounded-[40px] border-[8px] border-gray-800 shadow-xl"
      style={{ backgroundColor: bgColor }}
    >
      {/* 모바일 상단 노치 */}
      <div className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-gray-800" />

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="h-full overflow-y-auto pt-8 pb-12">
        <div className="px-4 pb-6">
          {/* 프로필 섹션 */}
          <section className="flex flex-col items-center py-4">
            <Avatar
              src={profile?.profile_image_url || "/avatar-placeholder.jpg"}
              alt={profile?.display_name || profile?.username || "User"}
              className="!h-[60px] !w-[60px]"
            />
            <h2 className="mt-2 text-center text-sm font-bold text-gray-900">
              {profile?.display_name || profile?.username || "Display Name"}
            </h2>
            {profile?.bio && (
              <p className="mt-1 text-center text-xs text-gray-600 line-clamp-2 whitespace-pre-line">
                {profile.bio}
              </p>
            )}
          </section>

          {/* SNS 링크 섹션 */}
          {activeSocialLinks.length > 0 && (
            <section className="py-2">
              <div className="flex items-center justify-center gap-2">
                {activeSocialLinks.map((social) => (
                  <div
                    key={social.id}
                    className="cursor-default transition-transform hover:scale-110"
                  >
                    <SocialPlatformIcon
                      platform={social.platform}
                      size="sm"
                      showBackground
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 링크 섹션 */}
          <section className="flex flex-col gap-2 py-3">
            {activeLinks.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                활성화된 링크가 없습니다
              </div>
            ) : (
              activeLinks.map((link) => (
                <button
                  key={link.id}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-medium shadow-sm transition-all hover:shadow ${BUTTON_STYLE_CLASSES[currentButtonStyle]}`}
                >
                  {link.title}
                </button>
              ))
            )}
          </section>
        </div>
      </div>

      {/* PPOPLINK 워터마크 푸터 - BASIC 사용자용, PRO 사용자는 숨김 */}
      {!isProUser && (
        <footer className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div className="relative group">
            {/* X 버튼 - 클릭 시 결제 페이지로 이동 */}
            <button
              onClick={handleRemoveWatermark}
              className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800/80 text-white opacity-70 transition-all hover:opacity-100 hover:bg-primary"
              title="PRO upgrade to remove watermark"
            >
              <X className="h-3 w-3" />
            </button>

            {/* PPOPLINK 로고 */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-1 text-sm font-extrabold text-primary/60 transition-all hover:text-primary hover:scale-105"
            >
              PPOPLINK
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
