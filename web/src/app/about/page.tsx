import type { Metadata } from "next";
import { MainHeader } from "@/components/layout/MainHeader";

export const metadata: Metadata = {
  title: "소개 - 1인 에이전시 PPOP 개발자 김뽑희",
  description: "뽑링크를 만든 1인 에이전시 PPOP과 개발자 김뽑희를 소개합니다. 간단하고 예쁜 링크 바이오 서비스를 제공합니다.",
  keywords: "뽑링크, 소개, PPOP, 김뽑희, 개발자, 1인 에이전시, 링크바이오",
  openGraph: {
    title: "소개 - 1인 에이전시 PPOP 개발자 김뽑희",
    description: "뽑링크를 만든 1인 에이전시 PPOP과 개발자 김뽑희를 소개합니다.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <MainHeader />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center sm:text-left">
          소개
        </h1>

        {/* PPOP 소개 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center sm:text-left">PPOP 소개</h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              PPOP은 1인 에이전시로, 사용자 중심의 웹 서비스를 개발하고 있습니다.
              복잡한 기능보다는 간단하고 직관적인 인터페이스를 통해 사용자 경험을 최우선으로 생각합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              뽑링크는 PPOP의 첫 번째 서비스로, 누구나 쉽게 자신만의 링크 바이오를 만들고 관리할 수 있도록 설계되었습니다.
              무료로 제공되며, 제한 없이 링크를 추가하고 커스터마이징할 수 있습니다.
            </p>
          </div>
        </section>

        {/* 개발자 소개 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center sm:text-left">개발자 소개</h2>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              김뽑희
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">역할</h4>
                <p className="text-gray-700">
                  PPOP 대표 및 풀스택 개발자
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">기술 스택</h4>
                <p className="text-gray-700">
                  Next.js, React, TypeScript, Python, FastAPI, PostgreSQL
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">개발 철학</h4>
                <p className="text-gray-700">
                  사용자가 필요로 하는 기능을 간단하고 직관적으로 제공하는 것을 목표로 합니다.
                  불필요한 복잡성을 제거하고, 핵심 기능에 집중하여 최고의 사용자 경험을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 철학 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center sm:text-left">서비스 철학</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                사용자 중심
              </h3>
              <p className="text-gray-700">
                사용자의 니즈를 최우선으로 고려하여 기능을 개발하고 개선합니다.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                간단함
              </h3>
              <p className="text-gray-700">
                복잡한 설정 없이 누구나 쉽게 사용할 수 있는 직관적인 인터페이스를 제공합니다.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                무료 제공
              </h3>
              <p className="text-gray-700">
                기본 기능은 모두 무료로 제공하여 누구나 부담 없이 사용할 수 있습니다.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                지속적인 개선
              </h3>
              <p className="text-gray-700">
                사용자 피드백을 바탕으로 지속적으로 서비스를 개선하고 새로운 기능을 추가합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

