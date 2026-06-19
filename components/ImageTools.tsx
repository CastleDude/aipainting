"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";

import { consumeEditImage } from "@/lib/history-bridge";

type Tool = "crop" | "compress" | "remove_bg" | "replace_bg" | "smooth" | "upscale" | "filters";

interface Messages {
  title: string; subtitle: string;
  crop: string; compress: string; remove_bg: string; replace_bg: string; smooth: string; upscale: string; filters: string;
  desc_crop: string; desc_compress: string; desc_remove_bg: string; desc_replace_bg: string; desc_smooth: string; desc_upscale: string; desc_filters: string;
  upload: string; drop: string; no_image: string;
  processing: string; download: string; reset: string;
  free_label: string; free_forever: string; free_today: string;
  remaining: string; upgrade: string;
  credits_remaining: string; per_use: string;
  crop_aspect: string; crop_freeform: string; crop_apply: string; crop_confirm: string;
  crop_width: string; crop_height: string; crop_px: string; crop_hint: string;
  crop_shape: string; crop_shape_rect: string; crop_shape_circle: string; crop_shape_ellipse: string; crop_shape_star: string; crop_corner_radius: string;
  star_points: string; star_outer: string; star_inner: string; star_corner: string;
  ellipse_width: string; ellipse_height: string;
  compress_quality: string; compress_max: string; compress_orig: string; compress_new: string; compress_saved: string; compress_hint: string; compress_max_hint: string; compress_too_many: string; compress_download_all: string; compress_delete_all: string;
  remove_bg_action: string;
  replace_bg_color: string; replace_bg_image: string; replace_bg_custom: string; replace_bg_apply: string;
  smooth_intensity: string; smooth_light: string; smooth_medium: string; smooth_strong: string; smooth_apply: string;
  upscale_2x: string; upscale_4x: string; upscale_apply: string;
  filters_presets: string; filters_brightness: string; filters_contrast: string; filters_saturation: string; filters_apply: string;
  filter_original: string; filter_grayscale: string; filter_sepia: string; filter_vintage: string; filter_cool: string; filter_warm: string; filter_contrast_label: string; filter_compare: string;
  browser_hint: string;
  save_reminder?: string;
}

const TOOLS: { key: Tool; free: "forever" | "limited" }[] = [
  { key: "crop", free: "forever" },
  { key: "compress", free: "forever" },
  { key: "remove_bg", free: "limited" },
  { key: "replace_bg", free: "limited" },
  { key: "filters", free: "forever" },
];

