import { apiClient } from "./client";

export interface Content {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author_id: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ContentCreate {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  is_published: boolean;
}

export interface ContentUpdate {
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  is_published?: boolean;
}

export const contentApi = {
  // 모든 발행된 컨텐츠 조회 (공개 API)
  getAll: async (category?: string): Promise<Content[]> => {
    const params = category ? { category } : {};
    const response = await apiClient.get<{ success: boolean; data: Content[]; total: number }>(
      "/api/content",
      { params }
    );
    return response.data.data;
  },

  // slug로 컨텐츠 조회 (공개 API)
  getBySlug: async (slug: string): Promise<Content> => {
    const response = await apiClient.get<{ success: boolean; data: Content }>(
      `/api/content/${slug}`
    );
    return response.data.data;
  },

  // 새 컨텐츠 생성 (관리자 전용)
  create: async (data: ContentCreate): Promise<Content> => {
    const response = await apiClient.post<{ success: boolean; data: Content }>(
      "/api/content",
      data
    );
    return response.data.data;
  },

  // 컨텐츠 업데이트 (관리자 전용)
  update: async (slug: string, data: ContentUpdate): Promise<Content> => {
    const response = await apiClient.put<{ success: boolean; data: Content }>(
      `/api/content/${slug}`,
      data
    );
    return response.data.data;
  },

  // 컨텐츠 삭제 (관리자 전용)
  delete: async (slug: string): Promise<void> => {
    await apiClient.delete(`/api/content/${slug}`);
  },

  // 모든 컨텐츠 조회 (발행/미발행 포함, 관리자 전용)
  getAllAdmin: async (category?: string): Promise<Content[]> => {
    const params = category ? { category } : {};
    const response = await apiClient.get<{ success: boolean; data: Content[]; total: number }>(
      "/api/content/admin/all",
      { params }
    );
    return response.data.data;
  },

  // 이미지 업로드 (관리자 전용)
  uploadImage: async (file: File): Promise<{ url: string; file_path: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{
      success: boolean;
      url: string;
      file_path: string;
    }>(
      "/api/content/images/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return { url: response.data.url, file_path: response.data.file_path };
  },
};

