import axios from "axios";
import { apiClient } from "./client";
import { Link, SocialLink } from "./links";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

import { ButtonStyle, FontFamily } from "./auth";

export interface PublicProfile {
  public_link_id: string;
  username: string;
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
  links: Link[];
  social_links: SocialLink[];
  is_pro_user: boolean;
}

export const publicApi = {
  /**
   * 공개 링크 ID로 프로필 조회
   * @param linkId 암호화된 공개 링크 ID (예: Ab3x2Kq9)
   */
  getPublicProfile: async (linkId: string): Promise<{ data: PublicProfile }> => {
    // Use axios directly for SSR (no auth needed for public profiles)
    const response = await axios.get<{ data: PublicProfile }>(
      `${API_URL}/api/public/${linkId}`
    );
    return response.data;
  },

  /**
   * 링크 클릭 기록
   * @param publicLinkId 암호화된 공개 링크 ID
   * @param linkId 클릭된 링크의 UUID
   */
  recordClick: async (publicLinkId: string, linkId: string): Promise<void> => {
    await apiClient.post(`/api/public/${publicLinkId}/click/${linkId}`);
  },
};

