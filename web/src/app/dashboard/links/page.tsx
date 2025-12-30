"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLinksStore } from "@/store/linksStore";
import { useProfileStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { LinkItem } from "@/components/dashboard/LinkItem";
import { LinkPreview } from "@/components/dashboard/LinkPreview";
import {
  SocialPlatformIcon,
  SOCIAL_PLATFORMS,
} from "@/components/ui/SocialPlatformIcon";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PASTEL_COLORS } from "@/lib/constants/colors";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { ButtonStyle } from "@/lib/api/auth";

// 버튼 스타일 옵션 정의
const BUTTON_STYLES: { id: ButtonStyle; label: string; description: string }[] =
  [
    { id: "default", label: "기본", description: "컬러 배경" },
    { id: "outline", label: "외곽선", description: "흰 배경 + 검은 테두리" },
    { id: "filled", label: "채움", description: "검은 배경" },
  ];

// 버튼 스타일 미리보기용 클래스
const BUTTON_STYLE_PREVIEW: Record<ButtonStyle, string> = {
  default: "bg-primary text-white text-[10px]",
  outline: "bg-white text-gray-900 border border-gray-900 text-[10px]",
  filled: "bg-gray-900 text-white text-[10px]",
};

// SNS 아이콘 최대 개수 제한
const MAX_SOCIAL_ICONS = 5;

// 링크 최대 개수 제한
const MAX_LINKS = 6;

// 다중 선택 소셜 링크 상태 타입
interface SelectedPlatform {
  platform: string;
  url: string;
}

