"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
  onDownload?: () => void;
}

export function ImageViewer({ src, alt, onClose, onDownload }: ImageViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    // Image is centered by flexbox, so its center = container center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setZoom((z) => {
      const newZoom = clamp(z * (e.deltaY < 0 ? 1.15 : 0.87), 0.5, 10);
      const ratio = newZoom / z;
      setPan((p) => ({
        // Zoom toward image center: screen point (cx,cy) maps to image center + pan
        x: (cx - centerX) * (1 - ratio) + p.x * ratio,
        y: (cy - centerY) * (1 - ratio) + p.y * ratio,
      }));
      return newZoom;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setPan({
        x: dragStart.px + (e.clientX - dragStart.x),
        y: dragStart.py + (e.clientY - dragStart.y),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, dragStart]);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button - prominent */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-all hover:scale-110 cursor-pointer shadow-lg"
        aria-label="Close"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <button
          onClick={handleReset}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 transition-colors cursor-pointer"
        >
          {Math.round(zoom * 100)}%
        </button>
        {onDownload && (
          <button
            onClick={onDownload}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Image */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        style={{ cursor: dragging ? "grabbing" : zoom > 1 ? "grab" : "default" }}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] select-none"
          draggable={false}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: dragging ? "none" : "transform 0.15s ease-out",
          }}
          onDoubleClick={handleReset}
        />
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40">
        Scroll to zoom · Drag to pan · Double-click to reset · Esc to close
      </div>
    </div>
  );

  return mounted ? createPortal(overlay, document.body) : null;
}
