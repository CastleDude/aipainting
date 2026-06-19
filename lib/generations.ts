export interface Generation {
  id: string;
  prompt: string;
  model: string;
  image_url: string;
  thumb_url?: string | null;
  is_public: boolean;
  created_at: string;
}

const MOCK_KEY = "mock_generations";

export function getMockGenerations(): Generation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getMockGalleryItems(): Generation[] {
  return getMockGenerations().filter((g) => g.is_public);
}

export function toggleMockGenerationPublic(id: string): boolean | null {
  if (typeof window === "undefined") return null;
  const items = getMockGenerations();
  const item = items.find((g) => g.id === id);
  if (!item) return null;
  item.is_public = !item.is_public;
  localStorage.setItem(MOCK_KEY, JSON.stringify(items));
  // Also sync to cookie so /api/gallery reads the updated state
  try {
    document.cookie = `mock_generations=${encodeURIComponent(JSON.stringify(items))};path=/;max-age=86400;SameSite=Lax`;
  } catch { /* ignore */ }
  return item.is_public;
}

export function saveMockGeneration(gen: { prompt: string; model: string; image_url: string; is_public?: boolean }): number {
  const items = getMockGenerations();
  items.unshift({
    id: crypto.randomUUID(),
    ...gen,
    is_public: gen.is_public || false,
    created_at: new Date().toISOString(),
  });
  const trimmed = items.slice(0, 20);
  localStorage.setItem(MOCK_KEY, JSON.stringify(trimmed));
  return trimmed.length;
}
