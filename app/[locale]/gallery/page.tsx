import type { Metadata } from "next";
import GalleryPageClient from "@/components/GalleryPage";

const META: Record<string, { title: string; description: string }> = {
  en: { title: "Community Gallery — AI Painting", description: "Explore AI-generated images shared by the community." },
  zh: { title: "社区画廊 — AI 画境", description: "浏览社区分享的 AI 生成图片。" },
  "zh-Hant": { title: "社群畫廊 — AI 畫境", description: "瀏覽社群分享的 AI 生成圖片。" },
  ja: { title: "コミュニティギャラリー — AI ペインティング", description: "コミュニティが共有するAI生成画像を探索しましょう。" },
  ko: { title: "커뮤니티 갤러리 — AI 페인팅", description: "커뮤니티가 공유한 AI 생성 이미지를 둘러보세요." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = META[locale] || META.en;
  return { title: meta.title, description: meta.description };
}

export default function Page() {
  return <GalleryPageClient />;
}
