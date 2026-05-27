import { getTranslations } from "next-intl/server";
import { ImageTools } from "@/components/ImageTools";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import type { Metadata } from "next";

const IMAGE_TOOLS_META: Record<string, { title: string; description: string }> = {
  en: { title: "Free Online Image Tools — AI Painting", description: "Crop, compress, remove background, AI upscale, and apply filters. All tools run in your browser with zero uploads. No sign-up required." },
  zh: { title: "免费在线图片工具 — AI 画境", description: "裁剪、压缩、去除背景、AI 超分辨率、滤镜。所有工具在浏览器本地运行，零上传，无需注册。" },
  "zh-Hant": { title: "免費線上圖片工具 — AI 畫境", description: "裁剪、壓縮、去背、AI 超解析度、濾鏡。所有工具在瀏覽器本地運行，零上傳，無需註冊。" },
  ja: { title: "無料オンライン画像ツール — AI ペインティング", description: "切り抜き、圧縮、背景除去、AI超解像、フィルター。すべてブラウザでローカル処理、アップロード不要、登録不要。" },
  ko: { title: "무료 온라인 이미지 도구 — AI 페인팅", description: "자르기, 압축, 배경 제거, AI 업스케일, 필터. 모든 도구가 브라우저에서 로컬로 실행되며 업로드가 필요 없습니다. 회원가입 불필요." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = IMAGE_TOOLS_META[locale] || IMAGE_TOOLS_META.en;
  return { title: meta.title, description: meta.description };
}

const featureIcons = [
  <svg key="privacy" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg2)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5.25-3.13 10.15-7 11-3.87-.85-7-5.75-7-11V6l7-4z" />
  </svg>,
  <svg key="free" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg2)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>,
  <svg key="fast" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg2)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />
  </svg>,
  <svg key="multi" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg2)" strokeWidth={1.5}>
    <rect x={3} y={3} width={7} height={7} rx={1} />
    <rect x={14} y={3} width={7} height={7} rx={1} />
    <rect x={3} y={14} width={7} height={7} rx={1} />
    <rect x={14} y={14} width={7} height={7} rx={1} />
  </svg>,
  <svg key="quality" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg2)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
  </svg>,
  <svg key="formats" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="url(#pg2)" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
];

const featureKeys = ["privacy", "free", "fast", "multi", "quality", "formats"];
const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"];

