"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await analyticsApi.getAnalytics();
        setAnalytics(data);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch analytics:", err);
        setError("통계 데이터를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated]);

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
      </div>
    );
  }

  if (!analytics) return null;

  const { overview } = analytics;

  const overviewCards = [
    { title: "전체 클릭", value: overview.total_clicks, subtitle: "누적", color: "blue" as const },
    { title: "오늘", value: overview.today_clicks, subtitle: "today", color: "green" as const },
    { title: "이번 주", value: overview.week_clicks, subtitle: "최근 7일", color: "purple" as const },
    { title: "이번 달", value: overview.month_clicks, subtitle: "최근 30일", color: "orange" as const },
  ];

  if (isMobile) {
    return (
      <div className="px-4 py-3 space-y-4 pb-24">
        <p className="text-sm text-gray-600">링크 클릭 통계를 확인하세요</p>

        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-3">
          {overviewCards.map((card) => (
            <StatCard key={card.title} {...card} compact />
          ))}
        </div>

        {/* Period selector + Chart */}
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">클릭 추이</h3>
            <PeriodSelector period={period} onChange={setPeriod} compact />
          </div>

          <div className="flex gap-3 mb-3 text-xs">
            <MiniStat label="합계" value={periodStats.total} />
            <MiniStat label="일평균" value={periodStats.avg} />
            <MiniStat label="최고" value={periodStats.peak} />
          </div>

          <div className="h-40 -ml-2">
            <ClickTrendChart data={filteredDailyClicks} compact />
          </div>
        </Card>

        {/* Link stats */}
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">링크별 클릭</h3>
          <LinkStatsSection links={sortedLinkStats} compact />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">통계</h1>
        <p className="mt-1 text-sm text-gray-600">링크 클릭 통계를 확인하세요</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {overviewCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Click trend chart */}
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

      {/* Link stats with horizontal bar chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>링크별 클릭 순위</CardTitle>
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

function MiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value.toLocaleString()}</p>
      {detail && <p className="text-[10px] text-gray-400">{detail}</p>}
    </div>
  );
}

function ClickTrendChart({
  data,
  compact,
}: {
  data: DailyClickData[];
  compact?: boolean;
}) {
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
    <div className={`space-y-${compact ? "3" : "4"} ${!compact ? "max-h-72 overflow-y-auto pr-1" : ""}`}>
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
              <span>오늘 <span className="font-medium text-gray-700">{link.today_clicks}</span></span>
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

function StatCard({
  title,
  value,
  subtitle,
  color,
  compact,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: "blue" | "green" | "purple" | "orange";
  compact?: boolean;
}) {
  const styles = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", value: "text-blue-700" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", value: "text-green-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", value: "text-purple-700" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", value: "text-orange-700" },
  };
  const s = styles[color];

  return (
    <div className={`rounded-xl border ${s.bg} ${s.border} ${s.text} ${compact ? "p-3" : "p-4"}`}>
      <p className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{title}</p>
      <p className={`font-bold ${s.value} ${compact ? "mt-0.5 text-2xl" : "mt-1 text-3xl"}`}>
        {value.toLocaleString()}
      </p>
      <p className={`opacity-75 ${compact ? "mt-0.5 text-[10px]" : "mt-1 text-xs"}`}>{subtitle}</p>
    </div>
  );
}
