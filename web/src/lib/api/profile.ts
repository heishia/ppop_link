import { apiClient } from "./client";
import { User, ButtonStyle, FontFamily } from "./auth";

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  background_color?: string;
  button_style?: ButtonStyle;
  font_family?: FontFamily;
}

export interface ThemeUpdateData {
  theme: string;
}

export const profileApi = {
  getProfile: async (): Promise<{ data: User }> => {
    const response = await apiClient.get<{ data: User }>("/api/profile");
    return response.data;
  },

  updateProfile: async (data: ProfileUpdateData): Promise<{ data: User }> => {
    const response = await apiClient.put<{ data: User }>("/api/profile", data);
    return response.data;
  },

  updateTheme: async (data: ThemeUpdateData): Promise<{ data: User }> => {
    const response = await apiClient.put<{ data: User }>(
      "/api/profile/theme",
      data
    );
    return response.data;
  },

  uploadProfileImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{ url: string }>(
      "/api/profile/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  uploadBackgroundImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{ url: string }>(
      "/api/profile/background",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  getShareLink: async (): Promise<{ public_link_id: string; share_url: string }> => {
    const response = await apiClient.get<{ public_link_id: string; share_url: string }>(
      "/api/profile/share-link"
    );
    return response.data;
  },
};