const ASPECT_RATIOS = [
  { label: "Freeform", value: 0 },
  { label: "1:1", value: 1 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

const PHOTO_SIZES = [
  { key: "1inch", width: 295, height: 413, ratio: 5 / 7 },
  { key: "2inch", width: 413, height: 531, ratio: 7 / 9 },
  { key: "3inch", width: 650, height: 992, ratio: 2 / 3 },
  { key: "5inch", width: 1050, height: 1500, ratio: 7 / 10 },
  { key: "6inch", width: 1200, height: 1800, ratio: 2 / 3 },
  { key: "7inch", width: 1500, height: 2100, ratio: 5 / 7 },
  { key: "8inch", width: 1800, height: 2400, ratio: 3 / 4 },
  { key: "a4", width: 2480, height: 3508, ratio: 210 / 297 },
  { key: "a5", width: 1748, height: 2480, ratio: 148 / 210 },
];

function starPath(cx: number, cy: number, outerR: number, innerR: number, points: number, cornerR: number) {
  const path = new Path2D();
  const total = points * 2;
  const step = Math.PI / points;

  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < total; i++) {
    const angle = i * step - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    verts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  if (cornerR <= 0) {
    path.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) path.lineTo(verts[i].x, verts[i].y);
    path.closePath();
    return path;
  }

  for (let i = 0; i < verts.length; i++) {
    const nextI = (i + 1) % verts.length;
    const curr = verts[i];
    const next = verts[nextI];
    const nextNext = verts[(nextI + 1) % verts.length];

    // Exit of current vertex
    const dx1 = next.x - curr.x;
    const dy1 = next.y - curr.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const r1 = Math.min(cornerR, len1 / 2);
    const exitX = curr.x + (dx1 / len1) * r1;
    const exitY = curr.y + (dy1 / len1) * r1;

    // Entry of next vertex
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const r2 = Math.min(cornerR, len1 / 2);
    const entryX = next.x - (dx2 / len1) * r2;
    const entryY = next.y - (dy2 / len1) * r2;

    // Exit of next vertex (after rounding)
    const dx3 = nextNext.x - next.x;
    const dy3 = nextNext.y - next.y;
    const len2 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
    const r3 = Math.min(cornerR, len2 / 2);
    const nextExitX = next.x + (dx3 / len2) * r3;
    const nextExitY = next.y + (dy3 / len2) * r3;

    if (i === 0) path.moveTo(exitX, exitY);
    path.lineTo(entryX, entryY);
    path.arcTo(next.x, next.y, nextExitX, nextExitY, cornerR);
  }
  path.closePath();
  return path;
}

const BG_COLORS = [
  { color: "#ffffff", name: "White" },
  { color: "#000000", name: "Black" },
  { color: "#438EDB", name: "ID Blue" },
  { color: "#DA251D", name: "ID Red" },
  { color: "#f87171", name: "Red" },
  { color: "#fb923c", name: "Orange" },
  { color: "#F59E0B", name: "Amber" },
  { color: "#facc15", name: "Yellow" },
  { color: "#4ade80", name: "Green" },
  { color: "#10B981", name: "Emerald" },
  { color: "#38bdf8", name: "Light Blue" },
  { color: "#0EA5E9", name: "Sky Blue" },
  { color: "#818cf8", name: "Indigo" },
  { color: "#c084fc", name: "Purple" },
  { color: "#e879f9", name: "Pink" },
  { color: "#9CA3AF", name: "Gray" },
  { color: "transparent", name: "Transparent" },
];

export function ImageTools({ messages, cropPhotoSizes }: { messages: Messages; cropPhotoSizes: { label: string; tip: string }[] }) {
  const [tool, setTool] = useState<Tool>("crop");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { profile, syncProfileFromApi, deductLocalCredits } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const openFileDialog = useCallback(() => {
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  }, []);

  // Crop state
  const [cropShape, setCropShape] = useState<"rect" | "circle" | "ellipse" | "star">("rect");
  const [cornerRadius, setCornerRadius] = useState(0);
  const [cropRatio, setCropRatio] = useState(0);
  const [starPoints, setStarPoints] = useState(5);
  const [starOuter, setStarOuter] = useState(90);
  const [starInner, setStarInner] = useState(40);
  const [starCornerR, setStarCornerR] = useState(0);
  const [ellipseW, setEllipseW] = useState(60);
  const [ellipseH, setEllipseH] = useState(80);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeEdge, setResizeEdge] = useState<string | null>(null);
  const [resizeAnchor, setResizeAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [movingRect, setMovingRect] = useState(false);
  const [moveOrigin, setMoveOrigin] = useState<{ mx: number; my: number; rx: number; ry: number } | null>(null);
  const [cropW, setCropW] = useState("");
  const [cropH, setCropH] = useState("");
  const [sizeConfirmed, setSizeConfirmed] = useState(false);
  const [customRatioW, setCustomRatioW] = useState("21");
  const [customRatioH, setCustomRatioH] = useState("9");

  // Compress state
  const [quality, setQuality] = useState(80);
  const [maxKB, setMaxKB] = useState(500);
  const [compressInfo, setCompressInfo] = useState<{ orig: number; comp: number } | null>(null);
  type CompressFile = {
    id: number;
    file: File;
    name: string;
    url: string;
    origSize: number;
    compSize?: number;
    resultUrl?: string;
    compressing?: boolean;
  };
  const [compressFiles, setCompressFiles] = useState<CompressFile[]>([]);
  const compressIdRef = useRef(0);
  const compressFilesRef = useRef(compressFiles);
  useEffect(() => { compressFilesRef.current = compressFiles; }, [compressFiles]);

  // Replace BG state
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [customColorInput, setCustomColorInput] = useState(false);
  const [customColor, setCustomColor] = useState("#ff0000");
  const [eyeDropperUsed, setEyeDropperUsed] = useState(false);
  const [pickKey, setPickKey] = useState(0);
  const [fgImage, setFgImage] = useState<HTMLImageElement | null>(null);
  const fgImageRef = useRef<HTMLImageElement | null>(null);
  const [replacePreview, setReplacePreview] = useState<string | null>(null);
  const [bgZoom, setBgZoom] = useState(1);
  const [bgPanX, setBgPanX] = useState(0);
  const [bgPanY, setBgPanY] = useState(0);
  const bgPreviewRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [bgDragging, setBgDragging] = useState(false);
  const bgDragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Smooth state
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const [smoothIntensity, setSmoothIntensity] = useState<"light" | "medium" | "strong">("medium");

  // Upscale state
  const [upscaleScale, setUpscaleScale] = useState<"2x" | "4x">("2x");

  // Filters state
  const [filterPreset, setFilterPreset] = useState("original");
  const [filterBrightness, setFilterBrightness] = useState(100);
  const [filterContrast, setFilterContrast] = useState(100);
  const [filterSaturation, setFilterSaturation] = useState(100);
  const [filterComparing, setFilterComparing] = useState(false);

  // Comparison slider state
  const [dividerPos, setDividerPos] = useState(50);
  const [draggingDivider, setDraggingDivider] = useState(false);
  const dividerContainerRef = useRef<HTMLDivElement>(null);

  // Divider drag handlers
  const handleDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingDivider(true);
  }, []);

  useEffect(() => {
    if (!draggingDivider) return;
    const onMove = (e: MouseEvent) => {
      const box = dividerContainerRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = clamp((x / rect.width) * 100, 3, 97);
      setDividerPos(pct);
    };
    const onUp = () => setDraggingDivider(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggingDivider]);

  // Background image zoom/pan refs to avoid stale closures
  const bgZoomRef = useRef(bgZoom);
  const bgPanXRef = useRef(bgPanX);
  const bgPanYRef = useRef(bgPanY);
  useEffect(() => { bgZoomRef.current = bgZoom; }, [bgZoom]);
  useEffect(() => { bgPanXRef.current = bgPanX; }, [bgPanX]);
  useEffect(() => { bgPanYRef.current = bgPanY; }, [bgPanY]);
  useEffect(() => { fgImageRef.current = fgImage; }, [fgImage]);

  const handleBgImageMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool !== "replace_bg" || !fgImage || resultUrl) return;
    if (e.button !== 0) return;
    e.preventDefault();
    setBgDragging(true);
    bgDragStart.current = { x: e.clientX, y: e.clientY, px: bgPanXRef.current, py: bgPanYRef.current };
  }, [tool, fgImage, resultUrl]);

  // Native wheel listener to prevent page scroll during bg zoom (centered)
  useEffect(() => {
    const box = uploadBoxRef.current;
    if (!box || tool !== "replace_bg" || !fgImage || resultUrl) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const oldZoom = bgZoomRef.current;
      const newZoom = clamp(oldZoom * (e.deltaY < 0 ? 1.15 : 0.87), 0.1, 5);
      const scale = newZoom / oldZoom;
      setBgPanX((prev) => prev * scale);
      setBgPanY((prev) => prev * scale);
      setBgZoom(newZoom);
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [tool, fgImage, resultUrl]);

  useEffect(() => {
    if (!bgDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!bgDragStart.current) return;
      const box = uploadBoxRef.current;
      const fg = fgImageRef.current;
      const refW = fg?.naturalWidth || box?.clientWidth || 1024;
      const refH = fg?.naturalHeight || box?.clientHeight || 1024;
      const ds = displaySizeRef.current;
      const areaW = ds?.w || box?.clientWidth || 1;
      const areaH = ds?.h || box?.clientHeight || 1;
      const scaleX = refW / areaW;
      const scaleY = refH / areaH;
      setBgPanX(bgDragStart.current.px + (e.clientX - bgDragStart.current.x) * scaleX);
      setBgPanY(bgDragStart.current.py + (e.clientY - bgDragStart.current.y) * scaleY);
    };
    const onUp = () => { setBgDragging(false); bgDragStart.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [bgDragging]);

  const showComparison = resultUrl && (tool === "remove_bg" || tool === "replace_bg" || tool === "smooth" || tool === "upscale" || (tool === "filters" && filterComparing));

  // Refs to avoid stale closures in passive wheel listener
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const displaySizeRef = useRef(displaySize);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);
  useEffect(() => { displaySizeRef.current = displaySize; }, [displaySize]);

  const isLimitedTool = TOOLS.find((t) => t.key === tool)?.free === "limited";
  const creditsRemaining = profile?.credits ?? 0;
  const blocked = isLimitedTool && creditsRemaining <= 0;

  const uploadBoxRef = useRef<HTMLDivElement>(null);
  const bgImageFileRef = useRef<HTMLInputElement>(null);

  // Sliding door tabs
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const el = tabRefs.current.get(tool);
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tool]);

  useLayoutEffect(() => { updateIndicator(); }, [updateIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  const getDisplayDims = useCallback((img: HTMLImageElement) => {
    const box = uploadBoxRef.current;
    const maxW = box?.clientWidth || 600;
    const maxH = box?.clientHeight || 500;
    const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    return { w: Math.round(img.naturalWidth * ratio), h: Math.round(img.naturalHeight * ratio) };
  }, []);

  // Consume edit image from history page on mount
  useEffect(() => {
    const url = consumeEditImage();
    if (!url) return;
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      setImageName("history-image.png");
      setResultUrl(null);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setCropRect(null);
      setCompressInfo(null);
      const box = uploadBoxRef.current;
      const maxW = box?.clientWidth || 600;
      const maxH = box?.clientHeight || 500;
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      setDisplaySize({ w: Math.round(img.naturalWidth * ratio), h: Math.round(img.naturalHeight * ratio) });
    };
    img.src = url;
  }, []);

  const loadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      setImageName(file.name);
      setResultUrl(null);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setCropRect(null);
      setCropStart(null);
      setResizeEdge(null);
      setHoveredEdge(null);
      setMovingRect(false);
      setSizeConfirmed(false);
      setCompressInfo(null);
      setDisplaySize(getDisplayDims(img));
    };
    img.src = url;
  }, [getDisplayDims]);

  const MAX_COMPRESS_FILES = 15;

  const addCompressFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    setCompressFiles((prev) => {
      const available = MAX_COMPRESS_FILES - prev.length;
      if (available <= 0) return prev;
      const toAdd: CompressFile[] = [];
      for (let i = 0; i < fileList.length && toAdd.length < available; i++) {
        const f = fileList[i];
        if (!f.type.startsWith("image/")) continue;
        compressIdRef.current += 1;
        toAdd.push({
          id: compressIdRef.current,
          file: f,
          name: f.name,
          url: URL.createObjectURL(f),
          origSize: f.size,
        });
      }
      return [...prev, ...toAdd];
    });
  }, []);

  const removeCompressFile = useCallback((id: number) => {
    setCompressFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAllCompressFiles = useCallback(() => {
    setCompressFiles((prev) => { prev.forEach((f) => URL.revokeObjectURL(f.url)); return []; });
  }, []);

  const batchCompress = useCallback(async () => {
    const files = compressFilesRef.current;
    for (const cf of files) {
      if (cf.compSize !== undefined) continue;
      setCompressFiles((prev) => prev.map((f) => f.id === cf.id ? { ...f, compressing: true } : f));

      const img = new window.Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = cf.url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const isPng = cf.file.type === "image/png" || cf.name.toLowerCase().endsWith(".png");
      const mimeType = isPng ? "image/png" : "image/jpeg";
      const tryCompress = (q: number): Promise<{ url: string; size: number }> => {
        return new Promise((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) { resolve({ url: cf.url, size: cf.origSize }); return; }
              if (!isPng && blob.size > maxKB * 1024 && q > 10) {
                tryCompress(q - 10).then(resolve);
              } else {
                resolve({ url: URL.createObjectURL(blob), size: blob.size });
              }
            },
            mimeType,
            isPng ? undefined : q / 100,
          );
        });
      };

      const result = await tryCompress(quality);
      setCompressFiles((prev) => prev.map((f) =>
        f.id === cf.id ? { ...f, compSize: result.size, resultUrl: result.url, compressing: false } : f
      ));
    }
  }, [quality, maxKB]);

  const downloadAllAsZip = useCallback(async () => {
    const files = compressFilesRef.current.filter((f) => f.resultUrl);
    if (files.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const cf of files) {
      try {
        // Convert resultUrl to a valid zip entry
        // resultUrl can be blob: URL (from canvas.toBlob) or cf.url (original file URL)
        // For blob: URLs, convert to base64 data URL for stable zip inclusion
        let data: string;
        if (cf.resultUrl!.startsWith("blob:")) {
          const response = await fetch(cf.resultUrl!);
          const blob = await response.blob();
          data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else {
          // Original URL (compression skipped) — fetch as base64
          try {
            const response = await fetch(cf.resultUrl!);
            const blob = await response.blob();
            data = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch {
            continue; // Skip unreachable external URLs silently
          }
        }
        const ext = cf.file.type === "image/png" || cf.name.toLowerCase().endsWith(".png") ? ".png" : ".jpg";
        zip.file(cf.name.replace(/(\.[\w\d]+)$/, `_compressed${ext}`), data.split(",")[1], { base64: true });
      } catch {
        console.warn("[compress] Skipped file:", cf.name);
      }
    }
    if (Object.keys(zip.files).length === 0) return;
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed_images.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (tool === "compress") {
        const files = e.target.files;
        if (files && files.length > MAX_COMPRESS_FILES) {
          setToast(messages.compress_too_many);
          setTimeout(() => setToast(null), 3000);
          return;
        }
        addCompressFiles(files);
      } else {
        const file = e.target.files?.[0];
        if (file) loadImage(file);
      }
    },
    [loadImage, tool, addCompressFiles, messages],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (tool === "compress") {
        if (files.length > MAX_COMPRESS_FILES) {
          setToast(messages.compress_too_many);
          setTimeout(() => setToast(null), 3000);
          return;
        }
        addCompressFiles(files);
      } else {
        const file = files?.[0];
        if (file && file.type.startsWith("image/")) loadImage(file);
      }
    },
    [loadImage, tool, addCompressFiles, messages],
  );

  const handleBgImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        setBgImageUrl(URL.createObjectURL(file));
        setBgZoom(1);
        setBgPanX(0);
        setBgPanY(0);
      }
    },
    [],
  );

  const handleEyeDropper = useCallback(async () => {
    const EyeDropper = (window as any).EyeDropper;
    if (!EyeDropper) {
      // fallback for browsers without EyeDropper API
      setCustomColorInput(true);
      return;
    }
    try {
      const ed = new EyeDropper();
      const result = await ed.open();
      const hex = result.sRGBHex.startsWith("#") ? result.sRGBHex : "#" + result.sRGBHex;
      setCustomColor(hex);
      setBgColor(hex);
      setCustomColorInput(true);
      setEyeDropperUsed(true);
      setPickKey((k) => k + 1);
    } catch {
      // user cancelled
    }
  }, []);

  // ---- CROP: utilities ----
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const constrainRatio = (x: number, y: number, w: number, h: number, ratio: number, originX: number, originY: number) => {
    let cw = w, ch = h, cx = x, cy = y;
    if (w / h > ratio) { cw = h * ratio; cx = originX < x + w / 2 ? x : x + w - cw; }
    else { ch = w / ratio; cy = originY < y + h / 2 ? y : y + h - ch; }
    return { x: cx, y: cy, w: cw, h: ch };
  };

  const EDGE = 10;
  type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  const detectEdge = (r: { x: number; y: number; w: number; h: number }, px: number, py: number): string | null => {
    if (cropShape === "circle" || cropShape === "ellipse" || cropShape === "star") {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      let radius: number;
      if (cropShape === "ellipse") {
        const rx = (r.w / 2) * (ellipseW / 100);
        const ry = (r.h / 2) * (ellipseH / 100);
        // Normalize to unit circle to compute distance
        const nx = (px - cx) / Math.max(1, rx);
        const ny = (py - cy) / Math.max(1, ry);
        const ndist = Math.sqrt(nx * nx + ny * ny);
        const edgeNX = 1 - EDGE / Math.max(1, Math.max(rx, ry));
        if (ndist > 1 + EDGE / Math.max(1, Math.min(rx, ry))) return null;
        if (ndist > 1 - EDGE / Math.max(1, Math.min(rx, ry))) return "se";
        if (ndist < 1) return "move";
        return null;
      }
      radius = Math.min(r.w, r.h) / 2;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist > radius + EDGE) return null;
      if (dist > radius - EDGE) return "se";
      if (dist < radius) return "move";
      return null;
    }
    const onL = Math.abs(px - r.x) < EDGE && py > r.y - EDGE && py < r.y + r.h + EDGE;
    const onR = Math.abs(px - (r.x + r.w)) < EDGE && py > r.y - EDGE && py < r.y + r.h + EDGE;
    const onT = Math.abs(py - r.y) < EDGE && px > r.x - EDGE && px < r.x + r.w + EDGE;
    const onB = Math.abs(py - (r.y + r.h)) < EDGE && px > r.x - EDGE && px < r.x + r.w + EDGE;
    if (onT && onL) return "nw"; if (onT && onR) return "ne";
    if (onB && onL) return "sw"; if (onB && onR) return "se";
    if (onL) return "w"; if (onR) return "e";
    if (onT) return "n"; if (onB) return "s";
    if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) return "move";
    return null;
  };

  const edgeCursor: Record<string, string> = {
    n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
    ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize",
    move: "move",
  };

  // Adjust cropRect to match a new ratio, keeping center
  const fitRatioToRect = (rect: { x: number; y: number; w: number; h: number }, ratio: number, boxW: number, boxH: number) => {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    let nw: number, nh: number;
    if (rect.w / rect.h > ratio) { nh = rect.h; nw = rect.h * ratio; }
    else { nw = rect.w; nh = rect.w / ratio; }
    let nx = cx - nw / 2;
    let ny = cy - nh / 2;
    if (nx < 0) nx = 0;
    if (ny < 0) ny = 0;
    if (nx + nw > boxW) { nx = boxW - nw; if (nx < 0) { nw = boxW; nx = 0; nh = nw / ratio; ny = cy - nh / 2; } }
    if (ny + nh > boxH) { ny = boxH - nh; if (ny < 0) { nh = boxH; ny = 0; nw = nh * ratio; nx = cx - nw / 2; } }
    return { x: clamp(nx, 0, boxW - nw), y: clamp(ny, 0, boxH - nh), w: nw, h: nh };
  };

  // ---- CROP: zoom wheel (non-passive to prevent page scroll) ----
  useEffect(() => {
    const box = uploadBoxRef.current;
    if (!box || tool !== "crop" || !image) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ds = displaySizeRef.current;
      if (!ds) return;
      const boxW = box.clientWidth;
      const boxH = box.clientHeight;
      const fitW = ds.w;
      const fitH = ds.h;
      const cx = e.clientX - box.getBoundingClientRect().left;
      const cy = e.clientY - box.getBoundingClientRect().top;
      const oldZoom = zoomRef.current;
      const newZoom = clamp(oldZoom * (e.deltaY < 0 ? 1.12 : 0.9), 0.1, 5);
      const dxOld = (boxW - fitW * oldZoom) / 2 + panXRef.current;
      const dyOld = (boxH - fitH * oldZoom) / 2 + panYRef.current;
      const dxNew = cx - (cx - dxOld) * newZoom / oldZoom;
      const dyNew = cy - (cy - dyOld) * newZoom / oldZoom;
      let npx = dxNew - (boxW - fitW * newZoom) / 2;
      let npy = dyNew - (boxH - fitH * newZoom) / 2;
      const maxPx = Math.max(0, (fitW * newZoom - boxW) / 2);
      const maxPy = Math.max(0, (fitH * newZoom - boxH) / 2);
      npx = clamp(npx, -maxPx, maxPx);
      npy = clamp(npy, -maxPy, maxPy);
      setZoom(newZoom);
      setPanX(npx);
      setPanY(npy);
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [tool, image]);

  // ---- CROP: canvas-coords helper ----
  const getCanvasCoords = useCallback((e: { clientX: number; clientY: number }) => {
    const box = uploadBoxRef.current;
    if (!box) return { x: 0, y: 0 };
    const rect = box.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // ---- CROP: canvas hover → cursor ----
  const handleCropHover = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropRect || cropStart || resizeEdge || movingRect) return;
    const coords = getCanvasCoords(e);
    setHoveredEdge(detectEdge(cropRect, coords.x, coords.y));
  }, [cropRect, cropStart, resizeEdge, movingRect, getCanvasCoords, cropShape, ellipseW, ellipseH]);

  // ---- CROP: mouse down (left = draw/resize/move, right = pan) ----
  const handleCropMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      e.preventDefault();
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, px: panX, py: panY });
      return;
    }
    if (e.button !== 0) return;
    const coords = getCanvasCoords(e);
    if (cropRect) {
      const edge = detectEdge(cropRect, coords.x, coords.y);
      if (edge === "move") {
        setMovingRect(true);
        setMoveOrigin({ mx: coords.x, my: coords.y, rx: cropRect.x, ry: cropRect.y });
        setHoveredEdge("move");
        setSizeConfirmed(false);
        return;
      }
      if (edge) {
        setResizeEdge(edge);
        setResizeAnchor({ ...cropRect });
        setSizeConfirmed(false);
        return;
      }
    }
    setCropStart(coords);
    setCropRect(null);
    setSizeConfirmed(false);
  }, [panX, panY, cropRect, getCanvasCoords, cropShape, ellipseW, ellipseH]);

  const handleCropContextMenu = useCallback((e: React.MouseEvent) => { e.preventDefault(); }, []);

  // ---- Pan effect ----
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!displaySize || !dragStart) return;
      const box = uploadBoxRef.current;
      if (!box) return;
      const boxW = box.clientWidth;
      const boxH = box.clientHeight;
      const fitW = displaySize.w;
      const fitH = displaySize.h;
      let npx = dragStart.px + (e.clientX - dragStart.x);
      let npy = dragStart.py + (e.clientY - dragStart.y);
      const maxPx = Math.max(0, (fitW * zoom - boxW) / 2);
      const maxPy = Math.max(0, (fitH * zoom - boxH) / 2);
      npx = clamp(npx, -maxPx, maxPx);
      npy = clamp(npy, -maxPy, maxPy);
      setPanX(npx);
      setPanY(npy);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, dragStart, displaySize, zoom]);

  // ---- Crop rect draw effect ----
  useEffect(() => {
    if (!cropStart || !displaySize) return;
    const box = uploadBoxRef.current;
    if (!box) return;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    const onMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      let x = clamp(Math.min(cropStart.x, coords.x), 0, boxW);
      let y = clamp(Math.min(cropStart.y, coords.y), 0, boxH);
      let w = clamp(Math.abs(coords.x - cropStart.x), 0, boxW - x);
      let h = clamp(Math.abs(coords.y - cropStart.y), 0, boxH - y);
      if (w < 1 || h < 1) { setCropRect(null); return; }
      if (cropRatio > 0) { const c = constrainRatio(x, y, w, h, cropRatio, cropStart.x, cropStart.y); x = c.x; y = c.y; w = c.w; h = c.h; }
      setCropRect({ x, y, w, h });
    };
    const onUp = () => setCropStart(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [cropStart, displaySize, cropRatio, getCanvasCoords]);

  // ---- Crop rect resize effect ----
  useEffect(() => {
    if (!resizeEdge || !resizeAnchor || !displaySize) return;
    const box = uploadBoxRef.current;
    if (!box) return;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    const onMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      const a = resizeAnchor;
      let nx = a.x, ny = a.y, nw = a.w, nh = a.h;
      const px = clamp(coords.x, 0, boxW);
      const py = clamp(coords.y, 0, boxH);

      if (cropRatio > 0) {
        // Fixed ratio: use both x and y for corners, dominant axis for edges
        if (resizeEdge === "se") {
          nw = Math.max(10, Math.max(px - a.x, (py - a.y) * cropRatio));
          nh = nw / cropRatio;
        } else if (resizeEdge === "ne") {
          nw = Math.max(10, Math.max(px - a.x, (a.y + a.h - py) * cropRatio));
          nh = nw / cropRatio;
          ny = a.y + a.h - nh;
        } else if (resizeEdge === "sw") {
          nw = Math.max(10, Math.max(a.x + a.w - px, (py - a.y) * cropRatio));
          nh = nw / cropRatio;
          nx = a.x + a.w - nw;
        } else if (resizeEdge === "nw") {
          nw = Math.max(10, Math.max(a.x + a.w - px, (a.y + a.h - py) * cropRatio));
          nh = nw / cropRatio;
          nx = a.x + a.w - nw;
          ny = a.y + a.h - nh;
        } else if (resizeEdge === "e") {
          nw = Math.max(10, px - a.x);
          nh = nw / cropRatio;
        } else if (resizeEdge === "w") {
          nw = Math.max(10, a.x + a.w - px);
          nh = nw / cropRatio;
          nx = a.x + a.w - nw;
        } else if (resizeEdge === "s") {
          nh = Math.max(10, py - a.y);
          nw = nh * cropRatio;
        } else if (resizeEdge === "n") {
          nh = Math.max(10, a.y + a.h - py);
          nw = nh * cropRatio;
          ny = a.y + a.h - nh;
        }
        // Clamp to box
        if (nx < 0) { nw += nx; nx = 0; nh = nw / cropRatio; }
        if (ny < 0) { nh += ny; ny = 0; nw = nh * cropRatio; }
        if (nx + nw > boxW) { nw = boxW - nx; nh = nw / cropRatio; }
        if (ny + nh > boxH) { nh = boxH - ny; nw = nh * cropRatio; }
      } else if (cropShape !== "rect") {
        // Proportional scaling from center for non-rect shapes
        const cx = a.x + a.w / 2;
        const cy = a.y + a.h / 2;
        const ratio = cropShape === "circle" ? 1 : a.w / a.h;
        const dx = Math.abs(px - cx);
        const dy = Math.abs(py - cy);
        if (dx / ratio > dy) {
          nw = Math.max(10, dx * 2);
          nh = nw / ratio;
        } else {
          nh = Math.max(10, dy * 2);
          nw = nh * ratio;
        }
        nx = cx - nw / 2;
        ny = cy - nh / 2;
        nx = clamp(nx, 0, boxW - 10);
        ny = clamp(ny, 0, boxH - 10);
        nw = Math.min(nw, boxW - nx);
        nh = Math.min(nh, boxH - ny);
      } else {
        // Freeform: move individual edges
        if (resizeEdge.includes("e")) nw = Math.max(10, px - a.x);
        if (resizeEdge.includes("w")) { nw = Math.max(10, a.x + a.w - px); nx = Math.min(px, a.x + a.w - 10); }
        if (resizeEdge.includes("s")) nh = Math.max(10, py - a.y);
        if (resizeEdge.includes("n")) { nh = Math.max(10, a.y + a.h - py); ny = Math.min(py, a.y + a.h - 10); }
        nx = clamp(nx, 0, boxW - 10);
        ny = clamp(ny, 0, boxH - 10);
        nw = Math.min(nw, boxW - nx);
        nh = Math.min(nh, boxH - ny);
      }
      setCropRect({ x: nx, y: ny, w: nw, h: nh });
    };
    const onUp = () => { setResizeEdge(null); setResizeAnchor(null); setHoveredEdge(null); setSizeConfirmed(false); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizeEdge, resizeAnchor, displaySize, cropRatio, cropShape, getCanvasCoords]);

  // ---- Crop rect move effect ----
  useEffect(() => {
    if (!movingRect || !moveOrigin || !cropRect) return;
    const box = uploadBoxRef.current;
    if (!box) return;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    const onMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      let nx = moveOrigin.rx + (coords.x - moveOrigin.mx);
      let ny = moveOrigin.ry + (coords.y - moveOrigin.my);
      nx = clamp(nx, 0, boxW - cropRect.w);
      ny = clamp(ny, 0, boxH - cropRect.h);
      setCropRect((prev) => prev ? { ...prev, x: nx, y: ny } : null);
    };
    const onUp = () => { setMovingRect(false); setMoveOrigin(null); setHoveredEdge(null); setSizeConfirmed(false); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [movingRect, moveOrigin, cropRect, getCanvasCoords]);

  // ---- Ratio button: adjust existing rect immediately ----
  const setRatioAndAdjust = useCallback((ratio: number) => {
    setCropRatio(ratio);
    setSizeConfirmed(false);
    if (ratio > 0) { setCropW(""); setCropH(""); }
    if (cropRect && ratio > 0) {
      const box = uploadBoxRef.current;
      if (!box) return;
      setCropRect(fitRatioToRect(cropRect, ratio, box.clientWidth, box.clientHeight));
    }
  }, [cropRect]);

  const applyCrop = useCallback(() => {
    if (!image || !displaySize) return;
    const box = uploadBoxRef.current;
    if (!box) return;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    const fitW = displaySize.w;
    const fitH = displaySize.h;

    const dx = (boxW - fitW * zoom) / 2 + panX;
    const dy = (boxH - fitH * zoom) / 2 + panY;

    const rect = (cropRect && cropRect.w >= 5) ? cropRect : { x: 0, y: 0, w: boxW, h: boxH };

    const sx = (rect.x - dx) / (fitW * zoom) * image.width;
    const sy = (rect.y - dy) / (fitH * zoom) * image.height;
    const sw = rect.w / (fitW * zoom) * image.width;
    const sh = rect.h / (fitH * zoom) * image.height;

    const mw = parseInt(cropW);
    const mh = parseInt(cropH);
    const dw = mw > 0 && mh > 0 ? mw : Math.round(sw);
    const dh = mw > 0 && mh > 0 ? mh : Math.round(sh);

    const srcX = Math.max(0, Math.round(sx));
    const srcY = Math.max(0, Math.round(sy));
    const srcW = Math.min(Math.round(sw), image.width - srcX);
    const srcH = Math.min(Math.round(sh), image.height - srcY);

    if (srcW <= 0 || srcH <= 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d")!;

    if (cropShape !== "rect" || cornerRadius > 0) {
      if (cropShape === "circle") {
        const cx = dw / 2;
        const cy = dh / 2;
        const radius = Math.min(dw, dh) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
      } else if (cropShape === "ellipse") {
        const cx = dw / 2;
        const cy = dh / 2;
        const rx = (dw / 2) * (ellipseW / 100);
        const ry = (dh / 2) * (ellipseH / 100);
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        ctx.clip();
      } else if (cropShape === "star") {
        const cx = dw / 2;
        const cy = dh / 2;
        const maxR = Math.min(dw, dh) / 2;
        ctx.clip(starPath(cx, cy, maxR * (starOuter / 100), maxR * (starInner / 100), starPoints, starCornerR));
      } else if (cornerRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(0, 0, dw, dh, cornerRadius);
        ctx.clip();
      }
    }

    ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, dw, dh);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    }, "image/png");
  }, [image, displaySize, zoom, panX, panY, cropRect, cropW, cropH, cropShape, cornerRadius, ellipseW, ellipseH, starPoints, starOuter, starInner, starCornerR]);

  // ---- COMPRESS ----
  const applyCompress = useCallback(() => {
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);

    const isPng = imageName.toLowerCase().endsWith(".png") || (image.src && image.src.startsWith("data:image/png"));
    const mimeType = isPng ? "image/png" : "image/jpeg";
    const tryCompress = (q: number) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          if (!isPng && blob.size > maxKB * 1024 && q > 10) {
            tryCompress(q - 10);
          } else {
            setResultUrl(url);
            setCompressInfo({ orig: 0, comp: blob.size });
          }
        },
        mimeType,
        isPng ? undefined : q / 100,
      );
    };

    const origSize = image.src.length * 0.75; // approximate
    setCompressInfo({ orig: Math.round(origSize), comp: 0 });
    tryCompress(quality);
  }, [image, quality, maxKB]);

  useEffect(() => {
    if (resultUrl && compressInfo && compressInfo.comp > 0) {
      setCompressInfo((prev) => prev ? { ...prev, comp: compressInfo.comp } : null);
    }
  }, [resultUrl, compressInfo?.comp]);

  // ---- AI Tools (via Doubao Seedream API) ----

  // Shared: deduct credit/usage
  const deductUsage = useCallback(() => {
    deductLocalCredits(undefined, -1);
    if (profile) {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const newCredits = Math.max(0, (profile.credits ?? 0) - 1);
      sb.from("profiles").update({ credits: newCredits }).eq("id", profile.id).then(() => {});
    }
  }, [deductLocalCredits, profile]);

  // Convert HTMLImageElement to a JPEG data URL, resizing if needed
  const imageToDataUrl = useCallback((img: HTMLImageElement, maxDim = 1024): string => {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  // Remove background via ModelScope matting API (free, true RGBA PNG)
  const runRemoveBg = useCallback(async () => {
    if (!image || blocked) return;
    setProcessing(true);
    deductUsage();
    let ok = false;
    try {
      const dataUrl = imageToDataUrl(image);
      const res = await fetch("/api/image-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, tool: "remove_bg" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");

      setResultUrl(data.url);
      ok = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    }
    setProcessing(false);
    if (ok && messages.save_reminder) { setToast(messages.save_reminder); setTimeout(() => setToast(null), 6000); }
  }, [image, blocked, deductUsage, messages.save_reminder, imageToDataUrl]);

  // Replace background — Step 1: cutout via API (deduct credits here)
  const runBgCutout = useCallback(async () => {
    if (!image || blocked) return;
    setProcessing(true);
    deductUsage();
    try {
      const dataUrl = imageToDataUrl(image);
      const res = await fetch("/api/image-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, tool: "remove_bg" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");

      // Load the foreground image
      const fg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load result"));
        img.src = data.url;
      });
      setFgImage(fg);

      // Generate initial preview (use refs for latest zoom/pan)
      const canvas = document.createElement("canvas");
      canvas.width = fg.naturalWidth;
      canvas.height = fg.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      if (bgImageUrl) {
        const bgImgData = await new Promise<HTMLImageElement | null>((r) => {
          const img = new Image();
          img.onload = () => r(img);
          img.onerror = () => r(null);
          img.src = bgImageUrl;
        });
        if (bgImgData) {
          const cw = canvas.width;
          const ch = canvas.height;
          const imgRatio = bgImgData.naturalWidth / bgImgData.naturalHeight;
          const canvasRatio = cw / ch;
          const coverScale = imgRatio > canvasRatio ? ch / bgImgData.naturalHeight : cw / bgImgData.naturalWidth;
          const z = bgZoomRef.current;
          const scale = coverScale * z;
          const drawW = bgImgData.naturalWidth * scale;
          const drawH = bgImgData.naturalHeight * scale;
          const drawX = (cw - drawW) / 2 + bgPanXRef.current;
          const drawY = (ch - drawH) / 2 + bgPanYRef.current;
          ctx.drawImage(bgImgData, drawX, drawY, drawW, drawH);
        } else {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(fg, 0, 0);
      setReplacePreview(canvas.toDataURL("image/png"));

      if (messages.save_reminder) { setToast(messages.save_reminder); setTimeout(() => setToast(null), 6000); }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    }
    setProcessing(false);
  }, [image, blocked, deductUsage, messages.save_reminder, imageToDataUrl, bgColor, bgImageUrl]);

  // Replace background — Step 2: apply (finalize the composition)
  const applyReplaceBg = useCallback(() => {
    if (replacePreview) {
      setResultUrl(replacePreview);
      if (messages.save_reminder) { setToast(messages.save_reminder); setTimeout(() => setToast(null), 6000); }
    }
  }, [replacePreview, messages.save_reminder]);

  // Draw background preview canvas
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas || !bgImageUrl) return;
    const box = bgPreviewRef.current;
    if (!box) return;
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cw, ch);

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, cw, ch);
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = cw / ch;
      const coverScale = imgRatio > canvasRatio ? ch / img.naturalHeight : cw / img.naturalWidth;
      const scale = coverScale * bgZoom;
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      // Pan: scale pan pixels to preview container size
      const refW = fgImage?.naturalWidth || 1024;
      const refH = fgImage?.naturalHeight || 1024;
      const panScaleX = cw / refW;
      const panScaleY = ch / refH;
      const drawX = (cw - drawW) / 2 + bgPanX * panScaleX;
      const drawY = (ch - drawH) / 2 + bgPanY * panScaleY;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };
    img.src = bgImageUrl;
  }, [bgImageUrl, bgZoom, bgPanX, bgPanY, fgImage]);

  // Update preview when background changes after cutout
  useEffect(() => {
    if (!fgImage || resultUrl) return;
    const canvas = document.createElement("canvas");
    canvas.width = fgImage.naturalWidth;
    canvas.height = fgImage.naturalHeight;
    const ctx = canvas.getContext("2d")!;

    if (bgImageUrl) {
      const img = new Image();
      img.onload = () => {
        // Apply zoom/pan: cover canvas by default, offset by bgPan
        const cw = canvas.width;
        const ch = canvas.height;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = cw / ch;
        const coverScale = imgRatio > canvasRatio ? ch / img.naturalHeight : cw / img.naturalWidth;
        const scale = coverScale * bgZoom;
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const drawX = (cw - drawW) / 2 + bgPanX;
        const drawY = (ch - drawH) / 2 + bgPanY;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.drawImage(fgImage, 0, 0);
        setReplacePreview(canvas.toDataURL("image/png"));
      };
      img.src = bgImageUrl;
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fgImage, 0, 0);
      setReplacePreview(canvas.toDataURL("image/png"));
    }
  }, [fgImage, resultUrl, bgColor, bgImageUrl, bgZoom, bgPanX, bgPanY]);

  // Skin smoothing via Doubao API
  const runSmooth = useCallback(async () => {
    if (!image || blocked) return;
    setProcessing(true);
    deductUsage();
    let ok = false;
    try {
      const dataUrl = imageToDataUrl(image);
      const res = await fetch("/api/image-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, tool: "smooth", smoothIntensity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");

      // API now returns base64, use directly
      setResultUrl(data.url);
      ok = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    }
    setProcessing(false);
    if (ok && messages.save_reminder) { setToast(messages.save_reminder); setTimeout(() => setToast(null), 6000); }
  }, [image, blocked, deductUsage, messages.save_reminder, smoothIntensity, imageToDataUrl]);

  // AI Upscale via Doubao API
  const runUpscale = useCallback(async () => {
    if (!image || blocked) return;
    setProcessing(true);
    deductUsage();
    let ok = false;
    try {
      const dataUrl = imageToDataUrl(image);
      const res = await fetch("/api/image-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, tool: "upscale", smoothIntensity: upscaleScale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upscale failed");
      if (data.url) {
        setResultUrl(data.url);
        ok = true;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upscale failed";
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    }
    setProcessing(false);
    if (ok && messages.save_reminder) { setToast(messages.save_reminder); setTimeout(() => setToast(null), 6000); }
  }, [image, blocked, deductUsage, messages.save_reminder, upscaleScale, imageToDataUrl]);

  // Image filters (pure Canvas, free)
  const runFilter = useCallback(() => {
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;

    // Apply brightness/contrast/saturation
    ctx.filter = `brightness(${filterBrightness}%) contrast(${filterContrast}%) saturate(${filterSaturation}%)`;
    ctx.drawImage(image, 0, 0);

    // Apply preset overlay
    if (filterPreset === "grayscale") {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        d[i] = gray; d[i + 1] = gray; d[i + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (filterPreset === "sepia") {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (filterPreset === "vintage") {
      ctx.fillStyle = "rgba(205,133,63,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (filterPreset === "cool") {
      ctx.fillStyle = "rgba(59,130,246,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (filterPreset === "warm") {
      ctx.fillStyle = "rgba(251,146,60,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (filterPreset === "high_contrast") {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          const v = d[i + j];
          d[i + j] = v > 128 ? Math.min(255, v + 50) : Math.max(0, v - 50);
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    setResultUrl(canvas.toDataURL("image/png"));
  }, [image, filterPreset, filterBrightness, filterContrast, filterSaturation]);

  // When filter params change, auto-apply
  useEffect(() => {
    if (tool === "filters" && image && !processing) {
      const timer = setTimeout(runFilter, 100);
      return () => clearTimeout(timer);
    }
  }, [tool, image, filterPreset, filterBrightness, filterContrast, filterSaturation, runFilter, processing]);

  // ---- Draw crop preview with zoom/pan ----
  useEffect(() => {
    const canvas = cropCanvasRef.current;
    if (!canvas || !image || tool !== "crop" || !displaySize) return;
    const box = uploadBoxRef.current;
    if (!box) return;
    const ctx = canvas.getContext("2d")!;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    const fitW = displaySize.w;
    const fitH = displaySize.h;
    canvas.width = boxW;
    canvas.height = boxH;
    ctx.clearRect(0, 0, boxW, boxH);

    const dx = (boxW - fitW * zoom) / 2 + panX;
    const dy = (boxH - fitH * zoom) / 2 + panY;
    const dw = fitW * zoom;
    const dh = fitH * zoom;

    // Draw the zoomed/panned image
    ctx.drawImage(image, 0, 0, image.width, image.height, dx, dy, dw, dh);

    // Define clip path based on shape
    const getClipPath = (r: { x: number; y: number; w: number; h: number }) => {
      const path = new Path2D();
      if (cropShape === "circle") {
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const radius = Math.min(r.w, r.h) / 2;
        path.arc(cx, cy, radius, 0, Math.PI * 2);
      } else if (cropShape === "ellipse") {
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const rx = (r.w / 2) * (ellipseW / 100);
        const ry = (r.h / 2) * (ellipseH / 100);
        path.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      } else if (cropShape === "star") {
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const maxR = Math.min(r.w, r.h) / 2;
        const outerR = maxR * (starOuter / 100);
        const innerR = maxR * (starInner / 100);
        return starPath(cx, cy, outerR, innerR, starPoints, starCornerR);
      } else if (cornerRadius > 0) {
        path.roundRect(r.x, r.y, r.w, r.h, cornerRadius);
      } else {
        path.rect(r.x, r.y, r.w, r.h);
      }
      return path;
    };

    // Show crop rectangle if drawn
    if (cropRect) {
      // Draw full image first
      ctx.drawImage(image, 0, 0, image.width, image.height, dx, dy, dw, dh);

      // Create overlay with hole using evenodd fill
      const hole = getClipPath(cropRect);
      const overlay = new Path2D();
      overlay.rect(0, 0, boxW, boxH);
      overlay.addPath(hole);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fill(overlay, "evenodd");

      // Draw the shape outline
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.stroke(hole);

      // Rule-of-thirds guides (only for rectangle without large corner radius)
      if (cropShape === "rect" && cornerRadius < 20) {
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
          const lx = cropRect.x + (cropRect.w / 3) * i;
          const ly = cropRect.y + (cropRect.h / 3) * i;
          ctx.beginPath(); ctx.moveTo(lx, cropRect.y); ctx.lineTo(lx, cropRect.y + cropRect.h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cropRect.x, ly); ctx.lineTo(cropRect.x + cropRect.w, ly); ctx.stroke();
        }
      }
      // Circle: draw crosshair at center
      if (cropShape === "circle") {
        const cx = cropRect.x + cropRect.w / 2;
        const cy = cropRect.y + cropRect.h / 2;
        const radius = Math.min(cropRect.w, cropRect.h) / 2;
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8); ctx.stroke();
      }
    }
  }, [image, tool, displaySize, zoom, panX, panY, cropRect, cropShape, cornerRadius, starPoints, starOuter, starInner, starCornerR, ellipseW, ellipseH]);

  const reset = useCallback(() => {
    setResultUrl(null);
    setCropW("");
    setCropH("");
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setCropRect(null);
    setCropStart(null);
    setResizeEdge(null);
    setHoveredEdge(null);
    setMovingRect(false);
    setSizeConfirmed(false);
    setCompressInfo(null);
    setBgImageUrl(null);
    setFgImage(null);
    setReplacePreview(null);
    setBgZoom(1);
    setBgPanX(0);
    setBgPanY(0);
    setCompressFiles((prev) => { prev.forEach((f) => URL.revokeObjectURL(f.url)); return []; });
    setDividerPos(50);
    setFilterComparing(false);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl text-white">{messages.title}</h1>
        <p className="mt-3 text-text-secondary max-w-xl mx-auto text-sm leading-relaxed">
          {messages.subtitle}
        </p>
      </div>

      {/* Tool tabs — sliding door */}
      <div className="mb-8 w-[90%] mx-auto">
        <div className="flex flex-wrap rounded-xl border border-border/50 bg-bg-card p-1.5 relative">
          {/* Sliding indicator pill */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-lg bg-accent transition-all duration-300 ease-out"
            style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
          />
          {TOOLS.map((t) => (
            <button
              key={t.key}
              ref={(el) => { if (el) tabRefs.current.set(t.key, el); }}
              onClick={() => { setTool(t.key); reset(); }}
              className={cn(
                "relative z-10 flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 text-center whitespace-nowrap",
                tool === t.key ? "text-white" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {messages[t.key]}
              <span
                className={cn(
                  "absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap z-20",
                  t.free === "forever"
                    ? "bg-yellow-400/20 text-yellow-500"
                    : "bg-accent/20 text-accent-hover",
                )}
              >
                {t.free === "forever" ? messages.free_forever : messages.free_today}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool description */}
      <p className="text-center text-sm text-text-muted mb-8">
        {messages[`desc_${tool}` as keyof Messages]}
      </p>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Image area */}
        <div className="relative">
          {tool === "crop" && image && (
            <p className="absolute -top-5 left-1 text-[11px] text-text-muted text-left whitespace-nowrap pointer-events-none">
              {messages.crop_hint}
            </p>
          )}
          {tool === "crop" && image && displaySize && (() => {
            const box = uploadBoxRef.current;
            if (!box) return null;
            const boxW = box.clientWidth;
            const boxH = box.clientHeight;
            const fitW = displaySize.w;
            const fitH = displaySize.h;
            const rect = (cropRect && cropRect.w >= 5) ? cropRect : { x: 0, y: 0, w: boxW, h: boxH };
            const sw = Math.round(rect.w / (fitW * zoom) * image.width);
            const sh = Math.round(rect.h / (fitH * zoom) * image.height);
            const mw = parseInt(cropW);
            const mh = parseInt(cropH);
            const ow = mw > 0 && mh > 0 ? mw : sw;
            const oh = mw > 0 && mh > 0 ? mh : sh;
            return (
              <p className="absolute -top-5 right-1 text-[11px] text-text-muted text-right whitespace-nowrap">
                {ow} × {oh} {messages.crop_px}
              </p>
            );
          })()}
          <div
            ref={uploadBoxRef}
            className={cn(
              "relative rounded-2xl border-2 border-dashed aspect-[4/3] max-w-[800px] overflow-hidden transition-colors",
              dragOver ? "border-accent bg-accent/5" : "border-border/50 bg-bg-card",
              (tool === "compress" ? compressFiles.length === 0 : !image) && "cursor-pointer",
            )}
          onClick={() => (tool === "compress" ? compressFiles.length === 0 : !image) && openFileDialog()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />

          {tool === "compress" ? (
            compressFiles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <svg className="mx-auto h-12 w-12 text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-text-secondary font-medium mb-1">{messages.upload}</p>
                  <p className="text-text-muted text-sm mb-2">{messages.drop}</p>
                  <p className="text-text-muted text-xs">{messages.compress_max_hint}</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 p-3">
                <div className="flex items-center justify-between mb-2 py-1">
                  <p className="text-text-muted text-xs">{messages.compress_max_hint}</p>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); clearAllCompressFiles(); }}
                    className="text-xs text-danger/70 hover:text-danger transition-colors cursor-pointer shrink-0"
                  >
                    {messages.compress_delete_all}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {compressFiles.map((cf) => (
                    <div key={cf.id} className="relative group cursor-default" onClick={(ev) => ev.stopPropagation()}>
                      <img src={cf.url} alt={cf.name} className="w-full aspect-square object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(ev) => { ev.stopPropagation(); removeCompressFile(cf.id); }}
                          className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-sm hover:bg-danger/60 transition-colors cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                      {cf.compressing && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      )}
                      {cf.compSize !== undefined && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-success font-medium">
                          -{Math.round((1 - cf.compSize / cf.origSize) * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                  {compressFiles.length < MAX_COMPRESS_FILES && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); openFileDialog(); }}
                      className="aspect-square rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center text-text-muted hover:border-accent/50 hover:text-text-secondary transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          ) : !image ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <svg className="mx-auto h-12 w-12 text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-text-secondary font-medium mb-1">{messages.upload}</p>
                <p className="text-text-muted text-sm">{messages.drop}</p>
              </div>
            </div>
          ) : tool === "crop" ? (
            <canvas
              ref={cropCanvasRef}
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropHover}
              onContextMenu={handleCropContextMenu}
              className="absolute inset-0"
              style={{ cursor: dragging ? "grabbing" : resizeEdge ? edgeCursor[resizeEdge] || "move" : hoveredEdge ? edgeCursor[hoveredEdge] || "crosshair" : "crosshair" }}
            />
          ) : (
            showComparison ? (
              /* Before/After comparison slider */
              <div
                ref={dividerContainerRef}
                className="absolute inset-0 flex items-center justify-center select-none"
                style={{ cursor: draggingDivider ? "col-resize" : "default" }}
              >
                <div className="relative overflow-hidden" style={{ width: displaySize?.w, height: displaySize?.h }}>
                  {/* After (result) — full width underneath */}
                  <img src={resultUrl!} alt="After" className="absolute left-0 top-0 block" style={{ width: displaySize?.w, height: displaySize?.h }} />
                  {/* Before (original) — clipped from right via clip-path, stays fixed */}
                  <img
                    src={image!.src}
                    alt="Before"
                    className="absolute left-0 top-0 block"
                    style={{
                      width: displaySize?.w,
                      height: displaySize?.h,
                      clipPath: `inset(0 ${100 - dividerPos}% 0 0)`,
                    }}
                  />
                  {/* Divider line + handle */}
                  <div
                    className="absolute inset-y-0 z-10"
                    style={{ left: `${dividerPos}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      onMouseDown={handleDividerDown}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center cursor-col-resize hover:bg-white hover:scale-110 transition-transform border border-black/10"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" d="M8 4v16M16 4v16" />
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 -translate-x-1/2 w-0.5 bg-white/80 shadow-md" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="relative"
                  style={{
                    width: displaySize?.w,
                    height: displaySize?.h,
                    cursor: tool === "replace_bg" && fgImage && !resultUrl ? (bgDragging ? "grabbing" : "grab") : "default",
                  }}
                  onWheel={undefined}
                  onMouseDown={tool === "replace_bg" && fgImage && !resultUrl ? handleBgImageMouseDown : undefined}
                >
                  <img
                    src={(tool === "replace_bg" && replacePreview) || resultUrl || image.src}
                    alt={resultUrl ? "Result" : "Original"}
                    className="block w-full h-full pointer-events-none"
                  />
                </div>
              </div>
            )
          )}

          {/* Delete image button */}
          {image && tool !== "compress" && (
            <button
              onClick={(e) => { e.stopPropagation(); setImage(null); setImageName(""); setResultUrl(null); reset(); }}
              className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 hover:bg-red-500/80 hover:text-white transition-all cursor-pointer"
              title={messages.reset}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Before/After labels */}
          {showComparison && (
            <>
              <span className="absolute top-12 left-3 z-20 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm pointer-events-none">Before</span>
              <span className="absolute top-12 right-3 z-20 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm pointer-events-none">After</span>
            </>
          )}

          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-card/60 rounded-lg z-10">
              <div className="flex items-center gap-3 text-white">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {messages.processing}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Controls panel */}
        <div className="relative">
          <p className="absolute -top-5 right-1 text-[11px] text-text-muted text-right whitespace-nowrap">{messages.browser_hint}</p>
          <div className="flex flex-col space-y-6 h-full">
          {/* Usage / Credits */}
          {isLimitedTool && (
            <div className="rounded-xl border border-border/50 bg-bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">{messages.credits_remaining || "Credits"}</span>
                <span className="text-sm text-accent-hover font-semibold">{creditsRemaining}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {messages.per_use || "1 credit per use"}
              </p>
            </div>
          )}

          {/* Tool-specific controls */}
          <div className="rounded-xl border border-border/50 bg-bg-card p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5 shrink-0">
              {messages[tool]}
              {tool === "crop" && image && (
                <>
                  {resultUrl ? (
                    <a
                      href={resultUrl}
                      download={imageName.replace(/(\.[\w\d]+)$/, "_processed$1") || "processed.png"}
                      className="ml-auto rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-accent-hover"
                    >
                      {messages.download}
                    </a>
                  ) : (
                    <>
                      <button onClick={reset} className="ml-auto mr-3 text-xs text-text-muted hover:text-text-secondary transition-colors">
                        {messages.reset}
                      </button>
                      <button
                        onClick={applyCrop}
                        disabled={!image}
                        className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {messages.crop_apply}
                      </button>
                    </>
                  )}
                </>
              )}
              {tool === "compress" && (
                <>
                  <span className="group relative shrink-0">
                    <span className="inline-flex w-[18px] h-[18px] rounded-full border-2 border-accent/50 text-accent text-[11px] items-center justify-center cursor-help hover:bg-accent hover:text-white hover:border-accent transition-all font-bold">?</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-lg border border-border bg-bg-primary p-3 shadow-lg text-xs text-text-secondary leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                      {messages.compress_hint}
                    </span>
                  </span>
                  {compressFiles.length > 0 && (
                    compressFiles.every((f) => f.compSize !== undefined) ? (
                      <button
                        onClick={downloadAllAsZip}
                        className="ml-auto rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-accent-hover"
                      >
                        {messages.compress_download_all} (.zip)
                      </button>
                    ) : (
                      <button
                        onClick={batchCompress}
                        disabled={compressFiles.some((f) => f.compressing)}
                        className="ml-auto rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {compressFiles.some((f) => f.compressing)
                          ? messages.processing
                          : `${messages.compress} (${compressFiles.length}/${MAX_COMPRESS_FILES})`}
                      </button>
                    )
                  )}
                </>
              )}
              {tool === "filters" && resultUrl && (
                <button
                  onClick={() => setFilterComparing((v) => !v)}
                  className={cn(
                    "ml-auto rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    filterComparing
                      ? "bg-accent text-white"
                      : "bg-bg-secondary text-text-secondary hover:text-text-primary border border-border/50"
                  )}
                >
                  {messages.filter_compare || "Compare"}
                </button>
              )}
            </h3>

            <div className={cn("flex-1 overflow-x-hidden", tool === "compress" ? "overflow-hidden flex flex-col" : "overflow-y-auto")}>
            {/* Crop controls */}
            {tool === "crop" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">{messages.crop_aspect}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRatioAndAdjust(r.value)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          cropRatio === r.value
                            ? "bg-accent text-white"
                            : "bg-bg-secondary text-text-secondary hover:text-text-primary",
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                    <span className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min={1}
                        value={customRatioW}
                        onChange={(e) => setCustomRatioW(e.target.value)}
                        className="w-10 rounded-lg border border-border bg-bg-secondary px-1 py-1.5 text-xs text-text-primary text-center outline-none focus:border-accent/50"
                      />
                      <span className="text-[10px] text-text-muted">:</span>
                      <input
                        type="number"
                        min={1}
                        value={customRatioH}
                        onChange={(e) => setCustomRatioH(e.target.value)}
                        className="w-10 rounded-lg border border-border bg-bg-secondary px-1 py-1.5 text-xs text-text-primary text-center outline-none focus:border-accent/50"
                      />
                      <button
                        onClick={() => {
                          const w = parseInt(customRatioW);
                          const h = parseInt(customRatioH);
                          if (w > 0 && h > 0) setRatioAndAdjust(w / h);
                        }}
                        className="rounded-lg bg-accent/20 px-1.5 py-1.5 text-[10px] font-medium text-accent hover:bg-accent/30 transition-colors shrink-0"
                      >
                        OK
                      </button>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">
                    {messages.crop_width} × {messages.crop_height} ({messages.crop_px})
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {PHOTO_SIZES.map((ps, i) => {
                      const t = cropPhotoSizes[i] ?? { label: ps.key, tip: "" };
                      return (
                      <span key={ps.key} className="group relative">
                        <button
                          onClick={() => {
                            setCropW(String(ps.width));
                            setCropH(String(ps.height));
                            setCropRatio(0);
                            const box = uploadBoxRef.current;
                            if (box) {
                              const boxW = box.clientWidth;
                              const boxH = box.clientHeight;
                              const ratio = ps.width / ps.height;
                              let nw: number, nh: number;
                              if (boxW / boxH > ratio) { nh = boxH; nw = boxH * ratio; }
                              else { nw = boxW; nh = boxW / ratio; }
                              setCropRect({ x: (boxW - nw) / 2, y: (boxH - nh) / 2, w: nw, h: nh });
                            }
                            setZoom(1);
                            setPanX(0);
                            setPanY(0);
                            setSizeConfirmed(true);
                          }}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors w-full",
                            sizeConfirmed && parseInt(cropW) === ps.width && parseInt(cropH) === ps.height
                              ? "bg-accent text-white"
                              : "bg-bg-secondary text-text-secondary hover:text-text-primary",
                          )}
                        >
                          {t.label}
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 rounded-md border border-border bg-bg-primary px-2 py-1 text-[11px] text-text-secondary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                          {t.tip}
                        </span>
                      </span>
                    )})}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder={messages.crop_width}
                      value={cropW}
                      onChange={(e) => { setCropW(e.target.value); setSizeConfirmed(false); }}
                      className={cn(
                        "min-w-0 flex-1 rounded-lg border bg-bg-secondary px-2 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none",
                        sizeConfirmed ? "border-accent ring-1 ring-accent/30" : "border-border focus:border-accent/50",
                      )}
                    />
                    <span className="text-text-muted self-center text-xs shrink-0">×</span>
                    <input
                      type="number"
                      placeholder={messages.crop_height}
                      value={cropH}
                      onChange={(e) => { setCropH(e.target.value); setSizeConfirmed(false); }}
                      className={cn(
                        "min-w-0 flex-1 rounded-lg border bg-bg-secondary px-2 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none",
                        sizeConfirmed ? "border-accent ring-1 ring-accent/30" : "border-border focus:border-accent/50",
                      )}
                    />
                    <button
                      onClick={() => {
                        const mw = parseInt(cropW);
                        const mh = parseInt(cropH);
                        const hasW = mw > 0;
                        const hasH = mh > 0;
                        if (!hasW && !hasH) return;
                        let finalW = mw;
                        let finalH = mh;
                        if (hasW && !hasH && image) {
                          finalH = Math.round(mw / (image.width / image.height));
                          setCropH(String(finalH));
                        } else if (!hasW && hasH && image) {
                          finalW = Math.round(mh * (image.width / image.height));
                          setCropW(String(finalW));
                        } else if (!hasW || !hasH) {
                          return;
                        }
                        const box = uploadBoxRef.current;
                        if (!box) return;
                        const boxW = box.clientWidth;
                        const boxH = box.clientHeight;
                        const ratio = finalW / finalH;
                        let nw: number, nh: number;
                        if (boxW / boxH > ratio) { nh = boxH; nw = boxH * ratio; }
                        else { nw = boxW; nh = boxW / ratio; }
                        setCropRect({ x: (boxW - nw) / 2, y: (boxH - nh) / 2, w: nw, h: nh });
                        setCropRatio(0);
                        setZoom(1);
                        setPanX(0);
                        setPanY(0);
                        setSizeConfirmed(true);
                      }}
                      disabled={cropRatio > 0}
                      className={cn(
                        "shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                        cropRatio > 0
                          ? "bg-accent/30 text-white/50 cursor-not-allowed"
                          : "bg-accent text-white hover:bg-accent-hover",
                      )}
                    >
                      {messages.crop_confirm}
                    </button>
                  </div>
                </div>

                {/* Crop shape */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">{messages.crop_shape}</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => setCropShape("rect")}
                      className={cn(
                        "rounded-lg py-2 text-xs font-medium transition-colors",
                        cropShape === "rect" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:text-text-primary",
                      )}
                    >
                      <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x={3} y={3} width={18} height={18} rx={2} />
                      </svg>
                      {messages.crop_shape_rect}
                    </button>
                    <button
                      onClick={() => { setCropShape("circle"); setCornerRadius(0); setCropRatio(1); }}
                      className={cn(
                        "rounded-lg py-2 text-xs font-medium transition-colors",
                        cropShape === "circle" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:text-text-primary",
                      )}
                    >
                      <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx={12} cy={12} r={9} />
                      </svg>
                      {messages.crop_shape_circle}
                    </button>
                    <button
                      onClick={() => { setCropShape("ellipse"); setCornerRadius(0); }}
                      className={cn(
                        "rounded-lg py-2 text-xs font-medium transition-colors",
                        cropShape === "ellipse" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:text-text-primary",
                      )}
                    >
                      <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <ellipse cx={12} cy={12} rx={10} ry={7} />
                      </svg>
                      {messages.crop_shape_ellipse}
                    </button>
                    <button
                      onClick={() => { setCropShape("star"); setCornerRadius(0); }}
                      className={cn(
                        "rounded-lg py-2 text-xs font-medium transition-colors",
                        cropShape === "star" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:text-text-primary",
                      )}
                    >
                      <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 2l1.5 6.5L20 9l-5 4 1.5 6.5L12 16l-4.5 3.5L9 13l-5-4 6.5-.5z" />
                      </svg>
                      {messages.crop_shape_star}
                    </button>
                  </div>
                </div>

                {/* Corner radius (only for rectangle) */}
                {cropShape === "rect" && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-2 block">
                      {messages.crop_corner_radius}: {cornerRadius}px
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      step={4}
                      value={cornerRadius}
                      onChange={(e) => setCornerRadius(Number(e.target.value))}
                      className="w-full accent-accent h-1"
                    />
                  </div>
                )}

                {/* Star controls */}
                {cropShape === "star" && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">
                        {messages.star_points}: {starPoints}
                      </label>
                      <input
                        type="range"
                        min={3}
                        max={12}
                        value={starPoints}
                        onChange={(e) => setStarPoints(Number(e.target.value))}
                        className="w-full accent-accent h-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">
                        {messages.star_outer}: {starOuter}%
                      </label>
                      <input
                        type="range"
                        min={30}
                        max={100}
                        value={starOuter}
                        onChange={(e) => setStarOuter(Number(e.target.value))}
                        className="w-full accent-accent h-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">
                        {messages.star_inner}: {starInner}%
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={starInner}
                        onChange={(e) => setStarInner(Number(e.target.value))}
                        className="w-full accent-accent h-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">
                        {messages.star_corner}: {starCornerR}px
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        value={starCornerR}
                        onChange={(e) => setStarCornerR(Number(e.target.value))}
                        className="w-full accent-accent h-1"
                      />
                    </div>
                  </div>
                )}

                {/* Ellipse controls */}
                {cropShape === "ellipse" && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">
                        {messages.ellipse_width}: {ellipseW}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={ellipseW}
                        onChange={(e) => setEllipseW(Number(e.target.value))}
                        className="w-full accent-accent h-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">
                        {messages.ellipse_height}: {ellipseH}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={ellipseH}
                        onChange={(e) => setEllipseH(Number(e.target.value))}
                        className="w-full accent-accent h-1"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Compress controls */}
            {tool === "compress" && (
              <div className="flex flex-col flex-1 min-h-0 space-y-3">
                <div className="shrink-0">
                  <label className="text-xs font-medium text-text-secondary mb-0.5 block leading-tight">
                    {messages.compress_quality}: {quality}%
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-accent h-1"
                  />
                </div>
                <div className="shrink-0">
                  <label className="text-xs font-medium text-text-secondary mb-0.5 block leading-tight">
                    {messages.compress_max}: {maxKB} KB
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    step={50}
                    value={maxKB}
                    onChange={(e) => setMaxKB(Number(e.target.value))}
                    className="w-full accent-accent h-1"
                  />
                </div>
                {compressFiles.length > 0 && (
                  <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                      {compressFiles.map((cf, idx) => (
                        <div key={cf.id} className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-bg-secondary/50 p-1.5">
                          <span className="text-[10px] text-text-muted w-4 text-right shrink-0 mr-1">{idx + 1}</span>
                          <img src={cf.url} alt={cf.name} className="w-8 h-8 rounded object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-text-primary truncate">{cf.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {formatSize(cf.origSize)}
                              {cf.compSize !== undefined && (
                                <span className="text-success ml-1">→ {formatSize(cf.compSize)} ({Math.round((1 - cf.compSize / cf.origSize) * 100)}%)</span>
                              )}
                              {cf.compressing && <span className="text-accent ml-1">…</span>}
                            </p>
                          </div>
                          {cf.resultUrl && (
                            <a
                              href={cf.resultUrl}
                              download={cf.name.replace(/(\.[\w\d]+)$/, "_compressed$1")}
                              className="shrink-0 rounded-lg bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success hover:bg-success/20 transition-colors"
                            >
                              {messages.download}
                            </a>
                          )}
                          <button
                            onClick={() => removeCompressFile(cf.id)}
                            className="shrink-0 w-5 h-5 rounded-full text-text-muted hover:text-danger transition-colors text-xs cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            )}

            {/* Remove BG controls */}
            {tool === "remove_bg" && (
              <div className="space-y-3">
                <button
                  onClick={runRemoveBg}
                  disabled={blocked || processing}
                  className="w-full rounded-xl bg-accent py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {processing ? messages.processing : messages.remove_bg_action}
                </button>
                {resultUrl && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <a
                      href={resultUrl}
                      download={imageName.replace(/(\.[\w\d]+)$/, "_processed$1") || "processed.png"}
                      className="block w-full rounded-xl border border-border bg-white/5 py-2 text-center text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.download}
                    </a>
                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-border bg-bg-secondary/50 py-2 text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.reset}
                    </button>
                  </div>
                )}
                {blocked && (
                  <p className="text-xs text-center text-danger">{messages.upgrade}</p>
                )}
              </div>
            )}

            {/* Replace BG controls */}
            {tool === "replace_bg" && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">{messages.replace_bg_color}</label>
                  <div className="flex flex-wrap gap-1.5 ml-1">
                    {BG_COLORS.map((c) => (
                      <span key={c.color} className="group relative">
                        <button
                          onClick={() => { setBgColor(c.color); setBgImageUrl(null); setCustomColorInput(false); setEyeDropperUsed(false); }}
                          className={cn(
                            "w-7 h-7 rounded-full ring-2 shrink-0 transition-all shadow-[inset_0_0_0_2px_#18181b] cursor-pointer",
                            bgColor === c.color && !customColorInput
                              ? "ring-accent scale-110 shadow-[0_0_14px_rgba(168,85,247,0.7),inset_0_0_0_2px_#18181b]"
                              : "ring-border/50",
                          )}
                          style={{
                            background: c.color === "transparent"
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                              : c.color,
                            backgroundSize: c.color === "transparent" ? "8px 8px" : undefined,
                            backgroundPosition: c.color === "transparent" ? "0 0, 4px 4px" : undefined,
                          }}
                        />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 rounded-md border border-border bg-bg-primary px-2 py-1 text-[11px] text-text-secondary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                          {c.name}
                        </span>
                      </span>
                    ))}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => { setCustomColorInput(!customColorInput); setBgImageUrl(null); setEyeDropperUsed(false); }}
                        className={cn(
                          "w-7 h-7 rounded-full ring-2 transition-all flex items-center justify-center shadow-[inset_0_0_0_2px_#18181b] cursor-pointer",
                          customColorInput ? "ring-accent scale-110 shadow-[0_0_14px_rgba(168,85,247,0.7),inset_0_0_0_2px_#18181b]" : "ring-border/50",
                        )}
                        style={{ background: "conic-gradient(#f87171,#fb923c,#facc15,#4ade80,#38bdf8,#818cf8,#c084fc,#e879f9,#f87171)" }}
                      />
                      {customColorInput && (
                        <div className="absolute top-full mt-2 right-0 flex items-center gap-1.5 rounded-lg border border-border bg-bg-primary p-2 shadow-lg z-10">
                          <button
                            onClick={handleEyeDropper}
                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: eyeDropperUsed ? "#a855f7" : "#ffffff",
                              color: eyeDropperUsed ? "#ffffff" : "#a855f7",
                              boxShadow: eyeDropperUsed ? "0 0 6px rgba(168,85,247,0.4)" : undefined,
                            }}
                            title="Pick color"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.3 8.925l-4.25-4.2 1.4-1.4q.575-.575 1.413-.575.837 0 1.412.575l1.4 1.4q.575.575.575 1.413 0 .837-.575 1.412ZM17.85 10.4l-10.6 10.6q-.275.275-.638.425-.362.15-.762.15H2.3q-.35 0-.575-.225Q1.5 21.125 1.5 20.775v-3.6q0-.375.15-.737.15-.363.425-.638L12.65 5.25Z" />
                            </svg>
                          </button>
                          <span
                            className="w-5 h-5 rounded-full border border-border/50 shrink-0"
                            style={{ background: customColor }}
                          />
                          <div className="flex items-center rounded-lg border border-border bg-bg-secondary overflow-hidden">
                            <span className="pl-2 text-xs text-text-muted select-none">#</span>
                            <input
                              key={pickKey}
                              type="text"
                              value={customColor.replace(/^#/, "")}
                              onChange={(e) => { const v = "#" + e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6); setCustomColor(v); setBgColor(v); setEyeDropperUsed(false); }}
                              placeholder="000000"
                              maxLength={6}
                              className="w-18 bg-transparent px-1.5 py-1 text-xs text-text-primary placeholder:text-text-muted outline-none"
                            />
                          </div>
                          <button
                            onClick={() => { setCustomColorInput(false); setEyeDropperUsed(false); }}
                            className="shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => { setCustomColorInput(false); setEyeDropperUsed(false); }}
                            className="shrink-0 rounded-md border border-border/50 px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:border-border transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">{messages.replace_bg_image}</label>
                  <input ref={bgImageFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgImage} />
                  {bgImageUrl ? (
                    <div>
                      <div
                        ref={bgPreviewRef}
                        className="relative w-full h-24 rounded-lg overflow-hidden border border-border/50 select-none"
                        style={{ background: "#18181b" }}
                      >
                        <canvas
                          ref={bgCanvasRef}
                          className="absolute inset-0 w-full h-full"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70 pointer-events-none">
                          {Math.round(bgZoom * 100)}%
                        </span>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); setBgZoom(1); setBgPanX(0); setBgPanY(0); }}
                          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white/70 text-[10px] flex items-center justify-center hover:bg-black/80 hover:text-white transition-colors cursor-pointer"
                          title="Reset zoom"
                        >
                          ↺
                        </button>
                        {!resultUrl && (
                          <button
                            onClick={(ev) => { ev.stopPropagation(); setBgImageUrl(null); setBgZoom(1); setBgPanX(0); setBgPanY(0); if (bgImageFileRef.current) bgImageFileRef.current.value = ""; }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/70 text-[10px] flex items-center justify-center hover:bg-red-500/80 hover:text-white transition-colors cursor-pointer"
                            title={messages.replace_bg_image}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => bgImageFileRef.current?.click()}
                      className="w-full rounded-lg border border-dashed border-border/50 py-2 text-xs text-text-muted hover:border-accent/50 hover:text-text-secondary transition-colors"
                    >
                      + {messages.replace_bg_image}
                    </button>
                  )}
                </div>
                {!fgImage ? (
                  <button
                    onClick={runBgCutout}
                    disabled={blocked || processing}
                    className="w-full rounded-xl bg-accent py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processing ? messages.processing : messages.remove_bg_action}
                  </button>
                ) : !resultUrl ? (
                  <button
                    onClick={applyReplaceBg}
                    className="w-full rounded-xl bg-accent py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
                  >
                    {messages.replace_bg_apply}
                  </button>
                ) : null}
                {resultUrl && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <a
                      href={resultUrl}
                      download={imageName.replace(/(\.[\w\d]+)$/, "_processed$1") || "processed.png"}
                      className="block w-full rounded-xl border border-border bg-white/5 py-2 text-center text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.download}
                    </a>
                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-border bg-bg-secondary/50 py-2 text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.reset}
                    </button>
                  </div>
                )}
                {blocked && (
                  <p className="text-xs text-center text-danger">{messages.upgrade}</p>
                )}
              </div>
            )}

            {/* Smooth controls */}
            {tool === "smooth" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">{messages.smooth_intensity}</label>
                  <div className="flex gap-2">
                    {(["light", "medium", "strong"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSmoothIntensity(level)}
                        className={cn(
                          "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                          smoothIntensity === level
                            ? "bg-accent text-white"
                            : "bg-bg-secondary text-text-secondary hover:text-text-primary",
                        )}
                      >
                        {messages[`smooth_${level}` as keyof Messages]}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={runSmooth}
                  disabled={blocked || processing}
                  className="w-full rounded-xl bg-accent py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {processing ? messages.processing : messages.smooth_apply}
                </button>
                {resultUrl && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <a
                      href={resultUrl}
                      download={imageName.replace(/(\.[\w\d]+)$/, "_processed$1") || "processed.png"}
                      className="block w-full rounded-xl border border-border bg-white/5 py-2 text-center text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.download}
                    </a>
                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-border bg-bg-secondary/50 py-2 text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.reset}
                    </button>
                  </div>
                )}
                {blocked && (
                  <p className="text-xs text-center text-danger">{messages.upgrade}</p>
                )}
              </div>
            )}

            {/* Upscale controls */}
            {tool === "upscale" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setUpscaleScale("2x")}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                      upscaleScale === "2x"
                        ? "bg-accent text-white"
                        : "bg-bg-card border border-border/50 text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {messages.upscale_2x || "2x"}
                  </button>
                  <button
                    onClick={() => setUpscaleScale("4x")}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                      upscaleScale === "4x"
                        ? "bg-accent text-white"
                        : "bg-bg-card border border-border/50 text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {messages.upscale_4x || "4x"}
                  </button>
                </div>
                <button
                  onClick={runUpscale}
                  disabled={blocked || processing}
                  className="w-full rounded-xl bg-accent py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {processing ? messages.processing : messages.upscale_apply || "Upscale"}
                </button>
                {image && (
                  <p className="text-[11px] text-text-muted text-center">
                    {Math.round(image.width)} × {Math.round(image.height)} px → <span className="text-white font-medium">{upscaleScale === "2x" ? "2X" : "4X"}</span> → {upscaleScale === "2x" ? `${Math.round(image.width * 2)} × ${Math.round(image.height * 2)} px` : `${Math.round(image.width * 4)} × ${Math.round(image.height * 4)} px`}
                  </p>
                )}
                {resultUrl && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <a
                      href={resultUrl}
                      download={`upscaled_${imageName}`}
                      className="block w-full rounded-xl border border-border bg-white/5 py-2 text-center text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.download}
                    </a>
                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-border bg-bg-secondary/50 py-2 text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.reset}
                    </button>
                  </div>
                )}
                {blocked && (
                  <p className="text-xs text-center text-danger">{messages.upgrade}</p>
                )}
              </div>
            )}

            {/* Filters controls */}
            {tool === "filters" && (
              <div className="space-y-3">
                {/* Preset buttons */}
                <div>
                  <p className="text-xs text-text-muted mb-2">{messages.filters_presets || "Presets"}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: "original", label: messages.filter_original },
                      { key: "grayscale", label: messages.filter_grayscale },
                      { key: "sepia", label: messages.filter_sepia },
                      { key: "vintage", label: messages.filter_vintage },
                      { key: "cool", label: messages.filter_cool },
                      { key: "warm", label: messages.filter_warm },
                      { key: "high_contrast", label: messages.filter_contrast_label },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setFilterPreset(p.key)}
                        className={cn(
                          "rounded-lg py-1.5 text-xs font-medium transition-all",
                          filterPreset === p.key
                            ? "bg-accent text-white"
                            : "bg-bg-card border border-border/50 text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{messages.filters_brightness || "Brightness"}</span>
                      <span>{filterBrightness}%</span>
                    </div>
                    <input
                      type="range" min={0} max={200} value={filterBrightness}
                      onChange={(e) => setFilterBrightness(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full bg-border appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{messages.filters_contrast || "Contrast"}</span>
                      <span>{filterContrast}%</span>
                    </div>
                    <input
                      type="range" min={0} max={200} value={filterContrast}
                      onChange={(e) => setFilterContrast(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full bg-border appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{messages.filters_saturation || "Saturation"}</span>
                      <span>{filterSaturation}%</span>
                    </div>
                    <input
                      type="range" min={0} max={300} value={filterSaturation}
                      onChange={(e) => setFilterSaturation(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full bg-border appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                </div>

                {resultUrl && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <a
                      href={resultUrl}
                      download={`filtered_${imageName}`}
                      className="block w-full rounded-xl border border-border bg-white/5 py-2 text-center text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.download}
                    </a>
                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-border bg-bg-secondary/50 py-2 text-sm font-medium text-text-secondary transition-all hover:text-text-primary hover:border-accent/30"
                    >
                      {messages.reset}
                    </button>
                  </div>
                )}
              </div>
            )}

            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Save reminder toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
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
    </section>
  );
}
