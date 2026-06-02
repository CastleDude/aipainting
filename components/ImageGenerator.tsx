"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ASPECT_RATIOS, STYLES, AI_MODELS } from "@/lib/openrouter";
import { useParticleContext } from "@/components/ParticleContext";
import { useAuth } from "@/components/AuthProvider";
import { saveMockGeneration } from "@/lib/generations";
import { consumeRemixImage } from "@/lib/history-bridge";
import type { PresetApplyEvent } from "@/components/PresetSection";

function getRatioSize(ratio: string) {
  const [w, h] = ratio.split(":").map(Number);
  const max = 16;
  const s = max / Math.max(w, h);
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

function RatioBox({ ratio }: { ratio: string }) {
  const s = getRatioSize(ratio);
  return (
    <span
      className="inline-block rounded-sm border border-current/40"
      style={{ width: s.width, height: s.height }}
    />
  );
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string };

export function ParticleOverlay({ startYRef }: {
  startYRef: React.MutableRefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // Track mouse via window listener so it works regardless of DOM structure
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;
    const spawn = () => {
      frameCount++;
      if (frameCount % 4 !== 0) return;
      const m = mouseRef.current;
      if (!m) return;
      if (m.y < startYRef.current) return;
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1;
        particlesRef.current.push({
          x: m.x, y: m.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 1.5 + Math.random() * 2,
          color: Math.random() > 0.5 ? "#a855f7" : "#3b82f6",
        });
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      spawn();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

function GalleryCard({ item, onRemix, remixText, galleryMouseRef, galleryActive }: {
  item: { src: string; prompt: string };
  onRemix: (prompt: string) => void;
  remixText: string;
  galleryMouseRef: React.MutableRefObject<{ x: number; y: number } | null>;
  galleryActive: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHoveringRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!galleryActive) {
      cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;
    const spawn = () => {
      frameCount++;
      if (frameCount % 2 !== 0) return;
      if (!isHoveringRef.current) return;
      const m = galleryMouseRef.current;
      if (!m) return;
      const cr = canvas.getBoundingClientRect();
      const lx = m.x - cr.left;
      const ly = m.y - cr.top;
      if (ly > cr.height - 80) return;
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1;
        particlesRef.current.push({
          x: lx, y: ly,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 1.5 + Math.random() * 2,
          color: "#fde047",
        });
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      spawn();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [galleryActive, galleryMouseRef]);

  return (
    <div
      onMouseEnter={() => { isHoveringRef.current = true; }}
      onMouseLeave={() => { isHoveringRef.current = false; }}
      className="group relative overflow-hidden rounded-xl border border-border/30 transition-all duration-300 hover:border-accent/40 hover:scale-[1.04] aspect-[3/4]"
    >
      <img src={item.src} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" loading="lazy" />
      <canvas
        ref={canvasRef}
        width={400}
        height={534}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3 z-10"
      >
        <p className="text-sm text-white line-clamp-2 leading-relaxed text-left pointer-events-none">{item.prompt}</p>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemix(item.prompt);
          }}
          className="inline-block mt-1 text-xs text-yellow-300 hover:text-yellow-200 hover:text-sm cursor-pointer transition-all self-end"
        >
{remixText}
        </span>
      </div>
    </div>
  );
}

interface ImageGeneratorProps {
  messages: {
    title: string;
    subtitle?: string;
    prompt_placeholder: string;
    negative_prompt: string;
    negative_placeholder: string;
    model: string;
    aspect_ratio: string;
    style: string;
    num_images: string;
    generate_btn: string;
    generating: string;
    download: string;
    regenerate: string;
    no_results: string;
    free_remaining: string;
    credits_remaining: string;
    upgrade_hint: string;
    speed_fast: string;
    speed_normal?: string;
    negative_toggle: string;
    add_image: string;
    gallery_title: string;
    gallery_subtitle: string;
    gallery_remix: string;
    share_to_gallery?: string;
    shared_to_gallery?: string;
    save_reminder?: string;
    translate_prompt?: string;
    english_hint?: string;
    share_limit?: string;
    share_similar?: string;
    reference_image_added?: string;
    reference_image_hint?: string;
    switch_to_seedream?: string;
  };
  children?: React.ReactNode;
}

export function ImageGenerator({ messages, children }: ImageGeneratorProps) {
  const particleCtx = useParticleContext();
  const fallbackMouseRef = useRef<{ x: number; y: number } | null>(null);
  const fallbackStartYRef = useRef<number>(0);
  const galleryMouseRef = particleCtx?.galleryMouseRef ?? fallbackMouseRef;
  const galleryActive = particleCtx?.galleryActive ?? false;
  const startYRef = particleCtx?.startYRef ?? fallbackStartYRef;
  const outputAreaRef = useRef<HTMLDivElement>(null);

  // Keep startYRef updated on scroll/resize
  useEffect(() => {
    const update = () => {
      const el = outputAreaRef.current;
      if (el) startYRef.current = el.getBoundingClientRect().bottom;
    };
    // Initial set after mount
    requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState("schnell");
  const [multiplier, setMultiplier] = useState(1);
  const [lastPresetId, setLastPresetId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const pendingAspectRef = useRef<string | null>(null); // override during autoGenerate
  const [style, setStyle] = useState("photorealistic");
  const pendingStyleRef = useRef<string | null>(null);
  const [numImages, setNumImages] = useState(4);
  const [speedMode, setSpeedMode] = useState<"fast" | "normal">("normal");
  const [showNegative, setShowNegative] = useState(false);
  const [showRatio, setShowRatio] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const [showNum, setShowNum] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
  const [downloadedIdx, setDownloadedIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageBase64_2, setImageBase64_2] = useState<string | null>(null);
  const [generationIds, setGenerationIds] = useState<string[]>([]);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);
  const [translateOn, setTranslateOn] = useState(false);
  const [translating, setTranslating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const { profile, refreshProfile, syncProfileFromApi } = useAuth();
  const isFreeTier = !profile || profile.tier === "free";

  // Local credit count so it updates immediately after generation
  const [localDailyUsed, setLocalDailyUsed] = useState<number | null>(null);
  const [localCredits, setLocalCredits] = useState<number | null>(null);

  const freeRemaining = isFreeTier
    ? Math.max(0, 20 - (localDailyUsed ?? profile?.daily_used ?? 0))
    : (localCredits ?? profile?.credits ?? 0);

  const creditLabel = isFreeTier
    ? messages.free_remaining.replace("[[COUNT]]", String(freeRemaining))
    : messages.credits_remaining.replace("[[COUNT]]", String(freeRemaining));

  // ── Preset event listener (from PresetSection modal) ──
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PresetApplyEvent>).detail;
      setPrompt(detail.prompt);
      setNegativePrompt("");
      setModel(detail.model);
      if (detail.aspectRatio) { setAspectRatio(detail.aspectRatio); pendingAspectRef.current = detail.aspectRatio; }
      if (detail.style) { setStyle(detail.style); pendingStyleRef.current = detail.style; }
      if (detail.numImages) {
        setNumImages(detail.numImages);
        setSpeedMode(detail.numImages > 1 ? "normal" : "fast");
      }
      if (detail.imageBase64) {
        setImagePreview(detail.imageBase64);
        setImageBase64(detail.imageBase64);
        if (detail.imageBase64_2) setImageBase64_2(detail.imageBase64_2);
      } else {
        setImagePreview(null);
        setImageBase64(null);
      }
      setMultiplier(detail.multiplier);
      setLastPresetId(detail.presetId);
      setShowNegative(false);
      // Scroll to prompt textarea
      promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Auto-generate if requested
      if (detail.autoGenerate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = document.querySelector('[data-generate-btn]') as HTMLButtonElement;
            if (el && !el.disabled) { promptRef.current?.focus(); el.click(); }
          });
        });
      }
    };
    window.addEventListener("apply-preset", handler);
    return () => window.removeEventListener("apply-preset", handler);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Consume remix image from history page on mount
  useEffect(() => {
    const data = consumeRemixImage();
    if (data) {
      setImagePreview(data.url);
      setImageBase64(data.url);
      if (data.prompt) setPrompt(data.prompt);
      promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUsePrompt = (galleryPrompt: string) => {
    setPrompt(galleryPrompt);
    promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    promptRef.current?.focus();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);

    let finalPrompt = prompt.trim();

    // Translate to English if toggle is on — shows "Translating..." before generating
    if (translateOn) {
      setTranslating(true);
      try {
        const tRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: finalPrompt }),
        });
        const tData = await tRes.json();
        if (tData.translated && tData.translated !== finalPrompt) {
          finalPrompt = tData.translated;
        }
      } catch {
        // Keep original prompt on translation failure
      }
      setTranslating(false);
    }

    setLoading(true);
    pendingAspectRef.current = null;
    pendingStyleRef.current = null;

    const isAsync = speedMode === "normal";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          negativePrompt: negativePrompt.trim() || undefined,
          model, aspectRatio: pendingAspectRef.current || aspectRatio, style: pendingStyleRef.current || style, numImages, speedMode,
          imageBase64: imageBase64 || undefined,
          imageBase64_2: imageBase64_2 || undefined,
          async: isAsync || undefined,
          multiplier: multiplier > 1 ? multiplier : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ message: data.error || "Generation failed", code: data.code });
        setLoading(false);
        return;
      }

      // Async mode — poll for results
      if (data.jobId) {
        const jobId = data.jobId;
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes max
        const poll = async () => {
          if (attempts >= maxAttempts) {
            setError({ message: "Generation timed out. Please try again.", code: "timeout" });
            setLoading(false);
            return;
          }
          attempts++;
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const statusRes = await fetch(`/api/generate/status/${jobId}`);
            const statusData = await statusRes.json();
            if (statusData.status === "completed") {
              setImages(statusData.images || []);
              if (statusData.generationIds) setGenerationIds(statusData.generationIds);
              if (typeof statusData.daily_used === "number") {
                setLocalDailyUsed(statusData.daily_used);
                syncProfileFromApi({ daily_used: statusData.daily_used });
              } else if (typeof statusData.credits === "number") {
                setLocalCredits(statusData.credits);
                syncProfileFromApi({ credits: statusData.credits });
              }
              refreshProfile();
              if (messages.save_reminder) {
                setToast(messages.save_reminder);
                setTimeout(() => setToast(null), 6000);
              }
              if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true" && statusData.images) {
                statusData.images.forEach((url: string) => {
                  saveMockGeneration({ prompt: finalPrompt, model, image_url: url, is_public: false });
                });
              }
              setLoading(false);
            } else if (statusData.status === "failed") {
              setError({ message: statusData.error || "Generation failed", code: statusData.code });
              setLoading(false);
            } else {
              // Still pending/processing — continue polling
              poll();
            }
          } catch {
            poll(); // Retry on network error
          }
        };
        poll();
        return;
      }

      // Sync mode (fast)
      setImages(data.images);
      if (data.generationIds) setGenerationIds(data.generationIds);
      if (typeof data.daily_used === "number") {
        setLocalDailyUsed(data.daily_used);
        syncProfileFromApi({ daily_used: data.daily_used });
      } else if (typeof data.credits === "number") {
        setLocalCredits(data.credits);
        syncProfileFromApi({ credits: data.credits });
      }
      refreshProfile();

      if (messages.save_reminder) {
        setToast(messages.save_reminder);
        setTimeout(() => setToast(null), 6000);
      }
      if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MOCK_USER === "true") {
        data.images.forEach((url: string) => {
          saveMockGeneration({ prompt: finalPrompt, model, image_url: url, is_public: false });
        });
      }
      setLoading(false);
    } catch {
      setError({ message: "Network error. Please check your connection and try again.", code: "network" });
      setLoading(false);
    }
  };

  const handleDownload = useCallback(async (url: string, index: number) => {
    setDownloadingIdx(index);
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
        a.download = `ai-painting-${Date.now()}-${index + 1}.${mime.split("/")[1]}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `ai-painting-${Date.now()}-${index + 1}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
      setDownloadedIdx(index);
      setTimeout(() => setDownloadedIdx(null), 1500);
    } catch {
      window.open(url, "_blank");
    } finally {
      setDownloadingIdx(null);
    }
  }, []);

  const handleShare = useCallback(async (index: number) => {
    const genId = generationIds[index];
    if (!genId) return;
    if (!profile && process.env.NEXT_PUBLIC_DEV_MOCK_USER !== "true") {
      window.dispatchEvent(new CustomEvent("open-login-modal", { detail: { mode: "login" } }));
      return;
    }
    setSharingIdx(index);
    try {
      const res = await fetch("/api/generations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: genId, is_public: !sharedIds.has(genId) }),
      });
      const data = await res.json();
      if (data.ok) {
        setSharedIds((prev) => {
          const next = new Set(prev);
          if (data.is_public) {
            next.add(genId);
          } else {
            next.delete(genId);
          }
          return next;
        });
      } else if (data.code) {
        const codeMsg =
          data.code === "share_limit" ? messages.share_limit :
          data.code === "share_similar" ? messages.share_similar :
          null;
        if (codeMsg) {
          setToast(codeMsg);
          setTimeout(() => setToast(null), 4000);
        }
      }
    } catch {
      // ignore
    } finally {
      setSharingIdx(null);
    }
  }, [generationIds, sharedIds, profile]);

  const modelOptions = Object.entries(AI_MODELS);

  return (
    <>
      {/* Full-width Banner */}
      <div className="relative mt-12 w-full flex items-center justify-center overflow-hidden" style={{ minHeight: 280 }}>
        <img
          src="/images/banner.png"
          alt="AI Painting Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative text-center px-4 py-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white drop-shadow-lg">
            {messages.title}
          </h1>
          {messages.subtitle && (
            <p className="mt-3 text-sm text-white/80 max-w-xl mx-auto leading-relaxed drop-shadow">
              {messages.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pt-10 pb-12 sm:px-6">

      {/* Prompt + Controls container */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-4 sm:p-5">
        {/* Main input box */}
        <div className="relative rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
          {/* Hint: prompts work better in English */}
          <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5">
            <span className="text-[10px] text-text-muted">
              {messages.english_hint || "提示词用英文的效果更好"}
            </span>
          </div>

          {/* Reference image upload */}
          <div className="mb-3 flex items-center gap-3">
            {imagePreview ? (
              <div className="relative shrink-0 rounded-xl overflow-hidden border border-border/50" style={{ width: 72, height: 72 }}>
                <img
                  src={imagePreview}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/80 hover:bg-red-500/80 hover:text-white flex items-center justify-center text-[10px] transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-xl border-2 border-dashed border-border hover:border-accent/40 hover:bg-bg-secondary/50 transition-all flex flex-col items-center justify-center gap-0.5 text-text-muted hover:text-accent cursor-pointer"
                style={{ width: 72, height: 72 }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[9px] leading-tight">{messages.add_image}</span>
              </button>
            )}
            {imagePreview && (
              <div className="text-xs text-text-muted leading-snug">
                <p className="text-text-secondary font-medium">{messages.reference_image_added || "参考图片已添加"}</p>
                <p>{messages.reference_image_hint || "AI 将参考此图片风格和内容进行创作"}</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Positive prompt */}
          <textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={messages.prompt_placeholder}
            maxLength={2000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            className="w-full resize-none bg-transparent px-1 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none"
            style={{ height: 120 }}
          />
          {/* Character count + negative toggle in one row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowNegative(!showNegative)}
              className={cn(
                "text-[10px] transition-colors",
                showNegative ? "text-accent font-medium" : "text-text-muted"
              )}
              type="button"
            >
              {messages.negative_toggle}
            </button>
            <span className={cn(
              "text-[10px] transition-colors",
              prompt.length > 1800 ? "text-red-400 font-medium" : prompt.length > 1400 ? "text-amber-400" : "text-text-muted"
            )}>
              {prompt.length}/{2000}
            </span>
          </div>

          {/* Negative prompt — hidden by default */}
          {showNegative && (
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={messages.negative_placeholder}
              className="w-full resize-none bg-transparent px-1 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none"
              style={{ height: 60 }}
            />
          )}
        </div>

        {/* Controls row: dropdowns + generate button */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Model dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowModel(!showModel); setShowStyle(false); setShowNum(false); setShowRatio(false); }}
              className="h-10 rounded-xl border border-border bg-bg-card px-3 text-xs text-text-primary outline-none transition-all focus:border-accent/40 cursor-pointer flex items-center gap-2 pr-8 bg-no-repeat"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "right 8px center", backgroundSize: "20px" }}
            >
              {AI_MODELS[model as keyof typeof AI_MODELS]?.name || model}
            </button>
            {showModel && (
              <div className="absolute top-full left-0 mt-1 w-52 rounded-xl border border-border bg-bg-card shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                {modelOptions.map(([key, m]) => (
                  <button
                    key={key}
                    onClick={() => { setModel(key); setShowModel(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs transition-colors hover:bg-bg-secondary/50",
                      model === key ? "text-accent" : "text-text-secondary"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aspect ratio custom dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowRatio(!showRatio); setShowModel(false); setShowStyle(false); setShowNum(false); }}
              className="h-10 rounded-xl border border-border bg-bg-card px-3 text-xs text-text-primary outline-none transition-all focus:border-accent/40 cursor-pointer flex items-center gap-2 pr-8 bg-no-repeat"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "right 8px center", backgroundSize: "20px" }}
            >
              <RatioBox ratio={aspectRatio} />
            </button>
            {showRatio && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-bg-card shadow-xl z-20 py-1">
                <div className="grid grid-cols-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => { setAspectRatio(ar.value); setShowRatio(false); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-bg-secondary/50",
                      aspectRatio === ar.value ? "text-accent" : "text-text-secondary"
                    )}
                  >
                    <span className="w-4 flex justify-center shrink-0"><RatioBox ratio={ar.value} /></span>
                    <span className="text-left">{ar.value}</span>
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Style dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowStyle(!showStyle); setShowModel(false); setShowNum(false); setShowRatio(false); }}
              className="h-10 rounded-xl border border-border bg-bg-card px-3 text-xs text-text-primary outline-none transition-all focus:border-accent/40 cursor-pointer flex items-center gap-2 pr-8 bg-no-repeat"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "right 8px center", backgroundSize: "20px" }}
            >
              {STYLES.find((s) => s.value === style)?.label || style}
            </button>
            {showStyle && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-bg-card shadow-xl z-20 py-1">
                <div className="grid grid-cols-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setStyle(s.value); setShowStyle(false); }}
                    className={cn(
                      "text-left px-3 py-2 text-xs transition-colors hover:bg-bg-secondary/50",
                      style === s.value ? "text-accent" : "text-text-secondary"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Number of images dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowNum(!showNum); setShowModel(false); setShowStyle(false); setShowRatio(false); }}
              className="h-10 w-16 rounded-xl border border-border bg-bg-card px-3 text-xs text-text-primary outline-none transition-all focus:border-accent/40 cursor-pointer flex items-center gap-2 pr-8 bg-no-repeat"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "right 8px center", backgroundSize: "20px" }}
            >
              {numImages}
            </button>
            {showNum && (
              <div className="absolute top-full left-0 mt-1 w-24 rounded-xl border border-border bg-bg-card shadow-xl z-20 py-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setNumImages(n);
                      if (n > 1) setSpeedMode("normal");
                      setShowNum(false);
                    }}
                    className={cn(
                      "w-full text-center px-3 py-2 text-xs transition-colors hover:bg-bg-secondary/50",
                      numImages === n ? "text-accent" : "text-text-secondary"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="flex items-center gap-2">
          {/* Speed mode toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (speedMode === "normal") {
                  setSpeedMode("fast");
                  setNumImages(1);
                } else {
                  setSpeedMode("normal");
                  setNumImages(4);
                }
              }}
              title={speedMode === "normal" ? "Switch to Fast: only 1 image, but 2-3x faster" : "Switch to Normal: generate multiple images at once"}
              className={cn(
                "relative h-6 w-10 rounded-full transition-all border",
                speedMode === "fast"
                  ? "bg-accent/30 border-accent/40"
                  : "bg-bg-card border-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-[3px] h-4 w-4 rounded-full transition-all",
                  speedMode === "fast" ? "bg-accent left-0.5" : "bg-accent/35 left-[22px]"
                )}
              />
            </button>
            <span className={cn("text-[11px] transition-colors", speedMode === "fast" ? "text-accent font-medium" : "text-text-muted")}>{speedMode === "fast" ? messages.speed_fast : (messages.speed_normal || "Normal")}</span>
          </div>

          {/* Generate button */}
        <button
          data-generate-btn
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className={cn(
            "h-10 rounded-xl px-8 text-sm font-semibold transition-all flex items-center gap-2",
            loading || !prompt.trim()
              ? "cursor-not-allowed bg-bg-card text-text-muted border border-border"
              : "bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/25"
          )}
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-30" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              {messages.generating}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {messages.generate_btn}
            </>
          )}
        </button>
        </div>
      </div>
      </div>

      {/* Credit banner */}
      <div className="mt-5 h-[60px] rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-border/30 flex items-center justify-center px-4">
        <p className="text-xs text-text-secondary">
          {creditLabel}
          {isFreeTier && (
            <>
              {" · "}
              <span className="text-accent font-medium">{messages.upgrade_hint}</span>
            </>
          )}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 mx-auto max-w-lg">
          <div
            className={cn(
              "rounded-xl border p-3 text-center text-xs",
              error.code === "region_blocked"
                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            )}
          >
            <p>{error.message}</p>
            {error.code === "region_blocked" && (
              <button
                onClick={() => { setModel("schnell"); setError(null); }}
                className="mt-1.5 underline hover:text-accent"
              >
                {messages.switch_to_seedream || "Switch to Flux Schnell (free, works globally)"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Output area */}
      <div
        className="mt-6 rounded-2xl border-2 border-dashed border-border/30 p-4"
        ref={outputAreaRef}
      >
        {/* Re-edit preset button */}
        {lastPresetId && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("reopen-preset", { detail: { presetId: lastPresetId, imageBase64, multiplier } }))}
              className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              重新调整
            </button>
          </div>
        )}

        {/* Translating */}
        {translating && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-blue-500" />
              <p className="text-sm text-blue-400">Translating...</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent" />
              <p className="text-sm text-text-secondary">{messages.generating}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 && !loading && !translating && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-text-muted">{messages.no_results}</p>
          </div>
        )}

        {/* Results */}
        {images.length > 0 && !loading && (
          <div className={cn(
            "grid gap-3",
            images.length === 1 ? "max-w-lg mx-auto" : "grid-cols-2"
          )}>
            {images.map((url, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border bg-bg-card transition-all hover:border-accent/20"
              >
                <img
                  src={url}
                  alt={`Generated ${i + 1}`}
                  className="w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pt-12 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleDownload(url, i)}
                    disabled={downloadingIdx === i}
                    className={cn(
                      "rounded-lg px-4 py-2 text-xs font-medium backdrop-blur-sm transition-all",
                      downloadedIdx === i
                        ? "bg-green-500/30 text-green-300"
                        : downloadingIdx === i
                          ? "bg-white/10 text-white/50 cursor-wait"
                          : "bg-white/20 text-white hover:bg-white/40"
                    )}
                  >
                    {downloadingIdx === i ? "Saving..." : downloadedIdx === i ? "Saved!" : messages.download}
                  </button>
                  {generationIds[i] && (
                    <button
                      onClick={() => handleShare(i)}
                      disabled={sharingIdx === i}
                      className={cn(
                        "rounded-lg px-3 py-2 text-xs font-medium backdrop-blur-sm transition-all",
                        sharedIds.has(generationIds[i])
                          ? "bg-green-500/30 text-green-300"
                          : sharingIdx === i
                            ? "bg-white/10 text-white/50 cursor-wait"
                            : "bg-white/20 text-white hover:bg-white/40"
                      )}
                      title={sharedIds.has(generationIds[i]) ? (messages.shared_to_gallery || "Shared to gallery") : (messages.share_to_gallery || "Share to gallery")}
                    >
                      {sharedIds.has(generationIds[i]) ? (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {children}

      {/* Gallery showcase */}
      <section className="mt-12 mb-20 mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">{messages.gallery_title}</h2>
          <p className="text-sm text-text-muted mt-1">{messages.gallery_subtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { src: "/images/1.png", prompt: "A cyberpunk samurai standing in neon-lit Tokyo streets at night, rain drops, blade reflections" },
            { src: "/images/2.png", prompt: "A cute fluffy cat wearing a wizard hat, casting magical spells with glowing sparkles, fantasy art" },
            { src: "/images/3.png", prompt: "A serene mountain lake at sunrise, misty pine trees, crystal clear water reflections, photorealistic" },
            { src: "/images/4.png", prompt: "An astronaut riding a horse on Mars, red desert landscape, Earth visible in the sky, cinematic" },
            { src: "/images/5.png", prompt: "A Victorian-era steampunk airship flying over London, gears and brass details, dramatic sky" },
            { src: "/images/6.png", prompt: "A Ghibli-style cozy treehouse village at twilight, warm glowing windows, fireflies, magical forest" },
            { src: "/images/7.png", prompt: "A majestic dragon soaring through stormy clouds above ancient Chinese mountains, ink wash painting style" },
            { src: "/images/8.png", prompt: "A cozy autumn cafe window view with falling leaves, warm candlelight, rainy afternoon, oil painting" },
            { src: "/images/9.png", prompt: "An underwater palace of coral and pearl, mermaids swimming through sunbeams, ethereal atmosphere" },
            { src: "/images/10.png", prompt: "A futuristic Chinese city with floating lanterns and holographic billboards, cyberpunk meets tradition" },
            { src: "/images/11.png", prompt: "A mystical forest spirit made of autumn leaves, glowing embers dancing in twilight air, ethereal fantasy" },
            { src: "/images/12.png", prompt: "A crystal cave with bioluminescent flowers, mirror-like water pools, magical underground sanctuary" },
          ].map((item) => (
            <GalleryCard key={item.prompt} item={item} onRemix={handleUsePrompt} remixText={messages.gallery_remix} galleryMouseRef={galleryMouseRef} galleryActive={galleryActive} />
          ))}
        </div>
      </section>

      {/* Save reminder toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 shadow-lg backdrop-blur-sm max-w-md">
            <svg className="h-5 w-5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-300 leading-relaxed">{toast}</p>
            <button
              onClick={() => setToast(null)}
              className="shrink-0 rounded-lg p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
