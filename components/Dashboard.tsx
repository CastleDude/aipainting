"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getTierConfig } from "@/lib/credits";
import { getMockGenerations, toggleMockGenerationPublic } from "@/lib/generations";
import { GenerationHistory } from "@/components/GenerationHistory";
import { OrderHistory } from "@/components/OrderHistory";
import { ImageViewer } from "@/components/ImageViewer";
import type { Generation } from "@/lib/generations";

interface DashboardMessages {
  title: string;
  welcome: string;
  current_plan: string;
  free_plan: string;
  basic_plan: string;
  premium_plan: string;
  ultimate_plan: string;
  upgrade_now: string;
  manage_plan: string;
  daily_usage: string;
  monthly_credits: string;
  daily_credits_title: string;
  used: string;
  remaining: string;
  images_today: string;
  images_this_month: string;
  account_info: string;
  member_since: string;
  email: string;
  name: string;
  plan_features: string;
  logout: string;
  upgrade_to_unlock: string;
  free_quota_label: string;
  tools_access: string;
  history: string;
  no_history: string;
  coming_soon: string;
  generate_now: string;
  image_tools: string;
  tools_daily_usage: string;
  history_count: string;
  manage_history: string;
  order_history: string;
  order_history_title: string;
  order_id: string;
  user_label: string;
  country_label: string;
  tier_label: string;
  order_amount: string;
  payment_method: string;
  online_pay: string;
  order_status: string;
  order_time: string;
  back_to_history: string;
  no_orders: string;
  loading: string;
  tier_free: string;
  tier_basic: string;
  tier_premium: string;
  tier_ultimate: string;
  status_completed: string;
  status_refunded: string;
  features_free: string[];
  features_basic: string[];
  features_premium: string[];
  features_ultimate: string[];
  view: string;
  download: string;
  feedback_title?: string;
  feedback_success?: string;
  feedback_placeholder?: string;
  feedback_submit?: string;
  feedback_submitting?: string;
  share_limit?: string;
  share_similar?: string;
  remix?: string;
  edit?: string;
  delete?: string;
  batch_delete?: string;
  select_all?: string;
  cancel?: string;
  confirm_delete?: string;
  deleted?: string;
  today?: string;
  yesterday?: string;
}

