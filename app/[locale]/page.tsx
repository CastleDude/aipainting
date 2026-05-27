import { getTranslations } from "next-intl/server";
import { ImageGenerator } from "@/components/ImageGenerator";
import { Testimonials } from "@/components/Testimonials";
import { BackgroundDots } from "@/components/BackgroundDots";
import { HomeParticleWrapper } from "@/components/HomeClient";

const featureIcons = [
  <svg key="multi" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <rect x={3} y={3} width={7} height={7} rx={1} />
    <rect x={14} y={3} width={7} height={7} rx={1} />
    <rect x={3} y={14} width={7} height={7} rx={1} />
    <rect x={14} y={14} width={7} height={7} rx={1} />
  </svg>,
  <svg key="fast" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />
  </svg>,
  <svg key="nologin" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v2" />
  </svg>,
  <svg key="privacy" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5.25-3.13 10.15-7 11-3.87-.85-7-5.75-7-11V6l7-4z" />
  </svg>,
  <svg key="hd" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>,
  <svg key="free" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>,
  <svg key="star" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
  </svg>,
  <svg key="globe" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg)" strokeWidth={1.5}>
    <circle cx={12} cy={12} r={10} />
    <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>,
];

const featureKeys = ["multi_model", "fast", "no_login", "privacy", "hd_quality", "free_tier", "rating", "global"];

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];

export default async function HomePage() {
  const t = await getTranslations();

  // ── JSON-LD Structured Data ──
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqKeys.map((key) => ({
      "@type": "Question",
      name: t(`faq.${key}`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq.a${key.slice(1)}`),
      },
    })),
  };

  const appStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Painting",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: t("site.description"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "25000",
    },
  };

  return (
    <HomeParticleWrapper>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />

      <ImageGenerator
        messages={{
          title: t("hero.title"),
          subtitle: t("hero.subtitle"),
          prompt_placeholder: t("generate.prompt_placeholder"),
          negative_prompt: t("generate.negative_prompt"),
          negative_placeholder: t("generate.negative_placeholder"),
          model: t("generate.model"),
          aspect_ratio: t("generate.aspect_ratio"),
          style: t("generate.style"),
          num_images: t("generate.num_images"),
          generate_btn: t("generate.generate_btn"),
          generating: t("generate.generating"),
          download: t("generate.download"),
          regenerate: t("generate.regenerate"),
          no_results: t("generate.no_results"),
          free_remaining: t("generate.free_remaining"),
          credits_remaining: t("generate.credits_remaining"),
          upgrade_hint: t("generate.upgrade_hint"),
          speed_fast: t("generate.speed_fast"),
          speed_normal: t("generate.speed_normal"),
          negative_toggle: t("generate.negative_toggle"),
          add_image: t("generate.add_image"),
          gallery_title: t("gallery.title"),
          gallery_subtitle: t("gallery.subtitle"),
          gallery_remix: t("gallery.remix"),
          save_reminder: t("dashboard.save_reminder"),
          share_to_gallery: t("generate.share_to_gallery"),
          shared_to_gallery: t("generate.shared_to_gallery"),
          translate_prompt: t("generate.translate_prompt"),
          english_hint: t("generate.english_hint"),
          share_limit: t("generate.share_limit"),
          share_similar: t("generate.share_similar"),
          reference_image_added: t("generate.reference_image_added"),
          reference_image_hint: t("generate.reference_image_hint"),
          switch_to_seedream: t("generate.switch_to_seedream"),
        }}
      />

      <BackgroundDots />

      {/* Why choose us */}
      <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            {t("home.why_title")}
          </h2>
          <p className="mt-3 text-text-secondary max-w-2xl mx-auto text-sm leading-relaxed">
            {t("home.why_subtitle")}
          </p>
        </div>

        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureKeys.map((key, i) => (
            <div key={key} className="rounded-xl border border-border/50 bg-bg-card p-6 hover:border-accent/20 transition-all group text-center">
              <div className="mb-3 flex justify-center">{featureIcons[i]}</div>
              <h3 className="font-semibold text-base text-text-primary mb-2">
                {t(`home.features.${key}.title`)}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t(`home.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials messages={{ title: t("testimonials.title"), subtitle: t("testimonials.subtitle") }} />

      {/* FAQ */}
      <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold sm:text-5xl text-white">
            {t("faq.title")}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {faqKeys.map((key) => (
            <div key={key} className="py-4">
              <h3 className="text-base font-semibold text-text-primary mb-2">
                <span className="text-accent mr-2">
                  {String(faqKeys.indexOf(key) + 1).padStart(2, "0")}.
                </span>
                {t(`faq.${key}`)}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed pl-7">
                {t(`faq.a${key.slice(1)}`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </HomeParticleWrapper>
  );
}
