"use client";

import { useRef, useState } from "react";
import { ParticleOverlay } from "@/components/ImageGenerator";
import { ParticleContext } from "@/components/ParticleContext";
import type { ReactNode } from "react";

export function HomeParticleWrapper({ children }: { children: ReactNode }) {
  const galleryMouseRef = useRef<{ x: number; y: number } | null>(null);
  const startYRef = useRef<number>(0);
  const [galleryActive, setGalleryActive] = useState(false);

  return (
    <ParticleContext.Provider value={{ galleryMouseRef, galleryActive, startYRef }}>
      <div
        className="relative"
        onMouseEnter={() => setGalleryActive(true)}
        onMouseMove={(e) => { galleryMouseRef.current = { x: e.clientX, y: e.clientY }; }}
        onMouseLeave={() => { setGalleryActive(false); galleryMouseRef.current = null; }}
      >
        <ParticleOverlay startYRef={startYRef} />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </ParticleContext.Provider>
  );
}
