"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoginRequiredModal } from "@/components/ui/LoginRequiredModal";
import analyticsApi, { AnalyticsSummary } from "@/lib/api/analytics";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { useAuthStore } from "@/store/authStore";

export default function AnalyticsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isAuthenticated, subscription } = useAuthStore();
  const authLoading = false;
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // PRO 권한 체크
  const isProUser = subscription?.plan === "PRO" && subscription?.status === "ACTIVE" && subscription?.hasAccess;

  useEffect(() => {
    // 인증 상태 확인
    if (!authLoading && !isAuthenticated) {
      setShowLoginModal(true);
      setIsLoading(false);
      return;
    }

    // PRO 권한 체크
    if (!authLoading && isAuthenticated && !isProUser) {
      setError("Analytics feature is available for PRO plan only. Please upgrade to PRO.");
      setIsLoading(false);
      return;
    }

    // PRO 사용자만 통계 데이터 로드
    if (isAuthenticated && isProUser) {
      const fetchAnalytics = async () => {
        try {
          setIsLoading(true);
          const data = await analyticsApi.getAnalytics();
          setAnalytics(data);
          setError(null);
        } catch (err: unknown) {
          console.error("Failed to fetch analytics:", err);
          // 백엔드에서 PRO 권한 체크 실패 시 에러 메시지 표시
          const error = err as { response?: { status?: number; data?: { detail?: string } } };
          if (error?.response?.status === 403 || error?.response?.data?.detail?.includes("PRO")) {
            setError("Analytics feature is available for PRO plan only. Please upgrade to PRO.");
          } else {
            setError("Failed to load analytics data");
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchAnalytics();
    }
  }, [isAuthenticated, isProUser, authLoading]);

  // 로그인 모달이 표시 중일 때는 빈 화면 반환
  if (showLoginModal) {
    return (
      <>
        {/* 로그인 안내 모달 */}
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            router.push("/dashboard/links");
          }}
          onLogin={() => {
            setShowLoginModal(false);
            window.location.href = "/login";
          }}
        />
      </>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
        {error.includes("PRO") && (
          <div className="text-center">
            <button
              onClick={() => router.push("/dashboard/pricing")}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all hover:bg-primary/90"
            >
              Upgrade to PRO
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { overview, link_stats, daily_clicks } = analytics;

  // 차트의 최대값 계산
  const maxDailyClicks = Math.max(...daily_clicks.map((d) => d.clicks), 1);

  // ========== 모바일 레이아웃 ==========
  if (isMobile) {
    return (
      <div className="px-4 py-3 space-y-4 pb-20">
        {/* 페이지 헤더 */}
        <div>
          <p className="text-sm text-gray-600">
            링크 클릭 통계를 확인하세요
          </p>
        </div>

        {/* 개요 카드 - 2x2 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          <MobileStatCard
            title="전체 클릭"
            value={overview.total_clicks}
            subtitle="누적"
            color="blue"
          />
          <MobileStatCard
            title="오늘"
            value={overview.today_clicks}
            subtitle="today"
            color="green"
          />
          <MobileStatCard
            title="이번 주"
            value={overview.week_clicks}
            subtitle="최근 7일"
            color="purple"
          />
          <MobileStatCard
            title="이번 달"
            value={overview.month_clicks}
            subtitle="최근 30일"
            color="orange"
          />
        </div>

        {/* 일별 클릭 차트 */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">일별 클릭 추이</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-32">
              <div className="flex h-full items-end gap-0.5">
                {daily_clicks.map((day, index) => {
                  const height =
                    maxDailyClicks > 0 ? (day.clicks / maxDailyClicks) * 100 : 0;
                  const isToday = index === daily_clicks.length - 1;
                  return (
                    <div
                      key={day.date}
                      className="relative flex-1"
                      title={`${day.date}: ${day.clicks} clicks`}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${
                          isToday ? "bg-primary" : "bg-primary/40"
                        }`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                <span>30일 전</span>
                <span>오늘</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 링크별 통계 */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">링크별 클릭</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {link_stats.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <p className="text-sm">아직 링크가 없습니다</p>
                <p className="mt-1 text-xs">링크를 추가하고 통계를 확인하세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {link_stats.map((link) => {
                  const maxClicks = Math.max(...link_stats.map((l) => l.click_count), 1);
                  const percentage = (link.click_count / maxClicks) * 100;
                  return (
                    <div key={link.link_id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium text-gray-900">
                            {link.title}
                          </h4>
                          <p className="truncate text-xs text-gray-500">{link.url}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900">{link.click_count}</p>
                        </div>
                      </div>
                      {/* 프로그레스 바 */}
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {/* 기간별 통계 */}
                      <div className="flex gap-3 text-[10px] text-gray-500">
                        <span>
                          today: <span className="font-medium text-gray-700">{link.today_clicks}</span>
                        </span>
                        <span>
                          week: <span className="font-medium text-gray-700">{link.week_clicks}</span>
                        </span>
                        <span>
                          month: <span className="font-medium text-gray-700">{link.month_clicks}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== 데스크톱 레이아웃 ==========
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">분석</h1>
        <p className="mt-1 text-sm text-gray-600">
          링크 클릭 통계를 확인하세요
        </p>
      </div>

      {/* 개요 카드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="전체 클릭"
          value={overview.total_clicks}
          subtitle="누적"
          color="blue"
        />
        <StatCard
          title="오늘 클릭"
          value={overview.today_clicks}
          subtitle="today"
          color="green"
        />
        <StatCard
          title="이번 주"
          value={overview.week_clicks}
          subtitle="최근 7일"
          color="purple"
        />
        <StatCard
          title="이번 달"
          value={overview.month_clicks}
          subtitle="최근 30일"
          color="orange"
        />
      </div>

      {/* 일별 클릭 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>일별 클릭 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <div className="flex h-full items-end gap-1">
              {daily_clicks.map((day, index) => {
                const height =
                  maxDailyClicks > 0
                    ? (day.clicks / maxDailyClicks) * 100
                    : 0;
                const isToday = index === daily_clicks.length - 1;
                return (
                  <div
                    key={day.date}
                    className="group relative flex-1"
                    title={`${day.date}: ${day.clicks} clicks`}
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        isToday
                          ? "bg-primary"
                          : "bg-primary/40 group-hover:bg-primary/60"
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* 툴팁 */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white">
                        <div>{day.date}</div>
                        <div className="font-bold">{day.clicks} clicks</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>30 days ago</span>
              <span>today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 링크별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>링크별 클릭</CardTitle>
        </CardHeader>
        <CardContent>
          {link_stats.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>아직 링크가 없습니다</p>
              <p className="mt-1 text-sm">링크를 추가하고 통계를 확인하세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              {link_stats.map((link) => {
                const maxClicks = Math.max(
                  ...link_stats.map((l) => l.click_count),
                  1
                );
                const percentage = (link.click_count / maxClicks) * 100;
                return (
                  <div key={link.link_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-medium text-gray-900">
                          {link.title}
                        </h4>
                        <p className="truncate text-xs text-gray-500">
                          {link.url}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-bold text-gray-900">
                          {link.click_count}
                        </p>
                        <p className="text-xs text-gray-500">total</p>
                      </div>
                    </div>
                    {/* 프로그레스 바 */}
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {/* 기간별 통계 */}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>
                        today:{" "}
                        <span className="font-medium text-gray-700">
                          {link.today_clicks}
                        </span>
                      </span>
                      <span>
                        week:{" "}
                        <span className="font-medium text-gray-700">
                          {link.week_clicks}
                        </span>
                      </span>
                      <span>
                        month:{" "}
                        <span className="font-medium text-gray-700">
                          {link.month_clicks}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 통계 카드 컴포넌트 (데스크톱)
function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
  };

  const valueColorClasses = {
    blue: "text-blue-700",
    green: "text-green-700",
    purple: "text-purple-700",
    orange: "text-orange-700",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colorClasses[color]}`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColorClasses[color]}`}>
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs opacity-75">{subtitle}</p>
    </div>
  );
}

// 통계 카드 컴포넌트 (모바일 - 더 컴팩트)
function MobileStatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
  };

  const valueColorClasses = {
    blue: "text-blue-700",
    green: "text-green-700",
    purple: "text-purple-700",
    orange: "text-orange-700",
  };

  return (
    <div className={`rounded-xl border p-3 ${colorClasses[color]}`}>
      <p className="text-xs font-medium">{title}</p>
      <p className={`mt-0.5 text-2xl font-bold ${valueColorClasses[color]}`}>
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-[10px] opacity-75">{subtitle}</p>
    </div>
  );
}

