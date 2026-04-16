"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoginRequiredModal } from "@/components/ui/LoginRequiredModal";
import analyticsApi, { AnalyticsSummary, DailyClickData } from "@/lib/api/analytics";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { useAuthStore } from "@/store/authStore";

type Period = "7d" | "14d" | "30d";

export default function AnalyticsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [period, setPeriod] = useState<Period>("7d");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const data = await analyticsApi.getAnalytics();
      setAnalytics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch analytics:", err);
      setError("통계 데이터를 불러오지 못했습니다");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      setIsLoading(false);
      return;
    }
    fetchAnalytics();
  }, [isAuthenticated, fetchAnalytics]);

  const handleRefresh = () => {
    if (isRefreshing) return;
    fetchAnalytics(true);
  };

  const filteredDailyClicks = useMemo(() => {
    if (!analytics) return [];
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    return analytics.daily_clicks.slice(-days);
  }, [analytics, period]);

  const periodStats = useMemo(() => {
    if (!filteredDailyClicks.length) return { total: 0, avg: 0, peak: 0, peakDate: "" };
    const total = filteredDailyClicks.reduce((sum, d) => sum + d.clicks, 0);
    const avg = Math.round(total / filteredDailyClicks.length);
    const peakDay = filteredDailyClicks.reduce(
      (max, d) => (d.clicks > max.clicks ? d : max),
      filteredDailyClicks[0]
    );
    return { total, avg, peak: peakDay.clicks, peakDate: peakDay.date };
  }, [filteredDailyClicks]);

  const todayLinkStats = useMemo(() => {
    if (!analytics) return [];
    return [...analytics.link_stats].sort((a, b) => b.today_clicks - a.today_clicks);
  }, [analytics]);

  const sortedLinkStats = useMemo(() => {
    if (!analytics) return [];
    return [...analytics.link_stats].sort((a, b) => b.click_count - a.click_count);
  }, [analytics]);

  if (showLoginModal) {
    return (
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
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        <div className="text-center">
          <button onClick={() => fetchAnalytics()} className="text-sm text-primary font-medium hover:underline">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview } = analytics;
  const timeStr = lastUpdated
    ? `${lastUpdated.getHours().toString().padStart(2, "0")}:${lastUpdated.getMinutes().toString().padStart(2, "0")}:${lastUpdated.getSeconds().toString().padStart(2, "0")}`
    : "";

  // ========== 모바일 ==========
  if (isMobile) {
    return (
      <div className="px-4 py-3 space-y-4 pb-24">
        {/* 오늘 히어로 + 새로고침 */}
        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-white/80">오늘의 클릭</p>
            <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} compact />
          </div>
          <p className="text-4xl font-extrabold">{overview.today_clicks.toLocaleString()}</p>
          {timeStr && <p className="mt-1 text-xs text-white/60">마지막 업데이트 {timeStr}</p>}
        </div>

        {/* 오늘 링크별 클릭 */}
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">오늘 링크별 클릭</h3>
          <TodayLinkStats links={todayLinkStats} compact />
        </Card>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-2">
          <MiniCard label="이번 주" value={overview.week_clicks} color="purple" />
          <MiniCard label="이번 달" value={overview.month_clicks} color="orange" />
          <MiniCard label="전체" value={overview.total_clicks} color="blue" />
        </div>

        {/* 차트 */}
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">클릭 추이</h3>
            <PeriodSelector period={period} onChange={setPeriod} compact />
          </div>
          <div className="h-40 -ml-2">
            <ClickTrendChart data={filteredDailyClicks} compact />
          </div>
        </Card>

        {/* 전체 링크 순위 */}
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">전체 클릭 순위</h3>
          <LinkStatsSection links={sortedLinkStats} compact />
        </Card>
      </div>
    );
  }

  // ========== 데스크톱 ==========
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계</h1>
          <p className="mt-1 text-sm text-gray-600">링크 클릭 통계를 확인하세요</p>
        </div>
        <div className="flex items-center gap-3">
          {timeStr && <span className="text-xs text-gray-400">업데이트 {timeStr}</span>}
          <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
        </div>
      </div>

      {/* 오늘 히어로 섹션 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white lg:col-span-1">
          <p className="text-sm font-medium text-white/80">오늘의 클릭</p>
          <p className="mt-2 text-5xl font-extrabold">{overview.today_clicks.toLocaleString()}</p>
          <div className="mt-4 flex gap-4 text-sm text-white/70">
            <span>이번 주 <span className="font-semibold text-white">{overview.week_clicks.toLocaleString()}</span></span>
            <span>이번 달 <span className="font-semibold text-white">{overview.month_clicks.toLocaleString()}</span></span>
            <span>전체 <span className="font-semibold text-white">{overview.total_clicks.toLocaleString()}</span></span>
          </div>
        </div>

        {/* 오늘 링크별 클릭 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>오늘 링크별 클릭</CardTitle>
          </CardHeader>
          <CardContent>
            <TodayLinkStats links={todayLinkStats} />
          </CardContent>
        </Card>
      </div>

      {/* 클릭 추이 차트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>클릭 추이</CardTitle>
            <PeriodSelector period={period} onChange={setPeriod} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 mb-4">
            <MiniStat label="기간 합계" value={periodStats.total} />
            <MiniStat label="일 평균" value={periodStats.avg} />
            <MiniStat label="최고 기록" value={periodStats.peak} detail={periodStats.peakDate} />
          </div>
          <div className="h-64">
            <ClickTrendChart data={filteredDailyClicks} />
          </div>
        </CardContent>
      </Card>

      {/* 전체 링크 순위 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>전체 클릭 순위</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedLinkStats.length > 0 ? (
              <div className="h-72">
                <LinkBarChart links={sortedLinkStats.slice(0, 8)} />
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>링크별 상세 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkStatsSection links={sortedLinkStats} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============== Sub Components ============== */

function RefreshButton({
  onClick,
  isRefreshing,
  compact,
}: {
  onClick: () => void;
  isRefreshing: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isRefreshing}
      className={`flex items-center gap-1.5 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-60 ${
        compact
          ? "bg-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/30"
          : "border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
      }`}
    >
      <svg
        className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} ${isRefreshing ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {!compact && (isRefreshing ? "새로고침 중..." : "새로고침")}
    </button>
  );
}

