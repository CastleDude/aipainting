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
    daily_credits_title: messages.dashboard?.daily_credits_title || "Daily Credits",
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
    order_history: messages.dashboard?.order_history || "Order History",
    credits_log_label: messages.dashboard?.credits_log_label || "Credit Log",
    order_history_title: messages.dashboard?.order_history_title || "Order History",
    order_id: messages.dashboard?.order_id || "Order ID",
    user_label: messages.dashboard?.user_label || "User",
    country_label: messages.dashboard?.country_label || "Country",
    tier_label: messages.dashboard?.tier_label || "Plan",
    order_amount: messages.dashboard?.order_amount || "Amount",
    payment_method: messages.dashboard?.payment_method || "Payment Method",
    online_pay: messages.dashboard?.online_pay || "Online Payment",
    order_status: messages.dashboard?.order_status || "Status",
    order_time: messages.dashboard?.order_time || "Time",
    back_to_history: messages.dashboard?.back_to_history || "Back",
    no_orders: messages.dashboard?.no_orders || "No orders yet",
    loading: messages.dashboard?.loading || "Loading...",
    credits_title: messages.dashboard?.credits_title || "Credit History",
    credit_count: messages.dashboard?.credit_count || "Credits",
    type_label: messages.dashboard?.type_label || "Type",
    time_label: messages.dashboard?.time_label || "Date/Time",
    purpose_label: messages.dashboard?.purpose_label || "Purpose",
    change_label: messages.dashboard?.change_label || "Change",
    balance_label: messages.dashboard?.balance_label || "Balance",
    no_credit_records: messages.dashboard?.no_credit_records || "No credit records",
    credit_recharge: messages.dashboard?.credit_recharge || "Recharge",
    credit_bonus: messages.dashboard?.credit_bonus || "Bonus",
    credit_daily: messages.dashboard?.credit_daily || "Daily",
    credit_consume: messages.dashboard?.credit_consume || "Consume",
    credit_expire: messages.dashboard?.credit_expire || "Expired",
    credit_adjust: messages.dashboard?.credit_adjust || "Adjust",
    tier_free: messages.pricing?.free || "Free",
    tier_basic: messages.pricing?.basic || "Basic",
    tier_premium: messages.pricing?.premium || "Premium",
    tier_ultimate: messages.pricing?.ultimate || "Ultimate",
    status_completed: messages.dashboard?.status_completed || "Completed",
    status_refunded: messages.dashboard?.status_refunded || "Refunded",
    features_free: messages.pricing?.features_free as unknown as string[] || [],
    features_basic: messages.pricing?.features_basic as unknown as string[] || [],
    features_premium: messages.pricing?.features_premium as unknown as string[] || [],
    features_ultimate: messages.pricing?.features_ultimate as unknown as string[] || [],
    history_count: messages.dashboard?.history_count || "Last 20 records",
    manage_history: messages.dashboard?.manage_history || "Manage History",
    view: messages.dashboard?.view || "View",
    download: messages.dashboard?.download || "Download",
    remix: messages.history?.remix,
    edit: messages.history?.edit,
    delete: messages.history?.delete,
    batch_delete: messages.history?.batch_delete,
    select_all: messages.history?.select_all,
    cancel: messages.history?.cancel,
    confirm_delete: messages.history?.confirm_delete,
    deleted: messages.history?.deleted,
    today: messages.history?.today,
    yesterday: messages.history?.yesterday,
    feedback_title: messages.dashboard?.feedback_title,
    feedback_success: messages.dashboard?.feedback_success,
    feedback_placeholder: messages.dashboard?.feedback_placeholder,
    feedback_submit: messages.dashboard?.feedback_submit,
    feedback_submitting: messages.dashboard?.feedback_submitting,
  };

  return <Dashboard locale={locale} messages={dashboardMessages} />;
}
