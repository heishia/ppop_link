import type { Metadata } from "next";
import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";

export const metadata: Metadata = {
  title: "도움말 - 뽑링크 사용방법 및 업데이트 소식",
  description: "뽑링크 사용방법 가이드와 최신 업데이트 소식을 확인하세요. 링크 바이오 만들기, 링크 관리, 분석 기능 등 모든 기능을 쉽게 배울 수 있습니다.",
  keywords: "뽑링크, 도움말, 사용방법, 링크바이오, 링크인바이오, 가이드, 튜토리얼",
  openGraph: {
    title: "도움말 - 뽑링크 사용방법 및 업데이트 소식",
    description: "뽑링크 사용방법 가이드와 최신 업데이트 소식을 확인하세요.",
    type: "website",
  },
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <MainHeader />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center sm:text-left">
          도움말
        </h1>

        {/* 업데이트 소식 섹션 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center sm:text-left">업데이트 소식</h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">
              뽑링크의 최신 업데이트 소식과 새로운 기능을 확인하세요.
            </p>
            <Link
              href="/updates"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center"
            >
              전체 업데이트 보기 →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                최신 업데이트
              </h3>
              <p className="text-sm text-gray-600 mb-1">2025년 1월</p>
              <p className="text-gray-700">
                새로운 헤더 네비게이션과 SEO 최적화 기능이 추가되었습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 사용방법 섹션 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center sm:text-left">사용방법</h2>
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. 계정 만들기
              </h3>
              <p className="text-gray-700 mb-2">
                뽑링크에 가입하여 무료로 시작하세요. 간단한 이메일 인증만으로 계정을 만들 수 있습니다.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>회원가입 페이지에서 이메일과 비밀번호를 입력하세요</li>
                <li>이메일 인증을 완료하세요</li>
                <li>로그인 후 대시보드로 이동합니다</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. 링크 추가하기
              </h3>
              <p className="text-gray-700 mb-2">
                대시보드에서 링크를 추가하고 관리하세요. 원하는 만큼 링크를 추가할 수 있습니다.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>대시보드의 링크 관리 페이지로 이동하세요</li>
                <li>새 링크 추가 버튼을 클릭하세요</li>
                <li>링크 제목과 URL을 입력하고 저장하세요</li>
                <li>링크 순서를 드래그 앤 드롭으로 변경할 수 있습니다</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. 프로필 커스터마이징
              </h3>
              <p className="text-gray-700 mb-2">
                프로필 사진, 표시 이름, 소개글 등을 설정하여 나만의 링크 바이오를 만들어보세요.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>설정 페이지에서 프로필 정보를 수정하세요</li>
                <li>프로필 이미지를 업로드하세요</li>
                <li>표시 이름과 소개글을 작성하세요</li>
                <li>변경사항은 즉시 반영됩니다</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4. 분석 기능 활용하기
              </h3>
              <p className="text-gray-700 mb-2">
                각 링크의 클릭 수와 조회수를 확인하여 어떤 링크가 인기 있는지 파악하세요.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>분석 페이지에서 전체 통계를 확인하세요</li>
                <li>각 링크별 클릭 수를 확인하세요</li>
                <li>기간별 통계를 필터링하여 확인할 수 있습니다</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5. 링크 바이오 공유하기
              </h3>
              <p className="text-gray-700 mb-2">
                완성된 링크 바이오를 SNS 프로필이나 이메일 서명에 추가하여 공유하세요.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>대시보드에서 공개 링크를 복사하세요</li>
                <li>인스타그램, 유튜브 등 SNS 프로필에 추가하세요</li>
                <li>이메일 서명이나 명함에도 활용할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

