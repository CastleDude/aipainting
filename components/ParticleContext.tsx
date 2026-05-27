"use client";

import { createContext, useContext } from "react";
import type { MutableRefObject } from "react";

export interface ParticleContextValue {
  galleryMouseRef: MutableRefObject<{ x: number; y: number } | null>;
  galleryActive: boolean;
  startYRef: MutableRefObject<number>;
}

export const ParticleContext = createContext<ParticleContextValue | null>(null);

export function useParticleContext() {
  const ctx = useContext(ParticleContext);
  return ctx;
}
