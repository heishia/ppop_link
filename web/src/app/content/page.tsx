"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { contentApi, Content } from "@/lib/api/content";

export default function ContentPage() {
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [contentItems, setContentItems] = useState<Content[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await loadUser();
        const contents = await contentApi.getAll();
        setContentItems(contents);
      } catch (err) {
        console.error("Failed to load content:", err);
        setError("컨텐츠를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadUser]);

  // 관리자 권한 확인
  const isAdmin = isAuthenticated && user?.is_admin === true;

  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <MainHeader />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-0 text-center sm:text-left">
            컨텐츠
          </h1>
          {isAdmin && (
            <Button
              variant="primary"
              onClick={() => {
                // TODO: 컨텐츠 추가 모달 또는 페이지로 이동
                alert("컨텐츠 추가 기능은 곧 추가됩니다!");
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              컨텐츠 추가
            </Button>
          )}
        </div>
        <p className="text-gray-600 mb-8 text-center sm:text-left">
          뽑링크 프로그램 소개, 사용 가이드, 팁과 노하우 등 다양한 컨텐츠를 확인하세요.
        </p>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">컨텐츠를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">아직 등록된 컨텐츠가 없습니다.</p>
            {isAdmin && (
              <p className="text-sm text-gray-400 mt-2">
                컨텐츠 추가 버튼을 눌러 첫 컨텐츠를 작성해보세요!
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {contentItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/content/${item.slug}`}
                  className="block border border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.published_at)}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h2>
                      <p className="text-gray-700">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                더 많은 컨텐츠가 곧 추가됩니다
              </h3>
              <p className="text-gray-700 text-sm">
                뽑링크를 더 효과적으로 활용할 수 있는 다양한 컨텐츠를 준비 중입니다.
                새로운 컨텐츠가 추가되면 업데이트 소식에서 확인하실 수 있습니다.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

