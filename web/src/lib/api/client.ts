import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // 쿠키 자동 전송 활성화
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: 쿠키는 자동으로 전송되므로 토큰 추가 불필요
// (필요한 경우 다른 용도로 사용 가능)

// OAuth 관련 경로 (인증 전 단계이므로 401 interceptor 우회)
const OAUTH_PATHS = [
  "/api/auth/oauth/callback",
  "/api/auth/oauth/login",
];

// 요청 URL이 OAuth 관련 경로인지 확인
const isOAuthPath = (url: string | undefined): boolean => {
  if (!url) return false;
  return OAUTH_PATHS.some((path) => url.includes(path));
};

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // OAuth 관련 요청은 토큰 갱신 로직을 우회 (인증 전 단계)
    if (isOAuthPath(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // refresh_token은 쿠키에서 자동 전송됨
        await axios.post(
          `${API_URL}/api/auth/oauth/refresh`,
          {},
          { withCredentials: true }
        );

        // 갱신 성공 시 원래 요청 재시도
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 로그인 페이지로 리다이렉트
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
