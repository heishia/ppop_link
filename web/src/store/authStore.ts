import { create } from "zustand";
import { authApi, User, OAuthCallbackData, SubscriptionStatus } from "@/lib/api/auth";

// API 에러를 문자열로 변환하는 헬퍼 함수
function parseApiError(error: unknown, fallbackMessage: string): string {
  const axiosError = error as { response?: { data?: { detail?: unknown } } };
  const detail = axiosError.response?.data?.detail;
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
    return String((detail as { msg: unknown }).msg);
  }

  return fallbackMessage;
}

// OAuth state 저장/검증을 위한 키
const OAUTH_STATE_KEY = "oauth_state";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  subscription: SubscriptionStatus | null;

  // Actions
  startOAuthLogin: () => Promise<void>;
  handleOAuthCallback: (data: OAuthCallbackData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  subscription: null,

  startOAuthLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.getOAuthLoginURL();

      // state를 세션 스토리지에 저장 (CSRF 방지)
      sessionStorage.setItem(OAUTH_STATE_KEY, response.state);

      // PPOP Auth 로그인 페이지로 리다이렉트 (replace로 히스토리 교체)
      window.location.replace(response.login_url);
    } catch (error: unknown) {
      set({
        error: parseApiError(error, "Failed to start login. Please try again."),
        isLoading: false,
      });
      throw error;
    }
  },

  handleOAuthCallback: async (data: OAuthCallbackData) => {
    set({ isLoading: true, error: null });
    try {
      console.log("handleOAuthCallback called with:", { code: data.code ? "present" : "missing", state: data.state ? "present" : "missing" });
      
      // state 검증 (CSRF 방지)
      const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      console.log("Saved state:", savedState ? "present" : "missing", "Received state:", data.state ? "present" : "missing");
      
      if (savedState && savedState !== data.state) {
        console.error("State mismatch:", { saved: savedState, received: data.state });
        throw new Error(
          "Invalid state parameter. Please try logging in again."
        );
      }

      // 인가 코드를 토큰으로 교환
      console.log("Calling oauthCallback API...");
      const response = await authApi.oauthCallback(data);
      console.log("OAuth callback API response received");
      
      const { access_token, refresh_token } = response.data;
      const { user } = response;

      // 토큰 저장
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      console.log("Tokens saved, user:", user.username);

      // state 정리
      sessionStorage.removeItem(OAUTH_STATE_KEY);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // 세션 스토리지 데이터를 서버로 동기화
      try {
        const { useProfileStore } = await import("./profileStore");
        const { useLinksStore } = await import("./linksStore");
        
        await useProfileStore.getState().syncSessionDataToServer();
        await useLinksStore.getState().syncLinksDataToServer();
      } catch (error) {
        console.error("Failed to sync session data to server:", error);
      }
      
      console.log("OAuth callback completed successfully");
    } catch (error: unknown) {
      // state 정리
      sessionStorage.removeItem(OAUTH_STATE_KEY);

      console.error("OAuth callback failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : parseApiError(error, "Login failed. Please try again.");

      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // 토큰 및 상태 정리
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem(OAUTH_STATE_KEY);
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        subscription: null,
      });
      
      // 랜딩 페이지로 리다이렉트 (페이지 새로고침으로 상태 완전 초기화)
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // 구독 상태도 함께 로드
      await get().loadSubscription();
    } catch {
      // 토큰이 유효하지 않으면 정리
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        subscription: null,
      });
    }
  },

  loadSubscription: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ subscription: null });
      return;
    }

    try {
      const subscription = await authApi.getSubscriptionStatus();
      set({ subscription });
    } catch (error) {
      console.error("Failed to load subscription:", error);
      set({ subscription: null });
    }
  },

  clearError: () => set({ error: null }),
}));
