import type { Metadata } from "next";

const GALLERY_META: Record<string, { title: string; description: string }> = {
  en: { title: "Community Gallery — AI Painting", description: "Explore AI-generated artwork shared by the community. Browse stunning images created with our AI image generator." },
  zh: { title: "社区画廊 — AI 画境", description: "探索社区分享的 AI 生成艺术作品。浏览使用我们的 AI 图像生成器创作的惊艳图片。" },
  "zh-Hant": { title: "社群畫廊 — AI 畫境", description: "探索社群分享的 AI 生成藝術作品。瀏覽使用我們的 AI 圖像生成器創作的驚艷圖片。" },
  ja: { title: "コミュニティギャラリー — AI ペインティング", description: "コミュニティが共有するAI生成アート作品をご覧ください。AI画像ジェネレーターで作成された素晴らしい画像を探索しましょう。" },
  ko: { title: "커뮤니티 갤러리 — AI 페인팅", description: "커뮤니티가 공유한 AI 생성 작품을 둘러보세요. AI 이미지 생성기로 만든 멋진 이미지를 탐색해보세요." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = GALLERY_META[locale] || GALLERY_META.en;
  return { title: meta.title, description: meta.description };
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
