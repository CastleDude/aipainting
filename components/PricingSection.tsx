"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { TIER_CONFIG } from "@/lib/credits";

interface PricingSectionProps {
  messages: {
    title: string;
    subtitle: string;
    free: string;
    basic: string;
    premium: string;
    ultimate: string;
    month: string;
    fast_images: string;
    get_started: string;
    subscribe: string;
    per_month: string;
    daily: string;
    faq_title: string;
    faq_q1: string; faq_a1: string;
    faq_q2: string; faq_a2: string;
    faq_q3: string; faq_a3: string;
    faq_q4: string; faq_a4: string;
    faq_q5: string; faq_a5: string;
    faq_q6: string; faq_a6: string;
    most_popular: string;
    redirecting: string;
    features_free: string[];
    features_basic: string[];
    features_premium: string[];
    features_ultimate: string[];
  };
}

export function PricingSection({ messages }: PricingSectionProps) {
  const plans = [
    {
      key: "free" as const,
      highlight: false,
      monthly: TIER_CONFIG.free.price,
      images: String(TIER_CONFIG.free.monthlyCredits),
      period: "monthly" as const,
      features: messages.features_free?.length ? messages.features_free : TIER_CONFIG.free.features,
    },
    {
      key: "basic" as const,
      highlight: false,
      monthly: TIER_CONFIG.basic.price,
      images: TIER_CONFIG.basic.monthlyCredits!.toLocaleString(),
      period: "per_month" as const,
      features: messages.features_basic?.length ? messages.features_basic : TIER_CONFIG.basic.features,
    },
    {
      key: "premium" as const,
      highlight: true,
      monthly: TIER_CONFIG.premium.price,
      images: TIER_CONFIG.premium.monthlyCredits!.toLocaleString(),
      period: "per_month" as const,
      features: messages.features_premium?.length ? messages.features_premium : TIER_CONFIG.premium.features,
    },
    {
      key: "ultimate" as const,
      highlight: false,
      monthly: TIER_CONFIG.ultimate.price,
      images: TIER_CONFIG.ultimate.monthlyCredits!.toLocaleString(),
      period: "per_month" as const,
      features: messages.features_ultimate?.length ? messages.features_ultimate : TIER_CONFIG.ultimate.features,
    },
  ];
  const { user } = useAuth();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    setCheckingOut(tier);
    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, locale: document.documentElement.lang }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setToast(data.error || "Failed to create checkout");
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setToast("Network error. Please try again.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setCheckingOut(null);
    }
  };

  const handleClick = (tier: string) => {
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("open-login-modal", { detail: { mode: "signup" as const } })
      );
      return;
    }
    handleSubscribe(tier);
  };

  return (
    <section className="py-20 sm:py-28">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-red-500/90 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-5 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{messages.title}</h2>
          <p className="text-lg text-text-secondary">{messages.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                "relative rounded-2xl border p-8 transition-all",
                plan.highlight
                  ? "border-accent bg-bg-card glow-accent scale-[1.02]"
                  : "border-border bg-bg-card hover:border-accent/30"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-white">
                  {messages.most_popular}
                </div>
              )}

              <h3 className="mb-2 text-xl font-bold">
                {plan.key === "free"
                  ? messages.free
                  : plan.key === "basic"
                    ? messages.basic
                    : plan.key === "premium"
                      ? messages.premium
                      : messages.ultimate}
              </h3>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.monthly === 0 ? messages.free : `$${plan.monthly}`}
                </span>
                {plan.monthly > 0 && (
                  <span className="text-text-muted">{messages.month}</span>
                )}
              </div>

              <div className="mb-6">
                <span className="font-semibold text-accent">{plan.images}</span>{" "}
                <span className="text-text-secondary">{messages.fast_images}</span>
                <span className="text-text-muted text-sm">
                  {" "}
                  ({messages.per_month})
                </span>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.monthly === 0 ? (
                <a
                  href="/generate"
                  className={cn(
                    "block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all",
                    "border border-border text-text-primary hover:border-accent/50"
                  )}
                >
                  {messages.get_started}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleClick(plan.key)}
                  disabled={checkingOut === plan.key}
                  className={cn(
                    "block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all cursor-pointer",
                    plan.highlight
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "border border-border text-text-primary hover:border-accent/50"
                  )}
                >
                  {checkingOut === plan.key ? messages.redirecting : messages.subscribe}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          所有付款均为最终交易，虚拟数字商品一经购买即视为交付完成，不支持退款。
        </p>

        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl text-white">
              {messages.faq_title}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["faq_q1", "faq_a1"],
              ["faq_q2", "faq_a2"],
              ["faq_q3", "faq_a3"],
              ["faq_q4", "faq_a4"],
              ["faq_q5", "faq_a5"],
              ["faq_q6", "faq_a6"],
            ].map(([q, a], i) => (
              <div key={q} className="py-4">
                <h3 className="text-base font-semibold text-text-primary mb-2">
                  <span className="text-accent mr-2">
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  {messages[q as keyof typeof messages]}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed pl-7">
                  {messages[a as keyof typeof messages]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
