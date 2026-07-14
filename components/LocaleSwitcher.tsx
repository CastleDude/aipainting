"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

const LOCALES: Record<string, string> = {
  en: "EN",
  zh: "中文",
  "zh-Hant": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

export function LocaleSwitcher({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = LOCALES[locale] || LOCALES["en"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary hover:bg-bg-card"
      >
        <span>{current}</span>
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl border border-border bg-bg-card shadow-xl z-50 py-1 min-w-[80px]">
          {Object.entries(LOCALES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                router.replace(pathname, { locale: key });
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-xs text-center transition-colors hover:bg-bg-secondary/50",
                locale === key ? "text-accent font-medium" : "text-text-secondary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
