import { create } from "zustand";
import { authApi, User, SubscriptionStatus } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  subscription: SubscriptionStatus | null;

  // Actions
  checkAuth: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
  loadSubscription: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  subscription: null,

  checkAuth: async () => {
    try {
      const response = await authApi.getMe();

      set({ user: response.data, isAuthenticated: true });
      return true;
    } catch {
      set({ user: null, isAuthenticated: false });
      return false;
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearUser: () => set({ user: null, isAuthenticated: false, subscription: null }),

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        subscription: null,
      });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("temp_profile");
        sessionStorage.removeItem("temp_links");
        sessionStorage.removeItem("temp_social_links");
        sessionStorage.removeItem("oauth_state");
        window.location.href = "/";
      }
    }
  },

  loadSubscription: async () => {
    try {
      const subscription = await authApi.getSubscriptionStatus();
      set({ subscription });
    } catch (error) {
      console.error("Failed to load subscription:", error);
      set({ subscription: null });
    }
  },
}));
