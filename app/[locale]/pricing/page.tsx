import { getTranslations } from "next-intl/server";
import { PricingSection } from "@/components/PricingSection";
import type { Metadata } from "next";

const PRICING_META: Record<string, { title: string; description: string }> = {
  en: { title: "Pricing — AI Painting", description: "Simple, transparent pricing. Start free, upgrade when you need more power. Plans from $6/month." },
  zh: { title: "定价 — AI 画境", description: "简洁透明的定价。免费开始，需要时升级。套餐低至 $6/月。" },
  "zh-Hant": { title: "定價 — AI 畫境", description: "簡潔透明的定價。免費開始，需要時升級。方案低至 $6/月。" },
  ja: { title: "料金プラン — AI ペインティング", description: "シンプルで透明な料金体系。無料で始めて、必要なときにアップグレード。月額6ドルから。" },
  ko: { title: "요금제 — AI 페인팅", description: "간단하고 투명한 요금제. 무료로 시작하고 필요할 때 업그레이드하세요. 월 $6부터." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = PRICING_META[locale] || PRICING_META.en;
  return { title: meta.title, description: meta.description };
}

export default async function PricingPage() {
  const t = await getTranslations();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Painting",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", description: "20 images/day, basic models" },
      { "@type": "Offer", name: "Basic", price: "6", priceCurrency: "USD", description: "500 credits/month, all models, priority queue" },
      { "@type": "Offer", name: "Premium", price: "10", priceCurrency: "USD", description: "2,000 credits/month, all models, priority queue" },
      { "@type": "Offer", name: "Ultimate", price: "20", priceCurrency: "USD", description: "5,000 credits/month, all models, top priority, early access" },
    ],
  };

  return (
    <div className="pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PricingSection
        messages={{
          title: t("pricing.title"),
          subtitle: t("pricing.subtitle"),
          free: t("pricing.free"),
          basic: t("pricing.basic"),
          premium: t("pricing.premium"),
          ultimate: t("pricing.ultimate"),
          month: t("pricing.month"),
          fast_images: t("pricing.fast_images"),
          get_started: t("pricing.get_started"),
          subscribe: t("pricing.subscribe"),
          per_month: t("pricing.per_month"),
          daily: t("pricing.daily"),
          faq_title: t("pricing.faq_title"),
          faq_q1: t("pricing.faq_q1"), faq_a1: t("pricing.faq_a1"),
          faq_q2: t("pricing.faq_q2"), faq_a2: t("pricing.faq_a2"),
          faq_q3: t("pricing.faq_q3"), faq_a3: t("pricing.faq_a3"),
          faq_q4: t("pricing.faq_q4"), faq_a4: t("pricing.faq_a4"),
          faq_q5: t("pricing.faq_q5"), faq_a5: t("pricing.faq_a5"),
          faq_q6: t("pricing.faq_q6"), faq_a6: t("pricing.faq_a6"),
          most_popular: t("pricing.most_popular"),
          redirecting: t("pricing.redirecting"),
          features_free: t("pricing.features_free") as unknown as string[],
          features_basic: t("pricing.features_basic") as unknown as string[],
          features_premium: t("pricing.features_premium") as unknown as string[],
          features_ultimate: t("pricing.features_ultimate") as unknown as string[],
        }}
      />
    </div>
  );
}
