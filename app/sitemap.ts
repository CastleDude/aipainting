import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aipaiting.com";

  const locales = ["en", "zh", "zh-Hant", "ja", "ko"];
  const pages: Array<{ path: string; changeFrequency: "weekly" | "monthly"; priority: number }> = [
    { path: "", changeFrequency: "monthly", priority: 1 },
    { path: "/generate", changeFrequency: "weekly", priority: 0.9 },
    { path: "/image-tools", changeFrequency: "monthly", priority: 0.85 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/gallery", changeFrequency: "weekly", priority: 0.85 },
    { path: "/history", changeFrequency: "monthly", priority: 0.6 },
    { path: "/dashboard", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  return entries;
}
