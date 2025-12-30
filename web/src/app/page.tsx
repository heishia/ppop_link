"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Link2, Sparkles, BarChart3 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { MainHeader } from "@/components/layout/MainHeader";

export default function Home() {
  const { isAuthenticated, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // 로그인 상태 확인 (마운트 시에만)
  useEffect(() => {
    const init = async () => {
      await loadUser();
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시에만 실행

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MainHeader />
      <main>
      {/* Hero Section */}
      <section className="px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-6xl font-heading">
              링크를 모아주는 <span className="text-primary">뽑링크</span>
            </h1>
            <p className="mt-1 sm:mt-2 text-xl sm:text-3xl text-gray-600">
              간단하고 예쁜 링크 바이오 만들기
            </p>
          </div>

          {/* 휴대폰 목업 섹션 */}
          <div className="mt-10 sm:mt-16 flex justify-center">
            <div className="phone-mockup">
              {/* 휴대폰 프레임 */}
              <div className="relative mx-auto w-[280px] sm:w-[320px] h-[580px] sm:h-[660px] bg-gray-900 rounded-[45px] sm:rounded-[55px] p-2 sm:p-3 shadow-2xl">
                {/* 상단 노치/다이나믹 아일랜드 */}
                <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-6 sm:h-7 bg-black rounded-full z-20" />

                {/* 전원 버튼 */}
                <div className="absolute -right-1 top-28 w-1 h-12 bg-gray-700 rounded-r-lg" />

                {/* 볼륨 버튼 */}
                <div className="absolute -left-1 top-24 w-1 h-8 bg-gray-700 rounded-l-lg" />
                <div className="absolute -left-1 top-36 w-1 h-8 bg-gray-700 rounded-l-lg" />

                {/* 스크린 영역 */}
                <div className="w-full h-full rounded-[38px] sm:rounded-[48px] overflow-hidden">
                  <Image
                    src="/screenshot.png"
                    alt="PPOPLINK preview"
                    width={320}
                    height={660}
                    className="w-full h-full object-cover object-top"
                    priority
                  />
                </div>
              </div>

              {/* 그림자 효과 */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[200px] sm:w-[250px] h-4 bg-gray-900/20 blur-xl rounded-full" />
            </div>
          </div>

          {/* CTA 버튼 */}
          <div className="mt-10 sm:mt-14 flex flex-row items-center justify-center gap-3 sm:gap-4">
            {isLoading ? (
              // 로딩 중에는 버튼 숨김 (깜빡임 방지)
              <div className="h-10 sm:h-12" />
            ) : isAuthenticated ? (
              // 로그인 상태: 대시보드 버튼 표시
              <Link href="/dashboard/links">
                <Button
                  variant="primary"
                  className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
                >
                  대시보드로 이동
                </Button>
              </Link>
            ) : (
              // 비로그인 상태: 시작하기 + 로그인 버튼 표시
              <>
                <Link href="/dashboard/links">
                  <Button
                    variant="primary"
                    className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    무료로 시작하기
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="secondary"
                    className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    로그인
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 pt-12 pb-16 sm:pt-20 sm:pb-32 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 font-heading">
            필요한 모든 기능
          </h2>
          <div className="mt-10 sm:mt-16 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
                <Link2
                  className="h-6 w-6 sm:h-8 sm:w-8 text-primary"
                  strokeWidth={2}
                />
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-xl font-semibold text-gray-900 font-heading">
                무제한 링크
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-3xl text-gray-600">
                원하는 만큼 링크를 추가하세요. 제한이 없습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles
                  className="h-6 w-6 sm:h-8 sm:w-8 text-primary"
                  strokeWidth={2}
                />
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-xl font-semibold text-gray-900 font-heading">
                커스터마이징
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-3xl text-gray-600">
                테마와 색상으로 나만의 스타일을 만들어보세요.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
                <BarChart3
                  className="h-6 w-6 sm:h-8 sm:w-8 text-primary"
                  strokeWidth={2}
                />
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-xl font-semibold text-gray-900 font-heading">
                분석
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-3xl text-gray-600">
                링크의 클릭 수와 조회수를 추적하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Appeal Section */}
      <section className="px-4 py-16 sm:py-24 bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xl sm:text-3xl text-white/80 font-medium">
            링크인바이오 기능 추가하면 유료?
          </p>
          <h2 className="mt-3 sm:mt-4 text-2xl sm:text-5xl font-extrabold text-white font-heading">
            뽑링크는 가입만하면
            <span className="block mt-1 sm:mt-2 text-yellow-300">무료!</span>
          </h2>
          <div className="mt-6 sm:mt-10 flex justify-center">
            <Link href="/dashboard/links">
              <Button
                variant="secondary"
                className="w-auto px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-primary hover:bg-gray-100 font-bold shadow-xl"
              >
                {isAuthenticated ? "대시보드로 이동" : "지금 바로 시작하기"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 font-heading">
            시작할 준비가 되셨나요?
          </h2>
          <p className="mt-3 sm:mt-4 text-xl sm:text-3xl text-gray-600">
            수천 명의 크리에이터들과 함께 콘텐츠를 공유하세요.
          </p>
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Link href="/dashboard/links">
              <Button
                variant="primary"
                className="w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                {isAuthenticated ? "대시보드로 이동" : "링크 바이오 만들기"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            2025 PPOPLINK. All rights reserved.
          </p>
        </div>
      </footer>
      </main>
    </div>
  );
}
