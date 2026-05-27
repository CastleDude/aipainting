import { getTranslations } from "next-intl/server";
import { GenerationHistory } from "@/components/GenerationHistory";
import type { Metadata } from "next";

const HISTORY_META: Record<string, { title: string; description: string }> = {
  en: { title: "Generation History — AI Painting", description: "View and manage your AI-generated images. Download, remix, or delete your past creations." },
  zh: { title: "生成历史 — AI 画境", description: "查看和管理您的 AI 生成图片。下载、再创作或删除您的历史作品。" },
  "zh-Hant": { title: "生成歷史 — AI 畫境", description: "查看和管理您的 AI 生成圖片。下載、再創作或刪除您的歷史作品。" },
  ja: { title: "生成履歴 — AI ペインティング", description: "AI生成画像を表示・管理。過去の作品をダウンロード、リミックス、削除できます。" },
  ko: { title: "생성 기록 — AI 페인팅", description: "AI 생성 이미지를 확인하고 관리하세요. 과거 작품을 다운로드, 리믹스, 삭제할 수 있습니다." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = HISTORY_META[locale] || HISTORY_META.en;
  return { title: meta.title, description: meta.description };
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  const messages = {
    title: t("history.title"),
    history_count: t("history.history_count"),
    no_history: t("history.no_history"),
    view: t("history.view"),
    download: t("history.download"),
    remix: t("history.remix"),
    edit: t("history.edit"),
    delete: t("history.delete"),
    batch_delete: t("history.batch_delete"),
    select_all: t("history.select_all"),
    cancel: t("history.cancel"),
    confirm_delete: t("history.confirm_delete"),
    deleted: t("history.deleted"),
    save_reminder: t("dashboard.save_reminder"),
    share_limit: t("generate.share_limit"),
    share_similar: t("generate.share_similar"),
  };

  return <GenerationHistory locale={locale} messages={messages} />;
}
