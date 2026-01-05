import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function isPublicPath(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/" || path.startsWith("/login") || path.startsWith("/auth/");
}

let isRefreshing = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
let lastSuccessTime = Date.now();
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const now = Date.now();
      if (now - lastSuccessTime > 60000) {
        consecutiveFailures = 0;
      }

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error("Max consecutive refresh failures reached, redirecting to login...");
        consecutiveFailures = 0;
        useAuthStore.getState().clearUser();
        if (!isPublicPath()) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/oauth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data?.user) {
          useAuthStore.getState().setUser(refreshResponse.data.user);
        }

        consecutiveFailures = 0;
        lastSuccessTime = Date.now();
        processQueue(null);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        consecutiveFailures++;
        processQueue(refreshError as Error);
        isRefreshing = false;
        
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          useAuthStore.getState().clearUser();
          if (!isPublicPath()) {
            console.log("🔐 Authentication required, redirecting to login...");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
