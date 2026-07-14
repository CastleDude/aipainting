"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImageViewer } from "@/components/ImageViewer";
import { getMockGalleryItems } from "@/lib/generations";
import { setRemixImage } from "@/lib/history-bridge";

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
  thumb_url?: string | null;
  user_name: string;
  created_at: string;
}

const PAGE_SIZE = 24;

export default function GalleryPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerAlt, setViewerAlt] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      const apiItems = data.items || [];
      if (apiItems.length === 0) {
        const mockItems = getMockGalleryItems().map((g) => ({
          ...g,
          user_name: "You (demo)",
        }));
        const start = (pageNum - 1) * PAGE_SIZE;
        const slice = mockItems.slice(start, start + PAGE_SIZE);
        if (append) setItems((prev) => [...prev, ...slice]);
        else setItems(slice);
        setHasMore(start + PAGE_SIZE < mockItems.length);
      } else {
        if (append) setItems((prev) => [...prev, ...apiItems]);
        else setItems(apiItems);
        setHasMore(apiItems.length === PAGE_SIZE);
      }
    } catch {
      if (!append) setItems([]);
      setHasMore(false);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Initial load
  useEffect(() => {
    setPage(1);
    fetchItems(1, false);
  }, [fetchItems]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => {
            const next = p + 1;
            fetchItems(next, true);
            return next;
          });
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchItems]);

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

  const [jsonLd, setJsonLd] = useState("");

  useEffect(() => {
    if (items.length > 0) {
      setJsonLd(JSON.stringify({
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
      }));
    }
  }, [items, locale]);

  return (
    <div className="min-h-screen pt-24 pb-12">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
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
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="break-inside-avoid rounded-xl bg-bg-card animate-pulse" style={{ height: 120 + Math.random() * 200 }} />
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
                    src={item.thumb_url || item.image_url}
                    alt={item.prompt}
                    className="w-full h-auto"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-xs text-white/80 line-clamp-2 mb-2">{item.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50">{item.user_name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setRemixImage(item.image_url, item.prompt, item.model); router.push('/' + locale); }}
                          className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/35 transition-colors"
                          title="Remix"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                          </svg>
                        </button>
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

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {loadingMore && (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
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
