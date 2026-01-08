import { apiClient } from "./client";

export type ButtonStyle = "default" | "outline" | "filled";
export type FontFamily = "default" | "Noto Sans KR" | "Nanum Gothic" | "Gowun Batang";

export interface User {
  id: string;
  user_seq: number | null;
  public_link_id: string | null;
  username: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  theme: string;
  button_style: ButtonStyle;
  font_family: FontFamily;
  contact_email: string | null;
  contact_message: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AuthResponse {
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  user: User;
}

export interface OAuthLoginURLResponse {
  success: boolean;
  login_url: string;
  state: string;
}

export interface OAuthCallbackData {
  code: string;
  state: string;
}

export interface SubscriptionStatus {
  hasAccess: boolean;
  plan: "BASIC" | "PRO";
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "NONE";
  expiresAt: string | null;
}

export const authApi = {
  // OAuth 로그인 URL 가져오기
  getOAuthLoginURL: async (): Promise<OAuthLoginURLResponse> => {
    const response = await apiClient.get<OAuthLoginURLResponse>(
      "/api/auth/oauth/login"
    );
    return response.data;
  },

  // OAuth 콜백 처리 (인가 코드 -> 토큰 교환)
  oauthCallback: async (data: OAuthCallbackData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/oauth/callback",
      data
    );
    return response.data;
  },

  // 현재 사용자 정보 가져오기
  getMe: async (): Promise<{ data: User }> => {
    const response = await apiClient.get<{ data: User }>("/api/auth/me");
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await apiClient.post("/api/auth/logout");
  },

  // 토큰 갱신
  refreshToken: async (
    refreshToken: string
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/api/auth/oauth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // 구독 상태 조회 (백엔드 API를 통해 PPOP Auth 호출)
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const SERVICE_CODE = process.env.NEXT_PUBLIC_PPOP_AUTH_SERVICE_CODE || "ppop-link";
    const response = await apiClient.get<{ success: boolean; data: SubscriptionStatus }>(
      `/api/auth/subscription/${SERVICE_CODE}`
    );
    return response.data.data;
  },
};
