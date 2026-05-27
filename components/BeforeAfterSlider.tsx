"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function BeforeAfterSlider({
  img,
  imgBefore,
  imgAfter,
  alt,
  beforeLabel = "Before",
  afterLabel = "After",
  children,
}: {
  img?: string;
  imgBefore?: string;
  imgAfter?: string;
  alt: string;
  beforeLabel?: string;
  afterLabel?: string;
  children?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    setPosition(Math.max(2, Math.min(98, (x / rect.width) * 100)));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    updatePosition(e.clientX);
  }, [updatePosition]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      updatePosition(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [updatePosition]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    draggingRef.current = true;
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      updatePosition(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      draggingRef.current = false;
    };
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [updatePosition]);

  return (
    <div ref={containerRef} className="group relative overflow-hidden rounded-xl border border-border/30 bg-bg-card hover:border-accent/20 transition-all aspect-video select-none">
      {/* Before — left side of the divider */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={imgBefore || img} alt={`${alt} before`} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">{beforeLabel}</span>
      </div>
      {/* After — right side of the divider */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <img src={imgAfter || img} alt={`${alt} after`} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <span className="absolute top-3 right-3 rounded-full bg-accent/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">{afterLabel}</span>
      </div>
      {/* Draggable divider */}
      <div
        className="absolute inset-y-0 z-10 flex items-center justify-center cursor-ew-resize"
        style={{ left: `calc(${position}% - 32px)`, width: 64 }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="h-full w-[2px] bg-white/70 shadow-lg" />
        <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur border border-white/40 shadow-xl">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4l-6 8 6 8M16 4l6 8-6 8" />
          </svg>
        </div>
      </div>
      {/* Bottom overlay */}
      {children}
    </div>
  );
}
