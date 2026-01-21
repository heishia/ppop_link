import { create } from "zustand";
import { profileApi } from "@/lib/api/profile";
import { User, ButtonStyle, FontFamily } from "@/lib/api/auth";
import { useAuthStore } from "./authStore";
import { CACHE_CONFIG } from "@/constants/cache";

// 세션 스토리지 키
const SESSION_STORAGE_PROFILE_KEY = "temp_profile";

// API 에러를 문자열로 변환하는 헬퍼 함수
function parseApiError(error: unknown, fallbackMessage: string): string {
  // axios 에러 타입 가드
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "detail" in error.response.data
  ) {
    const detail = error.response.data.detail;
    if (!detail) return fallbackMessage;

    // 문자열인 경우 그대로 반환
    if (typeof detail === "string") return detail;

    // 배열인 경우 (Pydantic validation error)
    if (Array.isArray(detail)) {
      // msg 필드들을 추출하여 하나의 문자열로 합침
      const messages = detail
        .map((err: { msg?: string }) => err.msg)
        .filter(Boolean);
      return messages.length > 0 ? messages.join(", ") : fallbackMessage;
    }

    // 객체인 경우 msg 필드가 있으면 사용
    if (typeof detail === "object" && detail !== null && "msg" in detail) {
      const msg = (detail as { msg?: string }).msg;
      return msg || fallbackMessage;
    }
  }

  return fallbackMessage;
}

interface ProfileState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  hasFetched: boolean;

  // Actions
  setProfile: (profile: User) => void;
  fetchProfile: (force?: boolean) => Promise<void>;
  updateProfile: (data: {
    display_name?: string;
    bio?: string;
    background_color?: string;
    button_style?: ButtonStyle;
    font_family?: FontFamily;
    contact_email?: string;
    contact_message?: string;
  }) => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<void>;
  uploadProfileImageWithPresignedUrl: (file: File) => Promise<string>;
  uploadBackgroundImage: (file: File) => Promise<void>;
  clearError: () => void;

  // 세션 스토리지 관련
  saveToSessionStorage: (data: Partial<User>) => void;
  loadFromSessionStorage: () => Partial<User> | null;
  clearSessionStorage: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  hasFetched: false,

  setProfile: (profile) =>
    set({ profile, lastFetched: Date.now(), hasFetched: true }),

  fetchProfile: async (force = false) => {
    const { lastFetched } = get();
    const now = Date.now();

    if (!force && lastFetched && now - lastFetched < CACHE_CONFIG.PROFILE) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await profileApi.getProfile();
      set({
        profile: response.data,
        isLoading: false,
        lastFetched: now,
        hasFetched: true,
      });
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to fetch profile"),
        isLoading: false,
        hasFetched: true,
      });
    }
  },

  updateProfile: async (data) => {
    const { isAuthenticated } = useAuthStore.getState();

    // 비로그인 상태면 세션 스토리지에 저장
    if (!isAuthenticated) {
      const currentProfile = get().profile;
      const tempProfile = {
        ...currentProfile,
        ...data,
      } as Partial<User>;
      get().saveToSessionStorage(tempProfile);
      set({ profile: tempProfile as User });
      return;
    }

    // 로그인 상태면 서버에 저장
    set({ isLoading: true, error: null });
    try {
      const response = await profileApi.updateProfile(data);
      set({ profile: response.data, isLoading: false });
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to update profile"),
        isLoading: false,
      });
      throw error;
    }
  },

  updateTheme: async (theme) => {
    try {
      const response = await profileApi.updateTheme({ theme });
      set({ profile: response.data });
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to update theme"),
      });
      throw error;
    }
  },

  uploadProfileImage: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const response = await profileApi.uploadProfileImage(file);
      // 캐시 버스팅을 위해 타임스탬프 추가
      const urlWithCacheBust = response.url.includes("?")
        ? `${response.url}&t=${Date.now()}`
        : `${response.url}?t=${Date.now()}`;
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, profile_image_url: urlWithCacheBust }
          : null,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to upload image"),
        isLoading: false,
      });
      throw error;
    }
  },

  uploadProfileImageWithPresignedUrl: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const { signed_url, public_url } =
        await profileApi.getPresignedUploadUrl();

      await profileApi.uploadToPresignedUrl(signed_url, file);

      const response = await profileApi.confirmProfileImageUpload(public_url);

      // 캐시 버스팅을 위해 타임스탬프 추가
      const profile = response.data;
      if (profile?.profile_image_url) {
        const url = profile.profile_image_url;
        profile.profile_image_url = url.includes("?")
          ? `${url}&t=${Date.now()}`
          : `${url}?t=${Date.now()}`;
      }

      set((state) => ({
        profile: profile || state.profile,
        isLoading: false,
      }));

      return public_url;
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to upload image"),
        isLoading: false,
      });
      throw error;
    }
  },

  uploadBackgroundImage: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const response = await profileApi.uploadBackgroundImage(file);
      // 캐시 버스팅을 위해 타임스탬프 추가
      const urlWithCacheBust = response.url.includes("?")
        ? `${response.url}&t=${Date.now()}`
        : `${response.url}?t=${Date.now()}`;
      // Update profile with new background URL
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, background_image_url: urlWithCacheBust }
          : null,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to upload background"),
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  // 세션 스토리지 관련 메서드
  saveToSessionStorage: (data: Partial<User>) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_PROFILE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save profile to session storage:", error);
    }
  },

  loadFromSessionStorage: () => {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to load profile from session storage:", error);
      return null;
    }
  },

  clearSessionStorage: () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_PROFILE_KEY);
    } catch (error) {
      console.error("Failed to clear profile from session storage:", error);
    }
  },
}));