export function Dashboard({ locale, messages }: { locale: string; messages: DashboardMessages }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { profile, user, loading } = useAuth();
  const localePath = `/${locale}`;
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerAlt, setViewerAlt] = useState("");
  const [showOrders, setShowOrders] = useState(false);
  const isDevMock = typeof window !== "undefined" && process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true";

  useEffect(() => {
    if (!mounted) return;
    if (isDevMock) {
      setGenerations(getMockGenerations());
      // Listen for localStorage changes across tabs
      const onStorage = () => setGenerations(getMockGenerations());
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
    if (!user) return;
    fetch(`/api/generations?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations || []))
      .catch(() => {});
  }, [mounted, user, isDevMock]);

  // Wait until client hydration to avoid SSR mismatch
  if (!mounted || loading) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-bg-card" />
            <div className="h-40 rounded-xl bg-bg-card" />
            <div className="h-60 rounded-xl bg-bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  const tier = profile.tier;
  const tierConfig = getTierConfig(tier);
  const credits = profile.credits ?? 0;
  const monthlyCredits = tierConfig.monthlyCredits;
  const monthlyUsed = Math.max(0, monthlyCredits - credits);
  const monthlyPct = monthlyCredits ? Math.min(100, (monthlyUsed / monthlyCredits) * 100) : 0;

  const featureMap: Record<string, string[]> = {
    free: messages.features_free,
    basic: messages.features_basic,
    premium: messages.features_premium,
    ultimate: messages.features_ultimate,
  };
  const planFeatures = featureMap[tier]?.length ? featureMap[tier] : tierConfig.features;

  const handleTogglePublic = async (id: string) => {
    if (isDevMock) {
      const newVal = toggleMockGenerationPublic(id);
      if (newVal !== null) {
        setGenerations((prev) => prev.map((g) => g.id === id ? { ...g, is_public: newVal } : g));
      }
      return;
    }
    const item = generations.find((g) => g.id === id);
    if (!item) return;
    const newVal = !item.is_public;
    setGenerations((prev) => prev.map((g) => g.id === id ? { ...g, is_public: newVal } : g));
    try {
      await fetch("/api/generations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_public: newVal }),
      });
    } catch {
      setGenerations((prev) => prev.map((g) => g.id === id ? { ...g, is_public: !newVal } : g));
    }
  };

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const tierBadgeColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    premium: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    ultimate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-baseline gap-5">
          <h1 className="text-2xl font-bold text-text-primary">{messages.title}</h1>
          <p className="text-text-muted">
            {messages.welcome}, {profile.name || user.email?.split("@")[0]}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Main content */}
          <div className="space-y-6 lg:order-2">

            {/* Generation history or Order history */}
            {showOrders ? (
              <OrderHistory
                onBack={() => setShowOrders(false)}
                messages={{
                  order_history_title: messages.order_history_title || "Order History",
                  order_id: messages.order_id || "Order ID",
                  user: messages.user_label || "User",
                  country: messages.country_label || "Country",
                  tier: messages.tier_label || "Plan",
                  amount: messages.order_amount || "Amount",
                  payment_method: messages.payment_method || "Payment",
                  online_pay: messages.online_pay || "Online Payment",
                  status: messages.order_status || "Status",
                  time: messages.order_time || "Time",
                  back: messages.back_to_history || "Back",
                  loading: messages.loading || "Loading...",
                  no_orders: messages.no_orders || "No orders yet",
                  tier_free: messages.tier_free || "Free",
                  tier_basic: messages.tier_basic || "Basic",
                  tier_premium: messages.tier_premium || "Premium",
                  tier_ultimate: messages.tier_ultimate || "Ultimate",
                  status_completed: messages.status_completed || "Completed",
                  status_refunded: messages.status_refunded || "Refunded",
                  status_pending: "Pending",
                  status_active: "Active",
                  status_canceled: "Canceled",
                  status_expired: "Expired",
                }}
              />
            ) : (
              <div className="rounded-xl border border-border/50 bg-bg-card p-4">
              <GenerationHistory locale={locale} messages={{
                title: messages.history || "History",
                history_count: messages.history_count || "",
                no_history: messages.no_history || "No history yet",
                view: messages.view || "View",
                download: messages.download || "Download",
                remix: messages.remix || "Remix", edit: messages.edit || "Edit", delete: messages.delete || "Delete",
                batch_delete: messages.batch_delete || "Delete Selected", select_all: messages.select_all || "Select All",
                cancel: messages.cancel || "Cancel", confirm_delete: messages.confirm_delete || "Confirm Delete",
                deleted: messages.deleted || "Deleted", save_reminder: "",
                share_limit: messages.share_limit || "",
                share_similar: messages.share_similar || "",
                today: messages.today || "Today", yesterday: messages.yesterday || "Yesterday",
              }} />
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:order-1">
            {/* Account info */}
            <div className="rounded-xl border border-border/50 bg-bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">{messages.account_info}</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{messages.name}</span>
                  <span className="text-text-primary font-medium">{profile.name || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{messages.email}</span>
                  <span className="text-text-primary font-medium truncate ml-2 max-w-[160px]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{messages.current_plan}</span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tierBadgeColors[tier] || tierBadgeColors.free
                    }`}
                  >
                    {tierConfig.name}
                  </span>
                </div>
                {memberSince && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">{messages.member_since}</span>
                    <span className="text-text-primary">{memberSince}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Credit usage card */}
            <div className="rounded-xl border border-border/50 bg-bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                {tier === "free"
                  ? (messages.daily_credits_title || "Daily Credits")
                  : (messages.monthly_credits || "Monthly Credits")}
              </h2>

              {/* Unified credits usage bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">{tier === "free" ? (messages.daily_usage || "Today") : (messages.images_this_month || "This month")}</span>
                  <span className="text-text-secondary font-medium">
                    {tier === "free"
                      ? `${Math.min(10, Math.max(0, 10 - credits))} / ${monthlyCredits} ${messages.used || "used"}`
                      : `${monthlyUsed} / ${monthlyCredits} ${messages.used || "used"}`}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-bg-primary/70 border border-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 min-w-[2px]"
                    style={{ width: `${Math.max(tier === "free" ? Math.min(100, ((10 - credits) / 10) * 100) : monthlyPct, 1)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  {credits} {messages.remaining || "remaining"}
                </p>
              </div>

              {tier === "free" && (
                <div className="mt-4 rounded-lg bg-accent/5 border border-accent/20 p-4">
                  <p className="text-sm text-text-secondary">{messages.upgrade_to_unlock}</p>
                  <a
                    href={`${localePath}/pricing`}
                    className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
                  >
                    {messages.upgrade_now}
                  </a>
                </div>
              )}

              {/* Credits log entry */}
              <a
                href={`${localePath}/dashboard/credits`}
                className="mt-4 w-full flex items-center justify-between rounded-lg bg-white/5 border border-white/5 p-3 text-sm text-text-secondary hover:text-white hover:bg-white/15 hover:border-white/15 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  积分明细
                </span>
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Order history entry */}
              <button
                onClick={() => setShowOrders(true)}
                className="mt-4 w-full flex items-center justify-between rounded-lg bg-white/5 border border-white/5 p-3 text-sm text-text-secondary hover:text-white hover:bg-white/15 hover:border-white/15 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {messages.order_history || "历史订单"}
                </span>
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>


            {/* Plan features */}
            <div className="rounded-xl border border-border/50 bg-bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">{messages.plan_features}</h2>
              <ul className="space-y-2">
                {planFeatures.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {tier !== "free" && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/creem/portal", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ locale }),
                        });
                        const data = await res.json();
                        if (data.portalUrl) {
                          window.location.href = data.portalUrl;
                        } else {
                          window.location.href = `${localePath}/pricing`;
                        }
                      } catch {
                        window.location.href = `${localePath}/pricing`;
                      }
                    }}
                    className="text-sm text-accent hover:text-accent-hover transition-colors"
                  >
                    {messages.manage_plan}
                  </button>
                </div>
              )}
            </div>

            {/* Feedback */}
            <div className="rounded-xl border border-border/50 bg-bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">{messages.feedback_title || "留言反馈"}</h2>
              <FeedbackForm messages={messages} />
            </div>
          </div>
        </div>
      </div>

      {/* Image viewer */}
      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt={viewerAlt}
          onClose={() => setViewerSrc(null)}
        />
      )}
    </div>
  );
}

function FeedbackForm({ messages }: { messages?: DashboardMessages }) {
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!msg.trim() || msg.length > 200) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg.trim() }) });
      if (res.ok) { setSent(true); setMsg(""); }
    } catch {}
    setSubmitting(false);
  };

  if (!user) return null;
  if (sent) return <p className="text-sm text-green-400">{messages?.feedback_success || "留言已提交，感谢反馈！"}</p>;

  return (
    <div className="space-y-3">
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={messages?.feedback_placeholder || "写下你的建议或反馈...(最多200字)"}
        maxLength={200}
        rows={3}
        className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-muted">{msg.length}/200</span>
        <button
          onClick={submit}
          disabled={!msg.trim() || submitting}
          className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          {submitting ? (messages?.feedback_submitting || "提交中...") : (messages?.feedback_submit || "提交留言")}
        </button>
      </div>
    </div>
  );
}
