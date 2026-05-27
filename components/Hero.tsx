import Link from "next/link";

interface HeroProps {
  messages: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
    secondary: string;
    rating?: string;
    creators?: string;
    models?: string;
  };
}

export function Hero({ messages }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background effect */}
      <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[600px] w-[600px] rounded-full bg-accent opacity-[0.03] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mb-6 inline-flex items-center rounded-full border border-accent/30 bg-accent-bg px-4 py-1.5 text-sm text-accent">
          ✨ {messages.badge}
        </div>

        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="gradient-text">{messages.title}</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-text-secondary sm:text-xl leading-relaxed">
          {messages.subtitle}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/generate"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-accent-hover hover:glow-accent"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {messages.cta}
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-border px-8 py-4 text-lg font-medium text-text-secondary transition-all hover:border-accent/50 hover:text-text-primary"
          >
            {messages.secondary}
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400">★★★★★</span>
            <span>{messages.rating || "4.9/5"}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>{messages.creators || "25,000+ creators"}</div>
          <div className="h-4 w-px bg-border" />
          <div>{messages.models || "10+ AI models"}</div>
        </div>
      </div>
    </section>
  );
}
