import { getMessages } from "next-intl/server";
import { Dashboard } from "@/components/Dashboard";
import type { Metadata } from "next";

const DASHBOARD_META: Record<string, { title: string; description: string }> = {
  en: { title: "Dashboard — AI Painting", description: "Manage your account, track usage, and upgrade your plan. View your AI image generation stats at a glance." },
  zh: { title: "仪表板 — AI 画境", description: "管理您的账户，追踪使用情况，升级套餐。一目了然地查看 AI 图像生成统计数据。" },
  "zh-Hant": { title: "儀表板 — AI 畫境", description: "管理您的帳戶，追蹤使用情況，升級方案。一目了然地查看 AI 圖像生成統計數據。" },
  ja: { title: "ダッシュボード — AI ペインティング", description: "アカウント管理、使用状況の追跡、プランのアップグレード。AI画像生成の統計を一目で確認。" },
  ko: { title: "대시보드 — AI 페인팅", description: "계정 관리, 사용량 추적, 플랜 업그레이드. AI 이미지 생성 통계를 한눈에 확인하세요." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = DASHBOARD_META[locale] || DASHBOARD_META.en;
  return { title: meta.title, description: meta.description };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  const dashboardMessages = {
    title: messages.dashboard?.title || "Dashboard",
    welcome: messages.dashboard?.welcome || "Welcome back",
    current_plan: messages.dashboard?.current_plan || "Current Plan",
    free_plan: messages.dashboard?.free_plan || "Free",
    basic_plan: messages.dashboard?.basic_plan || "Basic",
    premium_plan: messages.dashboard?.premium_plan || "Premium",
    ultimate_plan: messages.dashboard?.ultimate_plan || "Ultimate",
    upgrade_now: messages.dashboard?.upgrade_now || "Upgrade Now",
    manage_plan: messages.dashboard?.manage_plan || "Manage Plan",
    daily_usage: messages.dashboard?.daily_usage || "Daily Usage",
    monthly_credits: messages.dashboard?.monthly_credits || "Monthly Credits",
    used: messages.dashboard?.used || "used",
    remaining: messages.dashboard?.remaining || "remaining",
    images_today: messages.dashboard?.images_today || "Images Today",
    images_this_month: messages.dashboard?.images_this_month || "Images This Month",
    account_info: messages.dashboard?.account_info || "Account Info",
    member_since: messages.dashboard?.member_since || "Member Since",
    email: messages.dashboard?.email || "Email",
    name: messages.dashboard?.name || "Name",
    plan_features: messages.dashboard?.plan_features || "Plan Features",
    logout: messages.dashboard?.logout || "Log Out",
    upgrade_to_unlock: messages.dashboard?.upgrade_to_unlock || "Upgrade to unlock unlimited generations, priority queue, and all premium models.",
    free_quota_label: messages.dashboard?.free_quota_label || "Free Daily Quota",
    tools_access: messages.dashboard?.tools_access || "Advanced AI Tools",
    history: messages.dashboard?.history || "Generation History",
    no_history: messages.dashboard?.no_history || "No generations yet",
    coming_soon: messages.dashboard?.coming_soon || "Coming Soon",
    generate_now: messages.dashboard?.generate_now || "Generate Now",
    image_tools: messages.dashboard?.image_tools || "Image Tools",
    tools_daily_usage: messages.dashboard?.tools_daily_usage || "Image Tools Daily",
    history_count: messages.dashboard?.history_count || "Last 20 records",
    manage_history: messages.dashboard?.manage_history || "Manage History",
    view: messages.dashboard?.view || "View",
    download: messages.dashboard?.download || "Download",
    feedback_title: messages.dashboard?.feedback_title,
    feedback_success: messages.dashboard?.feedback_success,
    feedback_placeholder: messages.dashboard?.feedback_placeholder,
    feedback_submit: messages.dashboard?.feedback_submit,
    feedback_submitting: messages.dashboard?.feedback_submitting,
  };

  return <Dashboard locale={locale} messages={dashboardMessages} />;
}