function TodayLinkStats({ links, compact }: { links: LinkStatItem[]; compact?: boolean }) {
  if (links.length === 0) return <EmptyState />;

  const maxToday = Math.max(...links.map((l) => l.today_clicks), 1);
  const hasAnyClicks = links.some((l) => l.today_clicks > 0);

  if (!hasAnyClicks) {
    return (
      <div className={`flex flex-col items-center justify-center text-gray-400 ${compact ? "py-4" : "py-6"}`}>
        <p className={compact ? "text-xs" : "text-sm"}>오늘은 아직 클릭이 없습니다</p>
        <p className={`mt-1 ${compact ? "text-[10px]" : "text-xs"}`}>링크를 공유하고 클릭을 받아보세요</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3 max-h-56 overflow-y-auto pr-1"}>
      {links.map((link) => {
        const pct = maxToday > 0 ? (link.today_clicks / maxToday) * 100 : 0;
        return (
          <div key={link.link_id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className={`truncate font-medium text-gray-900 ${compact ? "text-xs" : "text-sm"}`}>
                {link.title}
              </h4>
              <span className={`flex-shrink-0 font-bold ${
                link.today_clicks > 0 ? "text-green-600" : "text-gray-300"
              } ${compact ? "text-sm" : "text-base"}`}>
                {link.today_clicks}
              </span>
            </div>
            <div className={`overflow-hidden rounded-full bg-gray-100 ${compact ? "h-1.5" : "h-2"}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: number; color: "blue" | "purple" | "orange" }) {
  const styles = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };
  return (
    <div className={`rounded-xl border p-2.5 text-center ${styles[color]}`}>
      <p className="text-[10px] opacity-70">{label}</p>
      <p className="text-lg font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function PeriodSelector({
  period,
  onChange,
  compact,
}: {
  period: Period;
  onChange: (p: Period) => void;
  compact?: boolean;
}) {
  const options: { value: Period; label: string }[] = [
    { value: "7d", label: "7일" },
    { value: "14d", label: "14일" },
    { value: "30d", label: "30일" },
  ];

  return (
    <div className={`flex rounded-lg border border-gray-200 bg-gray-50 ${compact ? "text-xs" : "text-sm"}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
            period === opt.value
              ? "bg-primary text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MiniStat({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value.toLocaleString()}</p>
      {detail && <p className="text-[10px] text-gray-400">{detail}</p>}
    </div>
  );
}

function ClickTrendChart({ data, compact }: { data: DailyClickData[]; compact?: boolean }) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: compact ? -20 : 0, bottom: 0 }}>
        <defs>
          <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          fontSize={compact ? 10 : 12}
          tick={{ fill: "#9ca3af" }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          interval={compact ? "preserveStartEnd" : Math.floor(data.length / 6)}
        />
        <YAxis
          fontSize={compact ? 10 : 12}
          tick={{ fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#clickGradient)"
          dot={false}
          activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = new Date(label || "");
  const formatted = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500">{formatted}</p>
      <p className="text-sm font-bold text-gray-900">{payload[0].value.toLocaleString()} 클릭</p>
    </div>
  );
}

const BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#818cf8", "#7c3aed", "#ddd6fe", "#e0e7ff",
];

function LinkBarChart({ links }: { links: { title: string; click_count: number }[] }) {
  const chartData = links.map((link) => ({
    name: link.title.length > 12 ? link.title.slice(0, 12) + "…" : link.title,
    fullName: link.title,
    clicks: link.click_count,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" fontSize={12} tick={{ fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" fontSize={12} tick={{ fill: "#374151" }} tickLine={false} axisLine={false} width={100} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-xs font-medium text-gray-900">{d.fullName}</p>
                <p className="text-sm font-bold text-indigo-600">{d.clicks.toLocaleString()} 클릭</p>
              </div>
            );
          }}
        />
        <Bar dataKey="clicks" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface LinkStatItem {
  link_id: string;
  title: string;
  url: string;
  click_count: number;
  today_clicks: number;
  week_clicks: number;
  month_clicks: number;
}

function LinkStatsSection({ links, compact }: { links: LinkStatItem[]; compact?: boolean }) {
  if (links.length === 0) return <EmptyState />;

  const maxClicks = Math.max(...links.map((l) => l.click_count), 1);

  return (
    <div className={`${compact ? "space-y-3" : "space-y-4 max-h-72 overflow-y-auto pr-1"}`}>
      {links.map((link, index) => {
        const pct = (link.click_count / maxClicks) * 100;
        return (
          <div key={link.link_id} className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`flex-shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-bold ${
                    compact ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs"
                  } flex items-center justify-center`}>
                    {index + 1}
                  </span>
                  <h4 className={`truncate font-medium text-gray-900 ${compact ? "text-sm" : ""}`}>
                    {link.title}
                  </h4>
                </div>
                <p className={`truncate text-gray-500 ${compact ? "text-[10px] ml-7" : "text-xs ml-8"}`}>
                  {link.url}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold text-gray-900 ${compact ? "text-base" : "text-lg"}`}>
                  {link.click_count.toLocaleString()}
                </p>
              </div>
            </div>
            <div className={`overflow-hidden rounded-full bg-gray-100 ${compact ? "h-1.5" : "h-2"}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className={`flex gap-3 ${compact ? "text-[10px] ml-7" : "text-xs ml-8"} text-gray-500`}>
              <span>오늘 <span className="font-medium text-green-600">{link.today_clicks}</span></span>
              <span>7일 <span className="font-medium text-gray-700">{link.week_clicks}</span></span>
              <span>30일 <span className="font-medium text-gray-700">{link.month_clicks}</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">아직 링크가 없습니다</p>
      <p className="mt-1 text-xs">링크를 추가하고 통계를 확인하세요</p>
    </div>
  );
}
