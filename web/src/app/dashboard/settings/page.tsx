"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/profileStore";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { DEFAULT_BACKGROUND_COLOR } from "@/lib/constants/colors";
import { FONT_OPTIONS, getGoogleFontUrl } from "@/lib/constants/fonts";
import { FontFamily } from "@/lib/api/auth";

// localStorage 키
const DRAFT_STORAGE_KEY = "profile_draft";

// 임시저장 데이터 타입
interface DraftData {
  display_name: string;
  bio: string;
  background_color: string;
  font_family: FontFamily;
  savedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile, isLoading, error: _error, fetchProfile, updateProfile, uploadProfileImage } =
    useProfileStore();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR);
  const [fontFamily, setFontFamily] = useState<FontFamily>("default");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error" | "draft"; text: string } | null>(null);
  
  const [originalData, setOriginalData] = useState<{
    display_name: string;
    bio: string;
    background_color: string;
    font_family: FontFamily;
  } | null>(null);
  
  // dirty state (변경사항 있는지)
  const [isDirty, setIsDirty] = useState(false);
  
  // 임시저장 데이터 존재 여부
  const [_hasDraft, setHasDraft] = useState(false);
  
  // 라우터 변경 감지용
  const isNavigating = useRef(false);

  // 프로필 데이터 로드
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // localStorage에서 임시저장 데이터 로드
  useEffect(() => {
    const loadDraft = () => {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const draft: DraftData = JSON.parse(savedDraft);
          setHasDraft(true);
          return draft;
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
      return null;
    };

    const draft = loadDraft();
    
    if (profile) {
      const serverData = {
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        background_color: profile.background_color || DEFAULT_BACKGROUND_COLOR,
        font_family: (profile.font_family || "default") as FontFamily,
      };
      
      setOriginalData(serverData);
      
      if (draft) {
        setDisplayName(draft.display_name);
        setBio(draft.bio);
        setBackgroundColor(draft.background_color);
        setFontFamily(draft.font_family || "default");
        
        const hasChanges = 
          draft.display_name !== serverData.display_name ||
          draft.bio !== serverData.bio ||
          draft.background_color !== serverData.background_color ||
          (draft.font_family || "default") !== serverData.font_family;
        setIsDirty(hasChanges);
        
        if (hasChanges) {
          setSaveMessage({ 
            type: "draft", 
            text: `Unsaved draft loaded (saved at ${new Date(draft.savedAt).toLocaleTimeString()})` 
          });
        }
      } else {
        setDisplayName(serverData.display_name);
        setBio(serverData.bio);
        setBackgroundColor(serverData.background_color);
        setFontFamily(serverData.font_family);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (originalData) {
      const hasChanges = 
        displayName !== originalData.display_name ||
        bio !== originalData.bio ||
        backgroundColor !== originalData.background_color ||
        fontFamily !== originalData.font_family;
      setIsDirty(hasChanges);
    }
  }, [displayName, bio, backgroundColor, fontFamily, originalData]);

  const saveDraft = useCallback(() => {
    try {
      const draft: DraftData = {
        display_name: displayName,
        bio: bio,
        background_color: backgroundColor,
        font_family: fontFamily,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setHasDraft(true);
      setSaveMessage({ type: "draft", text: "Draft saved temporarily (Press Save to upload)" });
      
      setTimeout(() => {
        setSaveMessage((prev) => prev?.type === "draft" ? null : prev);
      }, 3000);
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  }, [displayName, bio, backgroundColor, fontFamily]);

  // 임시저장 삭제
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    } catch (e) {
      console.error("Failed to clear draft:", e);
    }
  }, []);

  // 엔터 키로 임시저장 (Textarea 제외)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      saveDraft();
    }
  }, [saveDraft]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateProfile({
        display_name: displayName || undefined,
        bio: bio || undefined,
        background_color: backgroundColor,
        font_family: fontFamily,
      });
      
      clearDraft();
      setOriginalData({
        display_name: displayName,
        bio: bio,
        background_color: backgroundColor,
        font_family: fontFamily,
      });
      setIsDirty(false);
      
      setSaveMessage({ type: "success", text: "Settings saved successfully!" });
    } catch {
      setSaveMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // 프로필 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadProfileImage(file);
      setSaveMessage({ type: "success", text: "Profile image updated!" });
    } catch {
      setSaveMessage({ type: "error", text: "Failed to upload image. Please try again." });
    }
  };

  const _handleCancel = () => {
    if (originalData) {
      setDisplayName(originalData.display_name);
      setBio(originalData.bio);
      setBackgroundColor(originalData.background_color);
      setFontFamily(originalData.font_family);
      clearDraft();
      setIsDirty(false);
      setSaveMessage(null);
    }
  };

  // 페이지 이탈 경고 (브라우저 이탈)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 페이지 이탈 경고 (앱 내 네비게이션) - popstate 이벤트 사용
  useEffect(() => {
    const handlePopState = () => {
      if (isDirty && !isNavigating.current) {
        const confirmed = window.confirm(
          "You have unsaved changes. Are you sure you want to leave without saving?"
        );
        if (!confirmed) {
          // 뒤로가기 취소 - 현재 상태 다시 push
          window.history.pushState(null, "", window.location.href);
        }
      }
    };

    // 초기 상태 push (뒤로가기 감지용)
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);

  // 링크 클릭 시 확인
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor && isDirty && !isNavigating.current) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("/") && !href.startsWith(window.location.pathname)) {
          e.preventDefault();
          const confirmed = window.confirm(
            "You have unsaved changes. Are you sure you want to leave without saving?"
          );
          if (confirmed) {
            isNavigating.current = true;
            router.push(href);
          }
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isDirty, router]);

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-24" onKeyDown={handleKeyDown}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Customize your profile and appearance</p>
      </div>

      {/* 성공/에러/임시저장 메시지 */}
      {saveMessage && (
        <div
          className={`rounded-lg p-4 ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800"
              : saveMessage.type === "error"
              ? "bg-red-50 text-red-800"
              : "bg-yellow-50 text-yellow-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* 프로필 이미지 섹션 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile Image</h2>
        <div className="flex items-center gap-6">
          <Avatar
            src={profile?.profile_image_url || "/avatar-placeholder.jpg"}
            alt={profile?.display_name || profile?.username || "Profile"}
            size={80}
          />
          <div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
                Change Image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, GIF (max 5MB)
            </p>
          </div>
        </div>
      </section>

      {/* 기본 정보 섹션 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
        <p className="mb-4 text-xs text-gray-500">
          Press Enter to save draft temporarily. Click &quot;Save Changes&quot; to upload to server.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={100}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Bio
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onKeyDown={(e) => {
                // Textarea에서 Ctrl+Enter로 임시저장
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  saveDraft();
                }
              }}
              placeholder="Tell us about yourself (Ctrl+Enter to save draft)"
              maxLength={500}
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-500">
              {bio.length}/500 characters
            </p>
          </div>
        </div>
      </section>

      {/* 배경색 섹션 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Background Color</h2>
        <p className="mb-4 text-sm text-gray-600">
          Choose a pastel background color for your profile page
        </p>

        <ColorPicker
          selectedColor={backgroundColor}
          onColorSelect={(color) => {
            setBackgroundColor(color);
            setTimeout(() => saveDraft(), 100);
          }}
          disabled={isSaving}
        />
      </section>

      {/* 글꼴 섹션 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Font</h2>
        <p className="mb-4 text-sm text-gray-600">
          Choose a font for your profile page
        </p>

        {FONT_OPTIONS.map((option) => {
          const googleFontUrl = getGoogleFontUrl(option.value);
          return (
            <React.Fragment key={option.value}>
              {googleFontUrl && (
                <link href={googleFontUrl} rel="stylesheet" />
              )}
            </React.Fragment>
          );
        })}

        <div className="grid grid-cols-2 gap-3">
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFontFamily(option.value);
                setTimeout(() => saveDraft(), 100);
              }}
              disabled={isSaving}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                fontFamily === option.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                fontFamily: option.value === "default" ? "Iseoyun, sans-serif" : `"${option.value}", sans-serif`,
              }}
            >
              <span className="block text-lg font-medium">{option.label}</span>
              <span className="block text-sm text-gray-500 mt-1">가나다 ABC 123</span>
            </button>
          ))}
        </div>
      </section>

      {/* 플로팅 저장 버튼 (오른쪽 하단) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 rounded-full shadow-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
