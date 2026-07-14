"use client";

import { useState, useEffect } from "react";

interface PHBannerProps {
  locale: string;
  messages: { ph_title: string; ph_subtitle: string; ph_vote: string };
}

export function PHBanner({ locale, messages }: PHBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const val = localStorage.getItem("ph_banner_dismissed");
    if (!val) setDismissed(false);
  }, []);

  const dismiss = () => {
    localStorage.setItem("ph_banner_dismissed", "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl px-5 py-3 shadow-lg animate-in slide-in-from-bottom-4">
      <span className="text-2xl">🚀</span>
      <div>
        <p className="text-sm font-semibold text-amber-400">{messages.ph_title}</p>
        <p className="text-xs text-text-secondary">{messages.ph_subtitle}</p>
      </div>
      <a
        href="https://www.producthunt.com/posts/aipainting"
        target="_blank"
        rel="noopener"
        className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 transition-colors shrink-0"
      >
        {messages.ph_vote}
      </a>
      <button onClick={dismiss} className="text-text-muted hover:text-text-secondary text-lg leading-none ml-1">&times;</button>
    </div>
  );
}