export default async function ImageToolsPage() {
  const t = await getTranslations();

  const toolMessages = {
    browser_hint: t("image_tools.browser_hint"),
    title: t("image_tools.title"),
    subtitle: t("image_tools.subtitle"),
    crop: t("image_tools.tabs.crop"),
    compress: t("image_tools.tabs.compress"),
    remove_bg: t("image_tools.tabs.remove_bg"),
    replace_bg: t("image_tools.tabs.replace_bg"),
    smooth: t("image_tools.tabs.smooth"),
    upscale: t("image_tools.tabs.upscale"),
    filters: t("image_tools.tabs.filters"),
    desc_crop: t("image_tools.descriptions.crop"),
    desc_compress: t("image_tools.descriptions.compress"),
    desc_remove_bg: t("image_tools.descriptions.remove_bg"),
    desc_replace_bg: t("image_tools.descriptions.replace_bg"),
    desc_smooth: t("image_tools.descriptions.smooth"),
    desc_upscale: t("image_tools.descriptions.upscale"),
    desc_filters: t("image_tools.descriptions.filters"),
    upload: t("image_tools.upload"),
    drop: t("image_tools.drop"),
    no_image: t("image_tools.no_image"),
    processing: t("image_tools.processing"),
    download: t("image_tools.download"),
    reset: t("image_tools.reset"),
    free_label: t("image_tools.free_label"),
    free_forever: t("image_tools.free_forever"),
    free_today: t("image_tools.free_today"),
    remaining: t("image_tools.remaining"),
    upgrade: t("image_tools.upgrade"),
    credits_remaining: t("image_tools.credits_remaining"),
    per_use: t("image_tools.per_use"),
    crop_aspect: t("image_tools.crop.aspect_ratio"),
    crop_freeform: t("image_tools.crop.freeform"),
    crop_apply: t("image_tools.crop.apply"),
    crop_confirm: t("image_tools.crop.confirm"),
    crop_width: t("image_tools.crop.width"),
    crop_height: t("image_tools.crop.height"),
    crop_px: t("image_tools.crop.px"),
    crop_hint: t("image_tools.crop.hint"),
    crop_shape: t("image_tools.crop.shape"),
    crop_shape_rect: t("image_tools.crop.shape_rect"),
    crop_shape_circle: t("image_tools.crop.shape_circle"),
    crop_shape_ellipse: t("image_tools.crop.shape_ellipse"),
    crop_shape_star: t("image_tools.crop.shape_star"),
    crop_corner_radius: t("image_tools.crop.corner_radius"),
    star_points: t("image_tools.crop.star_points"),
    star_outer: t("image_tools.crop.star_outer"),
    star_inner: t("image_tools.crop.star_inner"),
    star_corner: t("image_tools.crop.star_corner"),
    ellipse_width: t("image_tools.crop.ellipse_width"),
    ellipse_height: t("image_tools.crop.ellipse_height"),
    compress_quality: t("image_tools.compress.quality"),
    compress_max: t("image_tools.compress.max_size"),
    compress_orig: t("image_tools.compress.original_size"),
    compress_new: t("image_tools.compress.compressed_size"),
    compress_saved: t("image_tools.compress.saved"),
    compress_hint: t("image_tools.compress.hint"),
    compress_max_hint: t("image_tools.compress.max_hint"),
    compress_too_many: t("image_tools.compress.too_many"),
    compress_download_all: t("image_tools.compress.download_all"),
    compress_delete_all: t("image_tools.compress.delete_all"),
    remove_bg_action: t("image_tools.remove_bg.action"),
    replace_bg_color: t("image_tools.replace_bg.bg_color"),
    replace_bg_image: t("image_tools.replace_bg.bg_image"),
    replace_bg_custom: t("image_tools.replace_bg.custom_color"),
    replace_bg_apply: t("image_tools.replace_bg.apply"),
    smooth_intensity: t("image_tools.smooth.intensity"),
    smooth_light: t("image_tools.smooth.light"),
    smooth_medium: t("image_tools.smooth.medium"),
    smooth_strong: t("image_tools.smooth.strong"),
    smooth_apply: t("image_tools.smooth.apply"),
    upscale_2x: t("image_tools.upscale.2x"),
    upscale_4x: t("image_tools.upscale.4x"),
    upscale_apply: t("image_tools.upscale.apply"),
    filters_presets: t("image_tools.filters.presets"),
    filters_brightness: t("image_tools.filters.brightness"),
    filters_contrast: t("image_tools.filters.contrast"),
    filters_saturation: t("image_tools.filters.saturation"),
    filters_apply: t("image_tools.filters.apply"),
    filter_original: t("image_tools.filters.original"),
    filter_grayscale: t("image_tools.filters.grayscale"),
    filter_sepia: t("image_tools.filters.sepia"),
    filter_vintage: t("image_tools.filters.vintage"),
    filter_cool: t("image_tools.filters.cool"),
    filter_warm: t("image_tools.filters.warm"),
    filter_contrast_label: t("image_tools.filters.contrast_label"),
    filter_compare: t("image_tools.filters.compare"),
    save_reminder: t("dashboard.save_reminder"),
  };

  return (
    <div className="pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "AI Painting Image Tools",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            description: "Free online image tools — crop, compress, remove background, AI upscale, and filters. All processing happens locally in your browser.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />
      <ImageTools messages={toolMessages} />

      {/* Showcase — before/after comparison */}
      <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold sm:text-5xl text-white">
            {t("image_tools.showcase_title")}
          </h2>
          <p className="mt-3 text-text-secondary max-w-2xl mx-auto text-sm leading-relaxed">
            {t("image_tools.showcase_subtitle")}
          </p>
        </div>

        {/* Crop — full-width row: static split left, text right */}
        <div className="flex flex-col md:flex-row gap-6 mb-6 rounded-xl border border-border/30 bg-bg-card overflow-hidden">
          <div className="relative w-full md:w-1/2 aspect-video shrink-0">
            <div className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
              <img src="/images/1.png" alt="Crop before" className="absolute inset-0 w-full h-full object-cover filter grayscale-[0.6] brightness-75" loading="lazy" />
              <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">{t("image_tools.before")}</span>
            </div>
            <div className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
              <img src="/images/1.png" alt="Crop after" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-3 right-3 rounded-full bg-accent/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">{t("image_tools.after")}</span>
            </div>
            <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white/60 shadow-lg z-10" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-14 z-10">
              <p className="text-sm font-semibold text-white">{t("image_tools.tabs.crop")}</p>
              <p className="text-xs text-white/70 mt-0.5">{t("image_tools.descriptions.crop")}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8 md:pr-10">
            <p className="text-xs text-accent font-medium mb-1 tracking-wide uppercase">{t("image_tools.tabs.crop")}</p>
            <h3 className="text-xl font-bold sm:text-2xl text-white mb-3">
              {t("image_tools.showcase_crop_title")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              {t("image_tools.showcase_crop_desc")}
            </p>
            <ul className="space-y-2">
              {["feature1", "feature2", "feature3", "feature4"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`image_tools.showcase_crop_${f}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Replace Background — full-width split-screen (text left, image right) */}
        <div className="flex flex-col md:flex-row gap-6 rounded-xl border border-border/30 bg-bg-card overflow-hidden">
          <div className="flex flex-col justify-center p-6 md:p-8 md:pl-10 md:w-1/2">
            <p className="text-xs text-accent font-medium mb-1 tracking-wide uppercase">{t("image_tools.tabs.replace_bg")}</p>
            <h3 className="text-xl font-bold sm:text-2xl text-white mb-3">
              {t("image_tools.showcase_replace_bg_title")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              {t("image_tools.showcase_replace_bg_desc")}
            </p>
            <ul className="space-y-2">
              {["feature1", "feature2", "feature3", "feature4"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`image_tools.showcase_replace_bg_${f}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/2 shrink-0">
            <BeforeAfterSlider
              img="/images/4.png"
              alt={t("image_tools.tabs.replace_bg")}
              beforeLabel={t("image_tools.before")}
              afterLabel={t("image_tools.after")}
            >
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-14 z-10">
                <p className="text-sm font-semibold text-white">{t("image_tools.tabs.replace_bg")}</p>
                <p className="text-xs text-white/70 mt-0.5">{t("image_tools.descriptions.replace_bg")}</p>
              </div>
            </BeforeAfterSlider>
          </div>
        </div>

        {/* Smooth — full-width split-screen (image left, text right) */}
        <div className="flex flex-col md:flex-row gap-6 mt-8 rounded-xl border border-border/30 bg-bg-card overflow-hidden">
          <div className="w-full md:w-1/2 shrink-0">
            <BeforeAfterSlider
              imgBefore="/images/smoothb.png"
              imgAfter="/images/smootha.jpg"
              alt={t("image_tools.tabs.smooth")}
              beforeLabel={t("image_tools.before")}
              afterLabel={t("image_tools.after")}
            >
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-14 z-10">
                <p className="text-sm font-semibold text-white">{t("image_tools.tabs.smooth")}</p>
                <p className="text-xs text-white/70 mt-0.5">{t("image_tools.descriptions.smooth")}</p>
              </div>
            </BeforeAfterSlider>
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8 md:pr-10">
            <p className="text-xs text-accent font-medium mb-1 tracking-wide uppercase">{t("image_tools.tabs.smooth")}</p>
            <h3 className="text-xl font-bold sm:text-2xl text-white mb-3">
              {t("image_tools.showcase_smooth_title")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              {t("image_tools.showcase_smooth_desc")}
            </p>
            <ul className="space-y-2">
              {["feature1", "feature2", "feature3", "feature4"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`image_tools.showcase_smooth_${f}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold sm:text-5xl text-white">
            {t("image_tools.features_title")}
          </h2>
          <p className="mt-3 text-text-secondary max-w-2xl mx-auto text-sm leading-relaxed">
            {t("image_tools.features_subtitle")}
          </p>
        </div>

        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="pg2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((key, i) => (
            <div key={key} className="rounded-xl border border-border/50 bg-bg-card p-6 hover:border-accent/20 transition-all group text-center">
              <div className="mb-3 flex justify-center">{featureIcons[i]}</div>
              <h3 className="font-semibold text-base text-text-primary mb-2">
                {t(`image_tools.features.${key}.title`)}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t(`image_tools.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold sm:text-5xl text-white">
            {t("image_tools.faq_title")}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {faqKeys.map((key) => (
            <div key={key} className="py-4">
              <h3 className="text-base font-semibold text-text-primary mb-2">
                <span className="text-accent mr-2">
                  {String(faqKeys.indexOf(key) + 1).padStart(2, "0")}.
                </span>
                {t(`image_tools.faq.${key}`)}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed pl-7">
                {t(`image_tools.faq.a${key.slice(1)}`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
