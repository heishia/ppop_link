import type { Metadata } from "next";
import { MainHeader } from "@/components/layout/MainHeader";

export const metadata: Metadata = {
  title: "업데이트 소식 - 뽑링크 최신 기능 및 변경사항",
  description: "뽑링크의 최신 업데이트 소식과 새로운 기능을 확인하세요. 버그 수정, 성능 개선, 새로운 기능 추가 등 모든 변경사항을 한눈에 볼 수 있습니다.",
  keywords: "뽑링크, 업데이트, 새 기능, 변경사항, 릴리즈 노트",
  openGraph: {
    title: "업데이트 소식 - 뽑링크 최신 기능 및 변경사항",
    description: "뽑링크의 최신 업데이트 소식과 새로운 기능을 확인하세요.",
    type: "website",
  },
};

interface UpdateItem {
  date: string;
  version: string;
  title: string;
  description: string;
  items: string[];
}

const updates: UpdateItem[] = [
  {
    date: "2026-01-05",
    version: "1.3.0",
    title: "컨텐츠 관리 시스템 추가",
    description: "관리자가 컨텐츠를 직접 작성하고 관리할 수 있는 기능을 추가했습니다.",
    items: [
      "컨텐츠 페이지 및 카테고리 시스템 추가",
      "관리자 컨텐츠 작성 기능",
      "도움말 및 업데이트 페이지 개선",
      "모바일 반응형 UI 최적화",
    ],
  },
  {
    date: "2025-12-28",
    version: "1.2.0",
    title: "헤더 네비게이션 및 SEO 최적화",
    description: "사용자 편의성을 위한 헤더 네비게이션 추가 및 검색 엔진 최적화를 적용했습니다.",
    items: [
      "메인 페이지에 헤더 네비게이션 추가",
      "카테고리 메뉴 추가 (도움말, 소개, 업데이트 소식, 컨텐츠)",
      "네이버 검색 최적화 적용",
      "SEO 메타 태그 및 구조화된 데이터 추가",
      "사이트맵 및 robots.txt 생성",
    ],
  },
  {
    date: "2025-12-20",
    version: "1.1.0",
    title: "분석 기능 개선",
    description: "링크 클릭 통계 및 분석 기능을 개선했습니다.",
    items: [
      "링크별 클릭 수 추적 기능 추가",
      "기간별 통계 필터링 기능 추가",
      "대시보드 분석 페이지 UI 개선",
    ],
  },
  {
    date: "2025-12-10",
    version: "1.0.0",
    title: "뽑링크 정식 출시",
    description: "뽑링크 서비스가 정식으로 출시되었습니다.",
    items: [
      "링크 추가 및 관리 기능",
      "프로필 커스터마이징 기능",
      "공개 링크 페이지 생성",
      "사용자 인증 시스템",
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-white">
      <MainHeader />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center sm:text-left">
          업데이트 소식
        </h1>

        <div className="space-y-8">
          {updates.map((update, index) => (
            <div
              key={index}
              className="border-l-4 border-primary pl-6 pb-8 last:pb-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    {update.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {update.date} · 버전 {update.version}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{update.description}</p>
              <ul className="space-y-2">
                {update.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            업데이트 알림 받기
          </h3>
          <p className="text-gray-700 text-sm">
            새로운 업데이트 소식을 이메일로 받아보시려면 뽑링크에 가입해주세요.
            가입하시면 최신 기능과 변경사항을 가장 먼저 알려드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}

