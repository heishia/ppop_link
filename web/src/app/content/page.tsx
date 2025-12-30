"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const metadata = {
  title: "컨텐츠 - 뽑링크 프로그램 소개 및 정보",
  description: "뽑링크 프로그램 소개, 사용 가이드, 팁과 노하우 등 다양한 컨텐츠를 확인하세요. 링크 바이오를 더 효과적으로 활용하는 방법을 알아보세요.",
  keywords: "뽑링크, 컨텐츠, 프로그램 소개, 링크바이오 가이드, 링크인바이오 활용법, 마케팅 팁",
  openGraph: {
    title: "컨텐츠 - 뽑링크 프로그램 소개 및 정보",
    description: "뽑링크 프로그램 소개, 사용 가이드, 팁과 노하우 등 다양한 컨텐츠를 확인하세요.",
    type: "website",
  },
};

interface ContentItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
}

const contentItems: ContentItem[] = [
  {
    slug: "link-bio-guide",
    title: "링크 바이오 완벽 가이드",
    description: "링크 바이오란 무엇인지, 어떻게 활용하는지 알아보는 완벽한 가이드입니다.",
    category: "가이드",
    date: "2025-01-10",
  },
  {
    slug: "marketing-tips",
    title: "SNS 마케팅을 위한 링크 바이오 활용법",
    description: "인스타그램, 유튜브 등 SNS에서 링크 바이오를 효과적으로 활용하는 방법을 소개합니다.",
    category: "마케팅",
    date: "2025-01-05",
  },
  {
    slug: "ppoplink-features",
    title: "뽑링크 주요 기능 소개",
    description: "뽑링크의 핵심 기능들을 자세히 알아보고, 각 기능을 어떻게 활용하는지 설명합니다.",
    category: "프로그램 소개",
    date: "2025-01-01",
  },
];

export default function ContentPage() {
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      setIsLoading(false);
    };
    init();
  }, [loadUser]);

  // 관리자 권한 확인
  const isAdmin = isAuthenticated && user?.is_admin === true;

  return (
    <div className="min-h-screen bg-white">
      <MainHeader />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
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
        <p className="text-gray-600 mb-8">
          뽑링크 프로그램 소개, 사용 가이드, 팁과 노하우 등 다양한 컨텐츠를 확인하세요.
        </p>

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
                    <span className="text-xs text-gray-500">{item.date}</span>
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
      </div>
    </div>
  );
}

