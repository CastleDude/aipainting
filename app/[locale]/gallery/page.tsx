import type { Metadata } from "next";
import GalleryPageClient, { GALLERY_META } from "@/components/GalleryPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = GALLERY_META[locale] || GALLERY_META.en;
  return { title: meta.title, description: meta.description };
}

export default function Page() {
  return <GalleryPageClient />;
}
