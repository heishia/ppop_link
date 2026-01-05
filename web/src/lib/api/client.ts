import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 쿠키 자동 전송 활성화
  headers: {
    "Content-Type": "application/json",
  },
});

// 공개 경로 확인 (로그인 페이지로 리다이렉트하지 않음)
function isPublicPath(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/" || path.startsWith("/login") || path.startsWith("/auth/");
}

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401이고 아직 재시도 안 했으면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 리프레시 시도
        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/oauth/refresh`,
          {},
          { withCredentials: true }
        );

        // 사용자 정보 업데이트
        if (refreshResponse.data?.user) {
          useAuthStore.getState().setUser(refreshResponse.data.user);
        }

        // 원래 요청 재시도
        return apiClient(originalRequest);
      } catch {
        // 리프레시 실패 = 로그인 필요
        useAuthStore.getState().clearUser();

        if (!isPublicPath()) {
          console.log("🔐 Authentication required, redirecting to login...");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
