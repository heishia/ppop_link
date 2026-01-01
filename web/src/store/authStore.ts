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

      const { user } = response;
      // 토큰은 서버에서 HttpOnly 쿠키로 자동 설정됨
      console.log("User authenticated, tokens set in cookies, user:", user.username);

      // state 정리
      sessionStorage.removeItem(OAUTH_STATE_KEY);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

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
      // 쿠키는 서버에서 삭제됨
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
    set({ isLoading: true });
    try {
      // 쿠키에 토큰이 있으면 서버에서 자동으로 검증
      const response = await authApi.getMe();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });

      // 구독 상태도 함께 로드
      await get().loadSubscription();
    } catch {
      // 쿠키가 없거나 유효하지 않으면 로그아웃 상태
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        subscription: null,
      });
    }
  },

  loadSubscription: async () => {
    try {
      // 쿠키에 토큰이 있으면 서버에서 자동으로 검증
      const subscription = await authApi.getSubscriptionStatus();
      set({ subscription });
    } catch (error) {
      console.error("Failed to load subscription:", error);
      set({ subscription: null });
    }
  },

  clearError: () => set({ error: null }),
}));
