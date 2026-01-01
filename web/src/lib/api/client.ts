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

// 인증 확인 경로 (401 시 리다이렉트하지 않고 조용히 실패)
const AUTH_CHECK_PATHS = [
  "/api/auth/oauth/callback",
  "/api/auth/oauth/login",
  "/api/auth/oauth/refresh",  // 리프레시 엔드포인트도 추가하여 무한 루프 방지
  "/api/auth/me",  // 사용자 정보 조회 (쿠키 없으면 조용히 실패)
];

// 요청 URL이 인증 확인 경로인지 확인
const isAuthCheckPath = (url: string | undefined): boolean => {
  if (!url) return false;
  return AUTH_CHECK_PATHS.some((path) => url.includes(path));
};

// 리프레시 진행 중 플래그 (동시 다발적인 리프레시 방지)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 인증 확인 경로는 토큰 갱신 로직을 우회 (조용히 실패)
    if (isAuthCheckPath(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 리프레시 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh_token은 쿠키에서 자동 전송됨
        await axios.post(
          `${API_URL}/api/auth/oauth/refresh`,
          {},
          { withCredentials: true }
        );

        // 갱신 성공
        processQueue(null);
        isRefreshing = false;
        
        // 원래 요청 재시도
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 갱신 실패
        processQueue(refreshError as AxiosError);
        isRefreshing = false;
        
        // 로그인 페이지로 리다이렉트 (한 번만)
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