export default function LinksPage() {
  const {
    links,
    socialLinks,
    isLoading,
    error,
    fetchLinks,
    fetchSocialLinks,
    createLink,
    clearError,
    createSocialLink,
    updateSocialLink,
    deleteSocialLink,
  } = useLinksStore();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    fetchProfile,
    updateProfile,
    uploadProfileImage,
    clearError: clearProfileError,
  } = useProfileStore();

  // 프로필 이미지 업로드를 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 링크 추가 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    url?: string;
  }>({});

  // 프로필 폼 상태
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    background_color: "#ffffff",
    button_style: "default" as ButtonStyle,
  });

  // 원본 프로필 데이터 (dirty state 비교용)
  const [originalFormData, setOriginalFormData] = useState({
    display_name: "",
    bio: "",
    background_color: "#ffffff",
    button_style: "default" as ButtonStyle,
  });

  // 프로필 저장 관련 상태
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 다중 선택된 플랫폼 상태
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    SelectedPlatform[]
  >([]);

  // 편집 중인 소셜 링크 상태
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState("");

  // 저장 중 상태 (개별 필드별)
  const [savingField, setSavingField] = useState<string | null>(null);

  // 이미지 크롭 모달 상태
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  // 이미지 업로드 완료 상태
  const [imageUploadComplete, setImageUploadComplete] = useState(false);

  // 로그인 확인 모달 상태
  const [isLoginConfirmOpen, setIsLoginConfirmOpen] = useState(false);

  // 링크 복사 상태
  const [isCopied, setIsCopied] = useState(false);

  // 공개 프로필 URL 상태
  const [publicProfileUrl, setPublicProfileUrl] = useState("");

  // 공유 링크 발급 핸들러 (로그인 필요)
  const handleGetShareLink = async () => {
    if (!isAuthenticated) {
      // 비로그인 상태면 로그인 페이지로 이동
      const { startOAuthLogin } = useAuthStore.getState();
      await startOAuthLogin();
      return;
    }

    try {
      const { profileApi } = await import("@/lib/api/profile");
      const response = await profileApi.getShareLink();
      const shareUrl = `${window.location.origin}${response.share_url}`;
      setPublicProfileUrl(shareUrl);
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to get share link:", error);
      setProfileSaveMessage({
        type: "error",
        text: "Failed to get share link. Please try again.",
      });
    }
  };

  // 링크 복사 핸들러
  const handleCopyLink = async () => {
    if (!publicProfileUrl) {
      // 공유 링크가 없으면 발급 시도
      await handleGetShareLink();
      return;
    }

    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // 내 페이지 새 탭에서 열기
  const handleOpenMyPage = () => {
    if (!publicProfileUrl) {
      // 공유 링크가 없으면 발급 시도
      handleGetShareLink();
      return;
    }
    window.open(publicProfileUrl, "_blank");
  };

  const { isAuthenticated } = useAuthStore();
  const { loadFromSessionStorage } = useProfileStore();
  const { loadLinksFromSessionStorage } = useLinksStore();

  useEffect(() => {
    if (isAuthenticated) {
      // 로그인 상태면 서버에서 데이터 가져오기
      fetchLinks();
      fetchSocialLinks();
      fetchProfile();
    } else {
      // 비로그인 상태면 세션 스토리지에서 데이터 로드
      const tempProfile = loadFromSessionStorage();
      if (tempProfile) {
        setFormData({
          display_name: tempProfile.display_name || "",
          bio: tempProfile.bio || "",
          background_color: tempProfile.background_color || "#ffffff",
          button_style: (tempProfile.button_style || "default") as ButtonStyle,
        });
        setOriginalFormData({
          display_name: tempProfile.display_name || "",
          bio: tempProfile.bio || "",
          background_color: tempProfile.background_color || "#ffffff",
          button_style: (tempProfile.button_style || "default") as ButtonStyle,
        });
      }
      loadLinksFromSessionStorage();
    }
  }, [isAuthenticated, fetchLinks, fetchSocialLinks, fetchProfile, loadFromSessionStorage, loadLinksFromSessionStorage]);

  // 프로필 텍스트 필드만 의존성으로 사용 (이미지 업로드 시 formData 리셋 방지)
  // 이미지 URL 변경은 formData와 무관하므로 해당 필드들만 감시
  useEffect(() => {
    if (profile) {
      const data = {
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        background_color: profile.background_color || "#ffffff",
        button_style: (profile.button_style || "default") as ButtonStyle,
      };
      setFormData(data);
      setOriginalFormData(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.display_name,
    profile?.bio,
    profile?.background_color,
    profile?.button_style,
  ]);

  // 공개 프로필 URL 설정 (클라이언트에서만, public_link_id 기반)
  useEffect(() => {
    if (profile?.public_link_id) {
      setPublicProfileUrl(
        `${window.location.origin}/${profile.public_link_id}`
      );
    }
  }, [profile?.public_link_id]);

  // dirty state 계산 (프로필 변경사항 있는지)
  const isProfileDirty =
    formData.display_name !== originalFormData.display_name ||
    formData.bio !== originalFormData.bio ||
    formData.background_color !== originalFormData.background_color ||
    formData.button_style !== originalFormData.button_style;

  const validateForm = () => {
    const errors: { title?: string; url?: string } = {};

    if (!newLink.title.trim()) {
      errors.title = "제목을 입력해주세요";
    }

    if (!newLink.url.trim()) {
      errors.url = "URL을 입력해주세요";
    } else if (!/^https?:\/\/.+/.test(newLink.url)) {
      errors.url = "URL은 http:// 또는 https://로 시작해야 합니다";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateLink = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createLink(newLink);
      setIsModalOpen(false);
      setNewLink({ title: "", url: "" });
      setFormErrors({});
    } catch (error) {
      console.error("Failed to create link:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewLink({ title: "", url: "" });
    setFormErrors({});
    clearError();
  };

  // 배경 색상 변경 (로컬 상태만 업데이트)
  const handleBackgroundColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, background_color: color }));
  };

  // 프로필 저장 핸들러 (모든 필드 한번에 저장)
  const handleSaveProfile = async () => {
    if (isProfileSaving || !isProfileDirty) return;

    // 비로그인 상태면 로그인 확인 모달 표시
    if (!isAuthenticated) {
      setIsLoginConfirmOpen(true);
      return;
    }

    setIsProfileSaving(true);
    setProfileSaveMessage(null);
    clearProfileError();

    try {
      await updateProfile({
        display_name: formData.display_name || undefined,
        bio: formData.bio || undefined,
        background_color: formData.background_color,
        button_style: formData.button_style,
      });

      // 저장 성공 시 원본 데이터 업데이트
      setOriginalFormData({ ...formData });
      setProfileSaveMessage({
        type: "success",
        text: "Profile saved successfully!",
      });

      // 3초 후 메시지 숨기기
      setTimeout(() => {
        setProfileSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setProfileSaveMessage({
        type: "error",
        text: "Failed to save profile. Please try again.",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  // 로그인 확인 후 OAuth 로그인 시작
  const handleLoginConfirm = async () => {
    const { startOAuthLogin } = useAuthStore.getState();
    await startOAuthLogin();
  };

  // 소셜 링크 추가 저장 (개별)
  const handleSaveSocialLink = async (platform: SelectedPlatform) => {
    if (!platform.url.trim()) return;
    setSavingField(`social-${platform.platform}`);
    try {
      await createSocialLink({
        platform: platform.platform,
        url: platform.url,
      });
      // 저장 성공 시 해당 플랫폼 선택 목록에서 제거
      setSelectedPlatforms((prev) =>
        prev.filter((p) => p.platform !== platform.platform)
      );
    } catch (error) {
      console.error("Failed to save social link:", error);
    } finally {
      setSavingField(null);
    }
  };

  // 현재 총 SNS 아이콘 개수 (저장된 것 + 선택 중인 것)
  const totalSocialCount = socialLinks.length + selectedPlatforms.length;
  const canAddMoreSocial = totalSocialCount < MAX_SOCIAL_ICONS;

  // 플랫폼 토글 선택/해제
  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const existing = prev.find((p) => p.platform === platformId);
      if (existing) {
        // 이미 선택된 경우 해제
        return prev.filter((p) => p.platform !== platformId);
      } else {
        // 최대 개수 체크 (기존 + 선택 중인 것 합쳐서 5개까지)
        if (socialLinks.length + prev.length >= MAX_SOCIAL_ICONS) {
          return prev;
        }
        return [...prev, { platform: platformId, url: "" }];
      }
    });
  };

  // 선택된 플랫폼의 URL 업데이트
  const handleUpdateSelectedUrl = (platformId: string, url: string) => {
    setSelectedPlatforms((prev) =>
      prev.map((p) => (p.platform === platformId ? { ...p, url } : p))
    );
  };

  // 소셜 링크 업데이트 (기존 링크)
  const handleUpdateSocialLink = async (id: string) => {
    setSavingField(`edit-${id}`);
    try {
      await updateSocialLink(id, { url: editingUrl });
      setEditingSocialId(null);
      setEditingUrl("");
    } catch (error) {
      console.error("Failed to update social link:", error);
    } finally {
      setSavingField(null);
    }
  };

  // 소셜 링크 활성화/비활성화 토글
  const handleToggleSocialLink = async (id: string, currentActive: boolean) => {
    try {
      await updateSocialLink(id, { is_active: !currentActive });
    } catch (error) {
      console.error("Failed to toggle social link:", error);
    }
  };

  // 소셜 링크 삭제
  const handleDeleteSocialLink = async (id: string) => {
    try {
      await deleteSocialLink(id);
    } catch (error) {
      console.error("Failed to delete social link:", error);
    }
  };

  // 파일 선택 시 크롭 모달 열기
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일을 Data URL로 변환하여 크롭 모달에 전달
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // input 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 크롭 완료 후 이미지 업로드
  const handleCroppedImageUpload = async (croppedBlob: Blob) => {
    setSavingField("profile_image");
    setImageUploadComplete(false);
    try {
      // Blob을 File로 변환
      const file = new File([croppedBlob], "profile.jpg", {
        type: "image/jpeg",
      });
      await uploadProfileImage(file);
      // 업로드 성공 표시
      setImageUploadComplete(true);
      // 3초 후 완료 메시지 숨기기
      setTimeout(() => {
        setImageUploadComplete(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to upload profile image:", error);
    } finally {
      setSavingField(null);
    }
  };

  // 크롭 모달 닫기
  const handleCloseCropModal = () => {
    setIsCropModalOpen(false);
    setSelectedImageSrc(null);
  };

  // 미리보기용 프로필 객체 (로컬 formData 반영)
  const previewProfile = useMemo(() => {
    if (!profile) return null;
    return {
      ...profile,
      display_name: formData.display_name,
      bio: formData.bio,
      background_color: formData.background_color,
      button_style: formData.button_style,
    };
  }, [
    profile,
    formData.display_name,
    formData.bio,
    formData.background_color,
    formData.button_style,
  ]);

  // 이미 추가된 플랫폼 목록
  const addedPlatforms = socialLinks.map((link) => link.platform.toLowerCase());

  // 추가 가능한 플랫폼 (아직 추가되지 않은 것들)
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    (p) => !addedPlatforms.includes(p.id)
  );

  // 모바일 여부 확인
  const isMobile = useIsMobile();

  // 모바일 미리보기 모달 상태
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // 미리보기용 소셜 링크 (기존 + 선택 중인 것 합침, 최대 5개까지만)
  const previewSocialLinks = [
    ...socialLinks,
    ...selectedPlatforms.map((p, idx) => ({
      id: `preview-${p.platform}-${idx}`,
      user_id: "",
      platform: p.platform,
      url: p.url || `https://${p.platform}.com`,
      is_active: true,
      display_order: socialLinks.length + idx,
      created_at: new Date().toISOString(),
      updated_at: null,
    })),
  ].slice(0, MAX_SOCIAL_ICONS);

  // 미리보기용 링크 (기존 + 모달에서 입력 중인 것 합침)
  const previewLinks = [
    ...links,
    // 모달이 열려있고 제목과 URL이 있을 때만 미리보기에 추가
    ...(isModalOpen && newLink.title.trim()
      ? [
          {
            id: `preview-new-link`,
            user_id: "",
            title: newLink.title,
            url: newLink.url || "#",
            thumbnail_url: null,
            display_order: links.length,
            is_active: true,
            click_count: 0,
            created_at: new Date().toISOString(),
            updated_at: null,
          },
        ]
      : []),
  ];

  if ((isLoading || profileLoading) && links.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // ========== 모바일 레이아웃 ==========
  if (isMobile) {
    return (
      <div className="px-4 py-3 space-y-4 pb-24">
        {(error || profileError) && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error || profileError}
          </div>
        )}

        {/* 프로필 설정 카드 - 모바일 */}
        <Card>
          {profileSaveMessage && (
            <div
              className={`mx-4 mt-3 rounded p-2 text-sm ${
                profileSaveMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {profileSaveMessage.text}
            </div>
          )}
          <CardContent className="p-4 space-y-4">
            {/* 프로필 이미지 영역 */}
            <div className="flex items-center gap-4">
              <Avatar
                src={profile?.profile_image_url || "/avatar-placeholder.jpg"}
                alt={profile?.username || "User"}
                size={64}
              />
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  className="text-sm w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={savingField === "profile_image"}
                >
                  {savingField === "profile_image"
                    ? "Uploading..."
                    : "Upload Photo"}
                </Button>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    JPG, PNG, GIF (max 5MB)
                  </p>
                  {imageUploadComplete && (
                    <span className="text-xs text-green-600 font-medium">
                      Done!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 표시 이름 */}
            <Input
              label="표시 이름"
              value={formData.display_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  display_name: e.target.value,
                }))
              }
              placeholder="이름을 입력하세요"
              disabled={isProfileSaving}
            />

            {/* 소개 */}
            <Textarea
              label="소개"
              value={formData.bio}
              onChange={(e) => {
                const lines = e.target.value.split("\n");
                if (lines.length <= 3) {
                  setFormData((prev) => ({ ...prev, bio: e.target.value }));
                }
              }}
              placeholder="자기소개를 작성하세요 (최대 3줄)"
              rows={3}
              maxLength={150}
              disabled={isProfileSaving}
            />

            {/* 배경 색상 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                배경 색상
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PASTEL_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleBackgroundColorChange(color.hex)}
                    disabled={isProfileSaving}
                    className={`h-10 w-10 rounded-lg border-2 transition-all ${
                      formData.background_color.toLowerCase() ===
                      color.hex.toLowerCase()
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-gray-200"
                    } ${isProfileSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.nameKo}
                  />
                ))}
              </div>
            </div>

            {/* 버튼 스타일 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                버튼 스타일
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUTTON_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        button_style: style.id,
                      }))
                    }
                    disabled={isProfileSaving}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                      formData.button_style === style.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-gray-200"
                    } ${isProfileSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`w-full rounded-md px-2 py-1.5 text-center ${BUTTON_STYLE_PREVIEW[style.id]}`}
                    >
                      Button
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 프로필 저장 버튼 */}
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={isProfileSaving || !isProfileDirty}
                className="w-full"
              >
                {isProfileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SNS 아이콘 설정 카드 - 모바일 */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              SNS ({socialLinks.length}/{MAX_SOCIAL_ICONS})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {/* 기존 소셜 링크 목록 */}
            {socialLinks.length > 0 && (
              <div className="space-y-2">
                {socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <SocialPlatformIcon
                      platform={link.platform}
                      size="sm"
                      showBackground
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {SOCIAL_PLATFORMS.find(
                          (p) => p.id === link.platform.toLowerCase()
                        )?.name || link.platform}
                      </div>
                      {editingSocialId === link.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="url"
                            value={editingUrl}
                            onChange={(e) => setEditingUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleUpdateSocialLink(link.id);
                              } else if (e.key === "Escape") {
                                setEditingSocialId(null);
                                setEditingUrl("");
                              }
                            }}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="https://..."
                            disabled={savingField === `edit-${link.id}`}
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateSocialLink(link.id)}
                            disabled={savingField === `edit-${link.id}`}
                            className="text-xs text-blue-600 font-medium"
                          >
                            {savingField === `edit-${link.id}` ? "..." : "OK"}
                          </button>
                        </div>
                      ) : (
                        <div
                          className="text-xs text-gray-500 truncate"
                          onClick={() => {
                            setEditingSocialId(link.id);
                            setEditingUrl(link.url);
                          }}
                        >
                          {link.url}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.is_active}
                        onChange={() =>
                          handleToggleSocialLink(link.id, link.is_active)
                        }
                        label=""
                      />
                      <button
                        onClick={() => handleDeleteSocialLink(link.id)}
                        className="text-xs text-red-500 p-1"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 플랫폼 선택 그리드 */}
            {availablePlatforms.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  추가할 SNS 선택{" "}
                  {!canAddMoreSocial && (
                    <span className="text-red-500">(MAX)</span>
                  )}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {availablePlatforms.map((platform) => {
                    const isSelected = selectedPlatforms.some(
                      (p) => p.platform === platform.id
                    );
                    const isDisabled = !isSelected && !canAddMoreSocial;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => handleTogglePlatform(platform.id)}
                        disabled={isDisabled}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : isDisabled
                              ? "border-gray-100 bg-gray-50 opacity-40"
                              : "border-gray-200 bg-white"
                        }`}
                      >
                        <SocialPlatformIcon
                          platform={platform.id}
                          size="sm"
                          showBackground
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 선택된 플랫폼 URL 입력 */}
            {selectedPlatforms.length > 0 && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-700">
                  URL 입력 ({selectedPlatforms.length}개 선택)
                </p>
                {selectedPlatforms.map((selected) => {
                  const isSavingThis =
                    savingField === `social-${selected.platform}`;
                  return (
                    <div
                      key={selected.platform}
                      className="flex items-center gap-2"
                    >
                      <SocialPlatformIcon
                        platform={selected.platform}
                        size="sm"
                        showBackground
                      />
                      <input
                        type="url"
                        value={selected.url}
                        onChange={(e) =>
                          handleUpdateSelectedUrl(
                            selected.platform,
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveSocialLink(selected);
                          }
                        }}
                        placeholder={`https://${selected.platform}.com/...`}
                        className="flex-1 rounded border border-blue-300 bg-white px-2 py-1.5 text-sm"
                        disabled={isSavingThis}
                      />
                      {isSavingThis ? (
                        <span className="text-xs text-blue-500">...</span>
                      ) : (
                        <button
                          onClick={() =>
                            handleTogglePlatform(selected.platform)
                          }
                          className="text-xs text-red-500 p-1"
                        >
                          X
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 링크 관리 카드 - 모바일 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm">
              링크 ({links.length}/{MAX_LINKS})
            </CardTitle>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={links.length >= MAX_LINKS}
              className={`rounded px-3 py-1.5 text-xs text-white ${
                links.length >= MAX_LINKS
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              + 추가
            </button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {links.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-600 text-sm">아직 링크가 없습니다</p>
                <p className="mt-1 text-xs text-gray-500">
                  &quot;+ 추가&quot; 버튼을 클릭해서 시작하세요
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <LinkItem key={link.id} link={link} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 내 페이지 공유 카드 - 모바일 (최하단) */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">내 페이지 공유</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {/* 공개 URL 표시 */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">내 페이지 주소</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {publicProfileUrl || "Loading..."}
                </p>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1 text-sm whitespace-nowrap"
                onClick={handleCopyLink}
                disabled={!publicProfileUrl}
              >
                {isCopied ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-sm whitespace-nowrap"
                onClick={handleOpenMyPage}
                disabled={!publicProfileUrl}
              >
                <svg
                  className="w-4 h-4 mr-1.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 플로팅 미리보기 버튼 */}
        <button
          onClick={() => setIsPreviewModalOpen(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="text-sm font-medium">미리보기</span>
        </button>

        {/* 링크 추가 모달 */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="새 링크 추가"
        >
          <div className="space-y-4">
            <Input
              label="제목"
              value={newLink.title}
              onChange={(e) =>
                setNewLink((prev) => ({ ...prev, title: e.target.value }))
              }
              error={formErrors.title}
              placeholder="My awesome link"
            />
            <Input
              label="URL"
              value={newLink.url}
              onChange={(e) =>
                setNewLink((prev) => ({ ...prev, url: e.target.value }))
              }
              error={formErrors.url}
              placeholder="https://example.com"
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleCreateLink}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "..." : "추가"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        </Modal>

        {/* 모바일 미리보기 오버레이 */}
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 흐림 배경 */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsPreviewModalOpen(false)}
            />

            {/* 미리보기 컨텐츠 */}
            <div className="relative z-10">
              <LinkPreview
                profile={previewProfile}
                links={previewLinks}
                socialLinks={previewSocialLinks}
                buttonStyle={formData.button_style}
                onShareLinkClick={handleGetShareLink}
              />
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 이미지 크롭 모달 */}
        {selectedImageSrc && (
          <ImageCropModal
            isOpen={isCropModalOpen}
            onClose={handleCloseCropModal}
            imageSrc={selectedImageSrc}
            onCropComplete={handleCroppedImageUpload}
            aspectRatio={1}
          />
        )}

        {/* 로그인 확인 모달 */}
        <ConfirmModal
          isOpen={isLoginConfirmOpen}
          onClose={() => setIsLoginConfirmOpen(false)}
          onConfirm={handleLoginConfirm}
          title="로그인이 필요합니다"
          message="프로필을 저장하려면 로그인이 필요합니다.&#10;지금 로그인하시겠습니까?"
          confirmText="로그인"
          cancelText="취소"
        />
      </div>
    );
  }

  // ========== 데스크톱 레이아웃 ==========
  return (
    <div className="flex gap-4">
      {/* 왼쪽: 설정 영역 */}
      <div className="flex-1 space-y-3 min-w-0">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900">내페이지 수정</h1>
          <p className="text-xs text-gray-600">
            프로필과 링크를 한 곳에서 관리하세요
          </p>
        </div>

        {(error || profileError) && (
          <div className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
            {error || profileError}
          </div>
        )}

        {/* 내 페이지 공유 카드 - 데스크톱 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* 왼쪽: URL 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  내 페이지 공유
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">내 페이지 주소:</span>
                  <span className="text-sm font-medium text-primary truncate">
                    {publicProfileUrl || "Loading..."}
                  </span>
                </div>
              </div>

              {/* 오른쪽: 버튼 영역 */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="primary"
                  className="text-xs px-3 py-2 whitespace-nowrap"
                  onClick={handleCopyLink}
                  disabled={!publicProfileUrl}
                >
                  {isCopied ? (
                    <>
                      <svg
                        className="w-3.5 h-3.5 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3.5 h-3.5 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-2 whitespace-nowrap"
                  onClick={handleOpenMyPage}
                  disabled={!publicProfileUrl}
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Open Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 프로필 설정 카드 */}
        <Card>
          {profileSaveMessage && (
            <div
              className={`mx-4 mb-1 rounded p-1.5 text-xs ${
                profileSaveMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {profileSaveMessage.text}
            </div>
          )}
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* 프로필 정보 */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={
                      profile?.profile_image_url || "/avatar-placeholder.jpg"
                    }
                    alt={profile?.username || "User"}
                    size={48}
                  />
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={savingField === "profile_image"}
                    >
                      {savingField === "profile_image"
                        ? "Uploading..."
                        : "Upload Photo"}
                    </Button>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-[10px] text-gray-500">
                        JPG, PNG, GIF (max 5MB)
                      </p>
                      {imageUploadComplete && (
                        <span className="text-[10px] text-green-600 font-medium">
                          Upload Complete!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Input
                  label="표시 이름"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  placeholder="이름을 입력하세요"
                  disabled={isProfileSaving}
                />

                <Textarea
                  label="소개"
                  value={formData.bio}
                  onChange={(e) => {
                    // 3줄까지만 허용
                    const lines = e.target.value.split("\n");
                    if (lines.length <= 3) {
                      setFormData((prev) => ({ ...prev, bio: e.target.value }));
                    }
                  }}
                  placeholder="자기소개를 작성하세요 (최대 3줄)"
                  rows={3}
                  maxLength={150}
                  disabled={isProfileSaving}
                  className="leading-snug pb-3"
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    배경 색상
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PASTEL_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleBackgroundColorChange(color.hex)}
                        disabled={isProfileSaving}
                        className={`h-8 w-8 rounded-md border-2 transition-all hover:scale-105 ${
                          formData.background_color.toLowerCase() ===
                          color.hex.toLowerCase()
                            ? "border-primary ring-2 ring-primary/30 scale-110"
                            : "border-gray-200 hover:border-gray-300"
                        } ${isProfileSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.nameKo}
                      />
                    ))}
                  </div>
                </div>

                {/* 버튼 스타일 */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    버튼 스타일
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BUTTON_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            button_style: style.id,
                          }))
                        }
                        disabled={isProfileSaving}
                        className={`flex flex-col items-center gap-1 rounded-md border-2 p-2 transition-all hover:scale-[1.02] ${
                          formData.button_style === style.id
                            ? "border-primary ring-1 ring-primary/30"
                            : "border-gray-200 hover:border-gray-300"
                        } ${isProfileSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div
                          className={`w-full rounded px-2 py-1 text-center ${BUTTON_STYLE_PREVIEW[style.id]}`}
                        >
                          Btn
                        </div>
                        <span className="text-[10px] font-medium text-gray-600">
                          {style.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SNS 아이콘 설정 */}
              <div className="flex-1 space-y-2 min-w-0">
                {/* 기존 소셜 링크 목록 */}
                {socialLinks.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {socialLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5"
                      >
                        <SocialPlatformIcon
                          platform={link.platform}
                          size="sm"
                          showBackground
                        />

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-gray-900">
                            {SOCIAL_PLATFORMS.find(
                              (p) => p.id === link.platform.toLowerCase()
                            )?.name || link.platform}
                          </div>
                          {editingSocialId === link.id ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="url"
                                value={editingUrl}
                                onChange={(e) => setEditingUrl(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleUpdateSocialLink(link.id);
                                  } else if (e.key === "Escape") {
                                    setEditingSocialId(null);
                                    setEditingUrl("");
                                  }
                                }}
                                className="flex-1 rounded border border-gray-300 px-1.5 py-0.5 text-[10px]"
                                placeholder="https://... (Enter로 저장)"
                                disabled={savingField === `edit-${link.id}`}
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateSocialLink(link.id)}
                                disabled={savingField === `edit-${link.id}`}
                                className="text-[10px] text-blue-600 hover:text-blue-700 disabled:opacity-50"
                              >
                                {savingField === `edit-${link.id}`
                                  ? "..."
                                  : "OK"}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSocialId(null);
                                  setEditingUrl("");
                                }}
                                className="text-[10px] text-gray-500 hover:text-gray-700"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-500 truncate">
                              {link.url}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {editingSocialId !== link.id && (
                            <button
                              onClick={() => {
                                setEditingSocialId(link.id);
                                setEditingUrl(link.url);
                              }}
                              className="text-[10px] text-gray-400 hover:text-gray-600"
                            >
                              Edit
                            </button>
                          )}
                          <Switch
                            checked={link.is_active}
                            onChange={() =>
                              handleToggleSocialLink(link.id, link.is_active)
                            }
                            label=""
                          />
                          <button
                            onClick={() => handleDeleteSocialLink(link.id)}
                            className="text-[10px] text-red-400 hover:text-red-600"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 플랫폼 다중 선택 그리드 */}
                {availablePlatforms.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">
                      아이콘 추가 (최대 {MAX_SOCIAL_ICONS}개) -{" "}
                      {socialLinks.length}/{MAX_SOCIAL_ICONS}
                      {!canAddMoreSocial && (
                        <span className="ml-1 text-red-500">MAX</span>
                      )}
                    </p>
                    <div className="grid grid-cols-5 gap-1">
                      {availablePlatforms.map((platform) => {
                        const isSelected = selectedPlatforms.some(
                          (p) => p.platform === platform.id
                        );
                        // 최대 개수 도달 시 선택되지 않은 항목은 비활성화
                        const isDisabled = !isSelected && !canAddMoreSocial;
                        return (
                          <button
                            key={platform.id}
                            onClick={() => handleTogglePlatform(platform.id)}
                            disabled={isDisabled}
                            className={`flex flex-col items-center gap-0.5 rounded-lg border p-1 transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                                : isDisabled
                                  ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                            title={
                              isDisabled
                                ? `SNS 아이콘은 최대 ${MAX_SOCIAL_ICONS}개까지 추가할 수 있습니다`
                                : platform.name
                            }
                          >
                            <SocialPlatformIcon
                              platform={platform.id}
                              size="sm"
                              showBackground
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 선택된 플랫폼들의 URL 입력 */}
                {selectedPlatforms.length > 0 && (
                  <div className="space-y-1.5 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-700">
                      URL 입력 후 Enter로 저장 ({selectedPlatforms.length}개
                      선택됨)
                    </p>
                    {selectedPlatforms.map((selected) => {
                      const isSavingThis =
                        savingField === `social-${selected.platform}`;
                      return (
                        <div
                          key={selected.platform}
                          className="flex items-center gap-1.5"
                        >
                          <SocialPlatformIcon
                            platform={selected.platform}
                            size="sm"
                            showBackground
                          />
                          <input
                            type="url"
                            value={selected.url}
                            onChange={(e) =>
                              handleUpdateSelectedUrl(
                                selected.platform,
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveSocialLink(selected);
                              }
                            }}
                            placeholder={`https://${selected.platform}.com/username (Enter로 저장)`}
                            className="flex-1 rounded border border-blue-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none disabled:opacity-50"
                            disabled={isSavingThis}
                          />
                          {isSavingThis ? (
                            <span className="text-xs text-blue-500">
                              저장중...
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleTogglePlatform(selected.platform)
                              }
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              X
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 프로필 저장 버튼 영역 - 카드 하단 오른쪽 (항상 표시, 변경사항 있을 때만 활성화) */}
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                onClick={handleSaveProfile}
                disabled={isProfileSaving || !isProfileDirty}
                className={`rounded px-3 py-1 text-[11px] transition-colors ${
                  isProfileDirty
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isProfileSaving ? "..." : "Save"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 링크 관리 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
            <CardTitle className="text-sm">
              링크 관리 ({links.length}/{MAX_LINKS})
            </CardTitle>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={links.length >= MAX_LINKS}
              className={`rounded px-2 py-1 text-[11px] text-white ${
                links.length >= MAX_LINKS
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
              title={
                links.length >= MAX_LINKS
                  ? `링크는 최대 ${MAX_LINKS}개까지 추가할 수 있습니다`
                  : "새 링크 추가"
              }
            >
              + 추가
            </button>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {links.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-gray-600 text-xs">아직 링크가 없습니다</p>
                <p className="mt-1 text-[10px] text-gray-500">
                  &quot;추가&quot; 버튼을 클릭하여 첫 번째 링크를 만들어보세요
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {links.map((link) => (
                  <LinkItem key={link.id} link={link} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 미리보기 영역 */}
      <div className="hidden lg:block flex-shrink-0">
        <div className="sticky top-4">
          <h2 className="mb-2 text-center text-xs font-medium text-gray-500">
            미리보기
          </h2>
          <LinkPreview
            profile={previewProfile}
            links={previewLinks}
            socialLinks={previewSocialLinks}
            buttonStyle={formData.button_style}
            onShareLinkClick={handleGetShareLink}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="새 링크 추가"
      >
        <div className="space-y-4">
          <Input
            label="제목"
            value={newLink.title}
            onChange={(e) =>
              setNewLink((prev) => ({ ...prev, title: e.target.value }))
            }
            error={formErrors.title}
            placeholder="My awesome link"
          />
          <Input
            label="URL"
            value={newLink.url}
            onChange={(e) =>
              setNewLink((prev) => ({ ...prev, url: e.target.value }))
            }
            error={formErrors.url}
            placeholder="https://example.com"
          />
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleCreateLink}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "생성 중..." : "링크 만들기"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>

      {/* 이미지 크롭 모달 */}
      {selectedImageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={handleCloseCropModal}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCroppedImageUpload}
          aspectRatio={1}
        />
      )}

      {/* 로그인 확인 모달 */}
      <ConfirmModal
        isOpen={isLoginConfirmOpen}
        onClose={() => setIsLoginConfirmOpen(false)}
        onConfirm={handleLoginConfirm}
        title="로그인이 필요합니다"
        message="프로필을 저장하려면 로그인이 필요합니다.&#10;지금 로그인하시겠습니까?"
        confirmText="로그인"
        cancelText="취소"
      />
    </div>
  );
}
