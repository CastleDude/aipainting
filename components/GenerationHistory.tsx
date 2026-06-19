"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ImageViewer } from "@/components/ImageViewer";
import { getMockGenerations, saveMockGeneration, toggleMockGenerationPublic } from "@/lib/generations";
import { setRemixImage, setEditImage } from "@/lib/history-bridge";
import type { Generation } from "@/lib/generations";

interface HistoryMessages {
  title: string;
  history_count: string;
  no_history: string;
  view: string;
  download: string;
  remix: string;
  edit: string;
  delete: string;
  batch_delete: string;
  select_all: string;
  cancel: string;
  confirm_delete: string;
  deleted: string;
  save_reminder: string;
  share_limit: string;
  share_similar: string;
  today: string;
  yesterday: string;
}

export function GenerationHistory({
  locale,
  messages,
}: {
  locale: string;
  messages: HistoryMessages;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { profile, user, loading: authLoading } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerAlt, setViewerAlt] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const isDevMock = typeof window !== "undefined" && process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true";
  const localePath = `/${locale}`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchGenerations = useCallback(() => {
    if (isDevMock) {
      setGenerations(getMockGenerations());
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    fetch(`/api/generations?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isDevMock]);

  useEffect(() => {
    if (!mounted) return;
    fetchGenerations();
    const onStorage = () => {
      if (isDevMock) setGenerations(getMockGenerations());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted, fetchGenerations, isDevMock]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === generations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(generations.map((g) => g.id)));
    }
  };

  const handleDownload = useCallback(async (url: string, idx: number) => {
    try {
      if (url.startsWith("data:")) {
        const [header, data] = url.split(",");
        const mime = header.match(/data:(image\/[^;]+)/)?.[1] || "image/png";
        const byteChars = atob(data);
        const bytes = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `ai-painting-${Date.now()}-${idx + 1}.${mime.split("/")[1]}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `ai-painting-${Date.now()}-${idx + 1}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
      showToast(messages.download);
    } catch {
      window.open(url, "_blank");
    }
  }, [messages]);

  const handleView = (url: string, prompt: string) => {
    setViewerSrc(url);
    setViewerAlt(prompt);
  };

  const handleRemix = async (imageUrl: string, prompt: string) => {
    // Convert image URL to base64 and store in sessionStorage
    try {
      if (imageUrl.startsWith("data:")) {
        setRemixImage(imageUrl, prompt);
      } else {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setRemixImage(reader.result as string, prompt);
          window.location.href = localePath;
        };
        reader.readAsDataURL(blob);
        return;
      }
    } catch {
      setRemixImage(imageUrl, prompt);
    }
    window.location.href = localePath;
  };

  const handleEdit = async (imageUrl: string) => {
    try {
      if (imageUrl.startsWith("data:")) {
        setEditImage(imageUrl);
      } else {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setEditImage(reader.result as string);
          window.location.href = `${localePath}/image-tools`;
        };
        reader.readAsDataURL(blob);
        return;
      }
    } catch {
      setEditImage(imageUrl);
    }
    window.location.href = `${localePath}/image-tools`;
  };

  const handleDeleteOne = async (id: string) => {
    if (!window.confirm(messages.confirm_delete)) return;
    if (isDevMock) {
      const updated = generations.filter((g) => g.id !== id);
      setGenerations(updated);
      localStorage.setItem("mock_generations", JSON.stringify(updated));
      showToast(messages.deleted);
      return;
    }
    try {
      const res = await fetch(`/api/generations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGenerations((prev) => prev.filter((g) => g.id !== id));
        showToast(messages.deleted);
      }
    } catch { /* ignore */ }
  };

  const handleTogglePublic = async (id: string) => {
    if (isDevMock) {
      const newVal = toggleMockGenerationPublic(id);
      if (newVal !== null) {
        setGenerations((prev) => prev.map((g) => g.id === id ? { ...g, is_public: newVal } : g));
      }
      return;
    }
    // Find current item to get current is_public
    const item = generations.find((g) => g.id === id);
    if (!item) return;
    const newVal = !item.is_public;
    // Optimistic update
    setGenerations((prev) => prev.map((g) => g.id === id ? { ...g, is_public: newVal } : g));
    try {
      const res = await fetch("/api/generations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_public: newVal }),
      });
      const data = await res.json();
      if (!data.ok) {
        // Revert on error
        setGenerations((prev) => prev.map((g) => g.id === id ? { ...g, is_public: !newVal } : g));
        const codeMsg =
          data.code === "share_limit" ? messages.share_limit :
          data.code === "share_similar" ? messages.share_similar :
          null;
        if (codeMsg) showToast(codeMsg);
      }
    } catch {
      // Revert on error
      setGenerations((prev) => prev.map((g) => g.id === id ? { ...g, is_public: !newVal } : g));
    }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(messages.confirm_delete)) return;
    setBatchDeleting(true);

    if (isDevMock) {
      const ids = selected;
      const updated = generations.filter((g) => !ids.has(g.id));
      setGenerations(updated);
      localStorage.setItem("mock_generations", JSON.stringify(updated));
      setSelected(new Set());
      showToast(messages.deleted);
      setBatchDeleting(false);
      return;
    }

    try {
      const ids = Array.from(selected).join(",");
      const res = await fetch(`/api/generations?ids=${ids}`, { method: "DELETE" });
      if (res.ok) {
        setGenerations((prev) => prev.filter((g) => !selected.has(g.id)));
        setSelected(new Set());
        showToast(messages.deleted);
      }
    } catch { /* ignore */ }
    setBatchDeleting(false);
  };

  // ── Group generations by date ──
  const getDateLabel = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const dateDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dateDay.getTime() === today.getTime()) return messages.today;
    if (dateDay.getTime() === yesterday.getTime()) return messages.yesterday;
    return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  };

  const grouped = (() => {
    const groups = new Map<string, Generation[]>();
    for (const g of generations) {
      const label = getDateLabel(g.created_at);
      const entries = groups.get(label) || [];
      entries.push(g);
      groups.set(label, entries);
    }
    return [...groups.entries()];
  })();

  if (!mounted) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-bg-card" />
            <div className="h-60 rounded-xl bg-bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent border-t-transparent" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Let the API handle auth — don't block rendering

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 flex-wrap pb-4 border-b border-border/30">
          <h1 className="text-2xl font-bold text-text-primary">{messages.title}</h1>
          <span className="text-sm text-text-muted">{messages.history_count}</span>
          <div className="flex-1" />
          {generations.length > 0 && (
            <>
              <button
                onClick={() => (selected.size > 0 ? setSelected(new Set()) : toggleAll())}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                {selected.size > 0 ? messages.cancel : messages.select_all}
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={batchDeleting || selected.size === 0}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {batchDeleting ? "..." : selected.size > 0 ? `${messages.batch_delete} (${selected.size})` : messages.batch_delete}
              </button>
            </>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-bg-card" />
              ))}
            </div>
          </div>
        ) : generations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-text-muted">{messages.no_history}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([label, items]) => (
              <div key={label}>
                <h2 className="text-base font-bold text-text-secondary mb-3 border-b border-border/50 pb-2">{label}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {items.map((gen, gi) => {
                    const isSelected = selected.has(gen.id);
                    return (
                      <div key={gen.id} className="group">
                        {/* Thumbnail */}
                        <div
                          className={`relative overflow-hidden rounded-xl transition-all ${
                            isSelected
                              ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-primary"
                              : ""
                          }`}
                        >
                          <img
                            src={gen.image_url}
                            alt={gen.prompt}
                            className="w-full aspect-square object-cover cursor-pointer rounded-xl border border-border/30 transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            onClick={() => handleView(gen.image_url, gen.prompt)}
                          />
                          {/* Selection checkbox */}
                          <button
                            onClick={() => toggleSelect(gen.id)}
                            className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer z-10 ${
                              isSelected
                                ? "bg-accent border-accent"
                                : "border-white/40 bg-black/30 opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteOne(gen.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 cursor-pointer z-10"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {/* Prompt overlay on hover */}
                          <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-t from-black/90 to-transparent">
                            <p className="text-xs text-white/90 line-clamp-2 px-2 pt-4 mb-2 leading-snug">{gen.prompt}</p>
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

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-1 mt-1.5">
                          <button
                            onClick={() => handleView(gen.image_url, gen.prompt)}
                            className="flex items-center justify-center gap-1 rounded-lg bg-bg-card border border-border/30 px-2 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:border-border/60 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {messages.view}
                          </button>
                          <button
                            onClick={() => handleDownload(gen.image_url, gi)}
                            className="flex items-center justify-center gap-1 rounded-lg bg-bg-card border border-border/30 px-2 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:border-border/60 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {messages.download}
                          </button>
                          <button
                            onClick={() => handleRemix(gen.image_url, gen.prompt)}
                            className="flex items-center justify-center gap-1 rounded-lg bg-bg-card border border-border/30 px-2 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:border-border/60 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {messages.remix}
                          </button>
                          <button
                            onClick={() => handleEdit(gen.image_url)}
                            className="flex items-center justify-center gap-1 rounded-lg bg-bg-card border border-border/30 px-2 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:border-border/60 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            {messages.edit}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent-300 shadow-lg backdrop-blur-sm">
              {toast}
            </div>
          </div>
        )}
      </div>

      {/* Image viewer */}
      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt={viewerAlt}
          onClose={() => setViewerSrc(null)}
          onDownload={() => handleDownload(viewerSrc, 0)}
        />
      )}
    </div>
  );
}
