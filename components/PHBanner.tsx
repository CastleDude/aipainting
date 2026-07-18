"use client";

import { useState, useEffect } from "react";

interface PHBannerProps {
  locale: string;
  messages: { ph_title: string; ph_subtitle: string; ph_vote: string };
}

export function PHBanner({ locale, messages }: PHBannerProps) {
  const [dismissed, setDismissed] = useState(false);

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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl px-4 py-3 shadow-lg w-[90vw] sm:w-auto sm:max-w-none">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-xl sm:text-2xl shrink-0">🚀</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-amber-400">{messages.ph_title}</p>
          <p className="text-[10px] sm:text-xs text-text-secondary">{messages.ph_subtitle}</p>
        </div>
        <button onClick={dismiss} className="text-text-muted hover:text-text-secondary text-2xl leading-none shrink-0 sm:hidden">&times;</button>
      </div>
      <a
        href="https://www.producthunt.com/posts/aipainting"
        target="_blank"
        rel="noopener"
        className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 transition-colors shrink-0 w-full sm:w-auto text-center"
      >
        {messages.ph_vote}
      </a>
      <button onClick={dismiss} className="text-text-muted hover:text-text-secondary text-lg leading-none ml-1 hidden sm:block">&times;</button>
    </div>
  );
}
