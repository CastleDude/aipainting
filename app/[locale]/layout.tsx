import type { Metadata } from "next";
import { PHBanner } from "@/components/PHBanner";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LOCALE_META: Record<string, { title: string; description: string }> = {
  en: {
    title: "AI Painting — Free Unlimited AI Image Generator",
    description: "Create stunning AI-generated images with the latest models. Free, unlimited, no sign-up required. Powered by Flux Schnell, SDXL, Gemini, GPT-5 & more.",
  },
  zh: {
    title: "AI 画境 — 免费无限 AI 图片生成器",
    description: "使用最新 AI 模型创建惊艳图片。无需注册，免费无限使用。支持 Flux Schnell、SDXL、Gemini、GPT-5 等顶级模型。",
  },
  "zh-Hant": {
    title: "AI 畫境 — 免費無限 AI 圖片生成器",
    description: "使用最新 AI 模型創建驚艷圖片。無需註冊，免費無限使用。支援 Flux Schnell、SDXL、Gemini、GPT-5 等頂級模型。",
  },
  ja: {
    title: "AI ペインティング — 無料・無制限のAI画像ジェネレーター",
    description: "最新のAIモデルで魅力的な画像を作成。登録不要、無料・無制限。Flux Schnell、SDXL、Gemini、GPT-5などに対応。",
  },
  ko: {
    title: "AI 페인팅 — 무료 무제한 AI 이미지 생성기",
    description: "최신 AI 모델로 멋진 이미지를 만드세요. 등록 불필요, 무료 무제한 사용. Flux Schnell, SDXL, Gemini, GPT-5 등 지원.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOCALE_META[locale] || LOCALE_META.en;

  return {
    title: meta.title,
    description: meta.description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    icons: { icon: "/images/aipaintinglogo.jpg" },
    keywords: [
      "AI image generator", "free AI art", "unlimited AI images", "text to image",
      "AI painting", "free AI image creator", "image generation",
    ],
    robots: { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      siteName: "AI Painting",
      locale: locale === "zh" ? "zh_CN" : locale === "zh-Hant" ? "zh_TW" : locale,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      languages: {
        en: "/en",
        zh: "/zh",
        "zh-Hant": "/zh-Hant",
        ja: "/ja",
        ko: "/ko",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const headerMessages = {
    home: messages.header?.home || "Home",
    generate: messages.header?.generate || "Generate",
    pricing: messages.header?.pricing || "Pricing",
    image_tools: messages.header?.image_tools || "Image Tools",
    gallery: messages.header?.gallery || "Gallery",
    history: messages.header?.history || "History",
    dashboard: messages.header?.dashboard || "Dashboard",
    upgrade: messages.header?.upgrade || "Upgrade",
    admin: messages.header?.admin || "Admin",
    login: messages.header?.login || "Log In",
    signup: messages.header?.signup || "Sign Up Free",
    logout: messages.header?.logout || "Log Out",
    free_remaining: messages.header?.free_remaining || "{count} left today",
    credits_remaining: messages.header?.credits_remaining || "{count} credits",
    daily_credits: messages.header?.daily_credits || "{count}/10 daily",
    guest_credits: (messages as any).generate?.guest_credits,
  };
  const loginModalMessages = messages.login_modal;
  const footerMessages = {
    copyright: messages.footer?.copyright || "© 2025 AI Painting.",
    terms: messages.footer?.terms || "Terms",
    privacy: messages.footer?.privacy || "Privacy",
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg-primary text-text-primary">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header locale={locale} messages={headerMessages} loginModalMessages={loginModalMessages} />
            <main className="flex-1 relative z-[1]">
              {children}
            </main>
            <PHBanner locale={locale} messages={{ ph_title: messages.ph_title || "We're live on Product Hunt!", ph_subtitle: messages.ph_subtitle || "Your support means the world to us 💜", ph_vote: messages.ph_vote || "Vote for us →" }} />
            <Footer locale={locale} messages={footerMessages} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
