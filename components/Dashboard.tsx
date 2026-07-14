"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getTierConfig } from "@/lib/credits";
import { getMockGenerations, toggleMockGenerationPublic } from "@/lib/generations";
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
  view: string;
  download: string;
  feedback_title?: string;
  feedback_success?: string;
  feedback_placeholder?: string;
  feedback_submit?: string;
  feedback_submitting?: string;
}

export function Dashboard({ locale, messages }: { locale: string; messages: DashboardMessages }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { profile, user, loading } = useAuth();
  const localePath = `/${locale}`;
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerAlt, setViewerAlt] = useState("");
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

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Main content */}
          <div className="space-y-6 lg:order-2">
            {/* Generation history */}
            <div className="rounded-xl border border-border/50 bg-bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-text-primary">{messages.history}</h2>
                <span className="text-xs text-text-muted">{messages.history_count}</span>
                <div className="flex-1" />
                <a
                  href={`${localePath}/history`}
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  {messages.manage_history} →
                </a>
              </div>
              {generations.length === 0 ? (
                <p className="text-sm text-text-muted py-8 text-center">{messages.no_history}</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {generations.map((gen) => (
                    <div
                      key={gen.id}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-border/30 hover:border-accent/40 transition-colors"
                    >
                      <img
                        src={gen.image_url}
                        alt={gen.prompt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pb-6">
                        <button
                          onClick={() => { setViewerSrc(gen.image_url); setViewerAlt(gen.prompt); }}
                          className="rounded-full bg-white/20 p-2 text-white hover:bg-white/35 transition-colors cursor-pointer"
                          title={messages.view}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(gen.image_url);
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `ai-painting-${Date.now()}.png`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch { window.open(gen.image_url, "_blank"); }
                          }}
                          className="rounded-full bg-white/20 p-2 text-white hover:bg-white/35 transition-colors cursor-pointer"
                          title={messages.download}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                      </div>
                      {/* Gallery share badge */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePublic(gen.id); }}
                        className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
                          gen.is_public
                            ? "bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent-hover"
                            : "bg-black/40 text-white/25 hover:text-white/60 hover:bg-black/50"
                        }`}
                        title={gen.is_public ? "Remove from gallery" : "Share to gallery"}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x={3} y={3} width={7} height={7} rx={1} />
                          <rect x={14} y={3} width={7} height={7} rx={1} />
                          <rect x={3} y={14} width={7} height={7} rx={1} />
                          <rect x={14} y={14} width={7} height={7} rx={1} />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:order-1">
            {/* Account info */}
            <div className="rounded-xl border border-border/50 bg-bg-card p-6">
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
            <div className="rounded-xl border border-border/50 bg-bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                {messages.monthly_credits || "Monthly Credits"}
              </h2>

              {/* Unified credits usage bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">{messages.images_this_month || "This month"}</span>
                  <span className="text-text-secondary font-medium">
                    {monthlyUsed} / {monthlyCredits} {messages.used || "used"}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-bg-primary/70 border border-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 min-w-[2px]"
                    style={{ width: `${Math.max(monthlyPct, 1)}%` }}
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
            </div>


            {/* Plan features */}
            <div className="rounded-xl border border-border/50 bg-bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">{messages.plan_features}</h2>
              <ul className="space-y-2">
                {tierConfig.features.map((f: string, i: number) => (
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
            <div className="rounded-xl border border-border/50 bg-bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">{messages.feedback_title || "留言反馈"}</h2>
              <FeedbackForm messages={messages} />
            </div>
            {/* Quick actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={localePath}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-bg-card p-4 hover:border-accent/30 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-primary">{messages.generate_now}</span>
              </a>
              <a
                href={`${localePath}/image-tools`}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-bg-card p-4 hover:border-accent/30 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-primary">{messages.image_tools}</span>
              </a>
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
