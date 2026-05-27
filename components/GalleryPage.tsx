"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImageViewer } from "@/components/ImageViewer";
import { getMockGalleryItems } from "@/lib/generations";

export const GALLERY_META: Record<string, { title: string; description: string }> = {
  en: { title: "Community Gallery — AI Painting", description: "Explore AI-generated images shared by the community." },
  zh: { title: "社区画廊 — AI 画境", description: "浏览社区分享的 AI 生成图片。" },
  "zh-Hant": { title: "社群畫廊 — AI 畫境", description: "瀏覽社群分享的 AI 生成圖片。" },
  ja: { title: "コミュニティギャラリー — AI ペインティング", description: "コミュニティが共有するAI生成画像を探索しましょう。" },
  ko: { title: "커뮤니티 갤러리 — AI 페인팅", description: "커뮤니티가 공유한 AI 생성 이미지를 둘러보세요." },
};

interface GalleryItem {
  id: string;
  prompt: string;
  model: string;
  image_url: string;
  user_name: string;
  created_at: string;
}

export default function GalleryPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerAlt, setViewerAlt] = useState("");

  const limit = 24;
  const totalPages = Math.ceil(total / limit);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      const apiItems = data.items || [];
      if (apiItems.length === 0) {
        const mockItems = getMockGalleryItems().map((g) => ({
          ...g,
          user_name: "You (demo)",
        }));
        const start = (page - 1) * limit;
        setItems(mockItems.slice(start, start + limit));
        setTotal(mockItems.length);
      } else {
        setItems(apiItems);
        setTotal(data.total || 0);
      }
    } catch {
      const mockItems = getMockGalleryItems().map((g) => ({
        ...g,
        user_name: "You (demo)",
      }));
      const start = (page - 1) * limit;
      setItems(mockItems.slice(start, start + limit));
      setTotal(mockItems.length);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `ai-painting-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch { window.open(url, "_blank"); }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      {typeof window !== "undefined" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ImageGallery",
              name: "AI Painting Community Gallery",
              description: "Explore AI-generated artwork shared by the community.",
              url: `${window.location.origin}/${locale}/gallery`,
              image: items.slice(0, 20).map((item) => ({
                "@type": "ImageObject",
                contentUrl: item.image_url,
                name: item.prompt,
                author: { "@type": "Person", name: item.user_name },
                dateCreated: item.created_at,
              })),
            }),
          }}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
            {t("gallery.title")}
          </h1>
          <p className="mt-2 text-text-muted">
            {t("gallery.subtitle")}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-bg-card animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg">{t("gallery.empty")}</p>
            <a
              href={`/${locale}`}
              className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              {t("gallery.create_now")}
            </a>
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="break-inside-avoid group relative rounded-xl overflow-hidden border border-border/30 hover:border-accent/40 transition-colors bg-bg-card"
                >
                  <img
                    src={item.image_url}
                    alt={item.prompt}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-xs text-white/80 line-clamp-2 mb-2">{item.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50">{item.user_name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setViewerSrc(item.image_url); setViewerAlt(item.prompt); }}
                          className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/35 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload(item.image_url)}
                          className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/35 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  disabled={page <= 1}
                  onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="rounded-lg border border-border/50 px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  {t("gallery.previous")}
                </button>
                <span className="text-sm text-text-muted">{page} / {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="rounded-lg border border-border/50 px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  {t("gallery.next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
