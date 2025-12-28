import { create } from "zustand";
import { linksApi, Link, SocialLink } from "@/lib/api/links";
import { useAuthStore } from "./authStore";

// 세션 스토리지 키
const SESSION_STORAGE_LINKS_KEY = "temp_links";
const SESSION_STORAGE_SOCIAL_LINKS_KEY = "temp_social_links";

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

interface LinksState {
  links: Link[];
  socialLinks: SocialLink[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLinks: () => Promise<void>;
  fetchSocialLinks: () => Promise<void>;
  createLink: (data: { title: string; url: string }) => Promise<void>;
  updateLink: (
    linkId: string,
    data: { title?: string; url?: string; is_active?: boolean }
  ) => Promise<void>;
  deleteLink: (linkId: string) => Promise<void>;
  reorderLinks: (linkIds: string[]) => Promise<void>;
  createSocialLink: (data: { platform: string; url: string }) => Promise<void>;
  updateSocialLink: (
    socialLinkId: string,
    data: { url?: string; is_active?: boolean }
  ) => Promise<void>;
  deleteSocialLink: (socialLinkId: string) => Promise<void>;
  clearError: () => void;
  
  // 세션 스토리지 관련
  saveLinksToSessionStorage: () => void;
  loadLinksFromSessionStorage: () => void;
  clearLinksSessionStorage: () => void;
  syncLinksDataToServer: () => Promise<void>;
}

export const useLinksStore = create<LinksState>((set, get) => ({
  links: [],
  socialLinks: [],
  isLoading: false,
  error: null,

  fetchLinks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await linksApi.getLinks();
      set({ links: response.data, isLoading: false });
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to fetch links"),
        isLoading: false,
      });
    }
  },

  fetchSocialLinks: async () => {
    try {
      const response = await linksApi.getSocialLinks();
      set({ socialLinks: response.data });
    } catch (error: unknown) {
      console.error("Failed to fetch social links:", error);
    }
  },

  createLink: async (data) => {
    const { isAuthenticated } = useAuthStore.getState();
    
    // 비로그인 상태면 세션 스토리지에 저장
    if (!isAuthenticated) {
      const tempLink: Link = {
        id: `temp_${Date.now()}_${Math.random()}`,
        user_id: "",
        title: data.title,
        url: data.url,
        thumbnail_url: null,
        display_order: get().links.length,
        is_active: true,
        click_count: 0,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      
      set((state) => ({
        links: [...state.links, tempLink],
      }));
      
      get().saveLinksToSessionStorage();
      return;
    }
    
    // 로그인 상태면 서버에 저장
    set({ isLoading: true, error: null });
    try {
      const response = await linksApi.createLink(data);
      set((state) => ({
        links: [...state.links, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to create link"),
        isLoading: false,
      });
      throw error;
    }
  },

  updateLink: async (linkId, data) => {
    try {
      const response = await linksApi.updateLink(linkId, data);
      set((state) => ({
        links: state.links.map((link) =>
          link.id === linkId ? response.data : link
        ),
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to update link"),
      });
      throw error;
    }
  },

  deleteLink: async (linkId) => {
    try {
      await linksApi.deleteLink(linkId);
      set((state) => ({
        links: state.links.filter((link) => link.id !== linkId),
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to delete link"),
      });
      throw error;
    }
  },

  reorderLinks: async (linkIds) => {
    try {
      const response = await linksApi.reorderLinks(linkIds);
      set({ links: response.data });
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to reorder links"),
      });
      throw error;
    }
  },

  createSocialLink: async (data) => {
    const { isAuthenticated } = useAuthStore.getState();
    
    // 비로그인 상태면 세션 스토리지에 저장
    if (!isAuthenticated) {
      const tempSocialLink: SocialLink = {
        id: `temp_${Date.now()}_${Math.random()}`,
        user_id: "",
        platform: data.platform,
        url: data.url,
        display_order: get().socialLinks.length,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      
      set((state) => ({
        socialLinks: [...state.socialLinks, tempSocialLink],
      }));
      
      get().saveLinksToSessionStorage();
      return;
    }
    
    // 로그인 상태면 서버에 저장
    set({ isLoading: true, error: null });
    try {
      const response = await linksApi.createSocialLink(data);
      set((state) => ({
        socialLinks: [...state.socialLinks, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to create social link"),
        isLoading: false,
      });
      throw error;
    }
  },

  updateSocialLink: async (socialLinkId, data) => {
    try {
      const response = await linksApi.updateSocialLink(socialLinkId, data);
      set((state) => ({
        socialLinks: state.socialLinks.map((link) =>
          link.id === socialLinkId ? response.data : link
        ),
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to update social link"),
      });
      throw error;
    }
  },

  deleteSocialLink: async (socialLinkId) => {
    try {
      await linksApi.deleteSocialLink(socialLinkId);
      set((state) => ({
        socialLinks: state.socialLinks.filter(
          (link) => link.id !== socialLinkId
        ),
      }));
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to delete social link"),
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  // 세션 스토리지 관련 메서드
  saveLinksToSessionStorage: () => {
    try {
      const { links, socialLinks } = get();
      sessionStorage.setItem(SESSION_STORAGE_LINKS_KEY, JSON.stringify(links));
      sessionStorage.setItem(SESSION_STORAGE_SOCIAL_LINKS_KEY, JSON.stringify(socialLinks));
    } catch (error) {
      console.error("Failed to save links to session storage:", error);
    }
  },
  
  loadLinksFromSessionStorage: () => {
    try {
      const linksData = sessionStorage.getItem(SESSION_STORAGE_LINKS_KEY);
      const socialLinksData = sessionStorage.getItem(SESSION_STORAGE_SOCIAL_LINKS_KEY);
      
      if (linksData) {
        const links = JSON.parse(linksData) as Link[];
        set({ links });
      }
      
      if (socialLinksData) {
        const socialLinks = JSON.parse(socialLinksData) as SocialLink[];
        set({ socialLinks });
      }
    } catch (error) {
      console.error("Failed to load links from session storage:", error);
    }
  },
  
  clearLinksSessionStorage: () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_LINKS_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_SOCIAL_LINKS_KEY);
    } catch (error) {
      console.error("Failed to clear links from session storage:", error);
    }
  },
  
  syncLinksDataToServer: async () => {
    const tempLinks = get().links.filter((link: Link) => link.id.startsWith("temp_"));
    const tempSocialLinks = get().socialLinks.filter((link: SocialLink) => link.id.startsWith("temp_"));
    
    if (tempLinks.length === 0 && tempSocialLinks.length === 0) return;
    
    try {
      // 임시 링크들을 서버로 전송
      for (const link of tempLinks) {
        await get().createLink({
          title: link.title,
          url: link.url,
        });
      }
      
      // 임시 소셜 링크들을 서버로 전송
      for (const socialLink of tempSocialLinks) {
        await get().createSocialLink({
          platform: socialLink.platform,
          url: socialLink.url,
        });
      }
      
      // 동기화 성공 후 임시 링크 제거 및 세션 스토리지 정리
      set((state) => ({
        links: state.links.filter((link) => !link.id.startsWith("temp_")),
        socialLinks: state.socialLinks.filter((link) => !link.id.startsWith("temp_")),
      }));
      
      get().clearLinksSessionStorage();
    } catch (error) {
      console.error("Failed to sync links data to server:", error);
      // 에러가 발생해도 세션 스토리지는 유지 (재시도 가능)
    }
  },
}));
