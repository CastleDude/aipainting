import { getTranslations } from "next-intl/server";
import { ImageGenerator } from "@/components/ImageGenerator";
import { BackgroundDots } from "@/components/BackgroundDots";
import { HomeParticleWrapper } from "@/components/HomeClient";
import PresetSection from "@/components/PresetSection";

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
  };

  return (
    <HomeParticleWrapper>
      {/* Background light effect */}
      <div className="bg-dots" aria-hidden="true"><span /><span /><span /><span /><span /></div>
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
          moderation_title: t("generate.moderation_title"),
          moderation_hint: t("generate.moderation_hint"),
          moderation_ban: t("generate.moderation_ban"),
          enhance_btn: t("generate.enhance_btn"),
          enhancing_btn: t("generate.enhancing_btn"),
          guest_credits: t("generate.guest_credits"),
          guest_banner: t("generate.guest_banner"),
          credit_cost: t("generate.credit_cost"),
          credit_insufficient: t("generate.credit_insufficient"),
          style_labels: {
            photorealistic: t("generate.style_photorealistic"),
            anime: t("generate.style_anime"),
            "digital-art": t("generate.style_digital-art"),
            "oil-painting": t("generate.style_oil-painting"),
            cinematic: t("generate.style_cinematic"),
            ghibli: t("generate.style_ghibli"),
            "3d-render": t("generate.style_3d-render"),
            "line-art": t("generate.style_line-art"),
          },
        }}
      >
        <PresetSection
          messages={{
            title: t("presets.title"),
            subtitle: t("presets.subtitle"),
            start_btn: t("presets.start_btn"),
            generate_btn: t("presets.generate_btn"),
            upload_hint: t("presets.upload_hint"),
            credit_multiplier: t("presets.credit_multiplier"),
            random_btn: t("presets.random_btn"),
            random_cost: t("presets.random_cost"),
            custom_prompt_priority: t("presets.custom_prompt_priority"),
            free: t("presets.free"),
            no_upload_needed: t("presets.no_upload_needed"),
            upload_qr: t("presets.upload_qr"),
            recommend_greeting: t("presets.recommend_greeting"),
            ai_analyzing: t("presets.ai_analyzing"),
            ai_recommend_btn: t("presets.ai_recommend_btn"),
            age_journey_hint: t("presets.age_journey_hint"),
            age_selected: t("presets.age_selected"),
            age_switch_hint: t("presets.age_switch_hint"),
            show_more: t("presets.show_more"),
            show_less: t("presets.show_less"),
            use_this_style: t("presets.use_this_style"),
            reset_params: t("presets.reset_params"),
            cost: t("presets.cost"),
            credits: t("presets.credits"),
            age_labels: {
              "0_3": t("presets.age_labels.0_3"),
              "4_12": t("presets.age_labels.4_12"),
              "13_19": t("presets.age_labels.13_19"),
              "20_35": t("presets.age_labels.20_35"),
              "36_50": t("presets.age_labels.36_50"),
              "51_65": t("presets.age_labels.51_65"),
              "66_80": t("presets.age_labels.66_80"),
              "81_plus": t("presets.age_labels.81_plus"),
            },
            ad_copies: t("presets.ad_copies").split("|||"),
            presets: {
              photo_restoration: {
                name: t("presets.photo_restoration.name"),
                desc: t("presets.photo_restoration.desc"),
                params: {
                  color: t("presets.photo_restoration.params.color"),
                  color_color: t("presets.photo_restoration.params.color_color"),
                  color_bw: t("presets.photo_restoration.params.color_bw"),
                  color_original: t("presets.photo_restoration.params.color_original"),
                  resolution: t("presets.photo_restoration.params.resolution"),
                  resolution_original: t("presets.photo_restoration.params.resolution_original"),
                  resolution_2x: t("presets.photo_restoration.params.resolution_2x"),
                  resolution_4x: t("presets.photo_restoration.params.resolution_4x"),
                  style: t("presets.photo_restoration.params.style"),
                  style_fresh: t("presets.photo_restoration.params.style_fresh"),
                  style_vintage: t("presets.photo_restoration.params.style_vintage"),
                  ratio: t("presets.photo_restoration.params.ratio"),
                  ratio_original: t("presets.ratio_original"),
                  ratio_1x1: t("presets.ratio_1x1"),
                  ratio_4x3: t("presets.ratio_4x3"),
                  ratio_16x9: t("presets.ratio_16x9"),
                  ratio_9x16: t("presets.ratio_9x16"),
                  ratio_3x4: t("presets.ratio_3x4"),
                  ratio_2x3: t("presets.ratio_2x3"),
                  ratio_3x2: t("presets.ratio_3x2"),
                  ratio_21x9: t("presets.ratio_21x9"),
                  custom: t("presets.photo_restoration.params.custom"),
                  custom_placeholder: t("presets.photo_restoration.params.custom_placeholder"),
                },
              },
              cartoon_avatar: {
                name: t("presets.cartoon_avatar.name"),
                desc: t("presets.cartoon_avatar.desc"),
                params: {
                  style: t("presets.cartoon_avatar.params.style"),
                  style_3d: t("presets.cartoon_avatar.params.style_3d"),
                  style_chibi: t("presets.cartoon_avatar.params.style_chibi"),
                  style_ghibli: t("presets.cartoon_avatar.params.style_ghibli"),
                  style_anime: t("presets.cartoon_avatar.params.style_anime"),
                  style_comic: t("presets.cartoon_avatar.params.style_comic"),
                  style_manhwa: t("presets.cartoon_avatar.params.style_manhwa"),
                  style_cyberpunk: t("presets.cartoon_avatar.params.style_cyberpunk"),
                  style_steampunk: t("presets.cartoon_avatar.params.style_steampunk"),
                  style_pixel: t("presets.cartoon_avatar.params.style_pixel"),
                  size: t("presets.cartoon_avatar.params.size"),
                  size_head: t("presets.cartoon_avatar.params.size_head"),
                  size_bust: t("presets.cartoon_avatar.params.size_bust"),
                  size_full: t("presets.cartoon_avatar.params.size_full"),
                  background: t("presets.cartoon_avatar.params.background"),
                  bg_keep: t("presets.cartoon_avatar.params.bg_keep"),
                  bg_transparent: t("presets.cartoon_avatar.params.bg_transparent"),
                  bg_custom: t("presets.cartoon_avatar.params.bg_custom"),
                  bg_custom_label: t("presets.cartoon_avatar.params.bg_custom_label"),
                  bg_custom_placeholder: t("presets.cartoon_avatar.params.bg_custom_placeholder"),
                  gender: t("presets.cartoon_avatar.params.gender"),
                  gender_keep: t("presets.cartoon_avatar.params.gender_keep"),
                  gender_male: t("presets.cartoon_avatar.params.gender_male"),
                  gender_female: t("presets.cartoon_avatar.params.gender_female"),
                  age: t("presets.cartoon_avatar.params.age"),
                  age_baby: t("presets.cartoon_avatar.params.age_baby"),
                  age_child: t("presets.cartoon_avatar.params.age_child"),
                  age_teen: t("presets.cartoon_avatar.params.age_teen"),
                  age_adult: t("presets.cartoon_avatar.params.age_adult"),
                  ratio: t("presets.cartoon_avatar.params.ratio"),
                  ratio_1x1: t("presets.ratio_1x1"),
                  ratio_4x3: t("presets.ratio_4x3"),
                  ratio_16x9: t("presets.ratio_16x9"),
                  ratio_9x16: t("presets.ratio_9x16"),
                  ratio_3x4: t("presets.ratio_3x4"),
                  ratio_2x3: t("presets.ratio_2x3"),
                  ratio_3x2: t("presets.ratio_3x2"),
                  ratio_21x9: t("presets.ratio_21x9"),
                  custom: t("presets.cartoon_avatar.params.custom"),
                  custom_placeholder: t("presets.cartoon_avatar.params.custom_placeholder"),
                },
              },
              product_ad: {
                name: t("presets.product_ad.name"),
                desc: t("presets.product_ad.desc"),
                params: {
                  title: t("presets.product_ad.params.title"),
                  title_placeholder: t("presets.product_ad.params.title_placeholder"),
                  copy: t("presets.product_ad.params.copy"),
                  copy_placeholder: t("presets.product_ad.params.copy_placeholder"),
                  points: t("presets.product_ad.params.points"),
                  points_placeholder: t("presets.product_ad.params.points_placeholder"),
                  ad_style: t("presets.product_ad.params.ad_style"),
                  style_tech: t("presets.product_ad.params.style_tech"),
                  style_warm: t("presets.product_ad.params.style_warm"),
                  style_luxury: t("presets.product_ad.params.style_luxury"),
                  style_minimal: t("presets.product_ad.params.style_minimal"),
                  style_natural: t("presets.product_ad.params.style_natural"),
                  style_vibrant: t("presets.product_ad.params.style_vibrant"),
                  style_retro: t("presets.product_ad.params.style_retro"),
                  style_industrial: t("presets.product_ad.params.style_industrial"),
                  font_style: t("presets.product_ad.params.font_style"),
                  font_auto: t("presets.product_ad.params.font_auto"),
                  font_modern: t("presets.product_ad.params.font_modern"),
                  font_luxury: t("presets.product_ad.params.font_luxury"),
                  font_bold: t("presets.product_ad.params.font_bold"),
                  font_handwriting: t("presets.product_ad.params.font_handwriting"),
                  font_tech: t("presets.product_ad.params.font_tech"),
                  font_cute: t("presets.product_ad.params.font_cute"),
                  ratio: t("presets.product_ad.params.ratio"),
                  ratio_custom: t("presets.product_ad.params.ratio_custom"),
                  custom_size: t("presets.product_ad.params.custom_size"),
                  custom_size_placeholder: t("presets.product_ad.params.custom_size_placeholder"),
                  event_time: t("presets.product_ad.params.event_time"),
                  event_time_placeholder: t("presets.product_ad.params.event_time_placeholder"),
                  company: t("presets.product_ad.params.company"),
                  company_placeholder: t("presets.product_ad.params.company_placeholder"),
                  contact: t("presets.product_ad.params.contact"),
                  contact_placeholder: t("presets.product_ad.params.contact_placeholder"),
                  phone: t("presets.product_ad.params.phone"),
                  phone_placeholder: t("presets.product_ad.params.phone_placeholder"),
                  has_qrcode: t("presets.product_ad.params.has_qrcode"),
                  qrcode_yes: t("presets.product_ad.params.qrcode_yes"),
                  qrcode_no: t("presets.product_ad.params.qrcode_no"),
                  recommend_copy: t("presets.product_ad.params.recommend_copy"),
                  custom: t("presets.product_ad.params.custom"),
                  custom_placeholder: t("presets.product_ad.params.custom_placeholder"),
                },
              },
              age_journey: {
                name: t("presets.age_journey.name"),
                desc: t("presets.age_journey.desc"),
                params: {
                  age: t("presets.age_journey.params.age"),
                  age_baby: t("presets.age_journey.params.age_baby"),
                  age_child: t("presets.age_journey.params.age_child"),
                  age_teen: t("presets.age_journey.params.age_teen"),
                  age_adult: t("presets.age_journey.params.age_adult"),
                  age_40: t("presets.age_journey.params.age_40"),
                  age_60: t("presets.age_journey.params.age_60"),
                  age_80: t("presets.age_journey.params.age_80"),
                  age_100: t("presets.age_journey.params.age_100"),
                  background: t("presets.age_journey.params.background"),
                  bg_auto: t("presets.age_journey.params.bg_auto"),
                  bg_studio: t("presets.age_journey.params.bg_studio"),
                  bg_nature: t("presets.age_journey.params.bg_nature"),
                  bg_urban: t("presets.age_journey.params.bg_urban"),
                  bg_fantasy: t("presets.age_journey.params.bg_fantasy"),
                  bg_historical: t("presets.age_journey.params.bg_historical"),
                  bg_scifi: t("presets.age_journey.params.bg_scifi"),
                  bg_beach: t("presets.age_journey.params.bg_beach"),
                  source_age: t("presets.age_journey.params.source_age"),
                  source_age_placeholder: t("presets.age_journey.params.source_age_placeholder"),
                  framing: t("presets.age_journey.params.framing"),
                  framing_head: t("presets.age_journey.params.framing_head"),
                  framing_bust: t("presets.age_journey.params.framing_bust"),
                  framing_full: t("presets.age_journey.params.framing_full"),
                  ratio: t("presets.age_journey.params.ratio"),
                  ratio_1x1: t("presets.ratio_1x1"),
                  ratio_3x4: t("presets.ratio_3x4"),
                  ratio_4x3: t("presets.ratio_4x3"),
                  ratio_16x9: t("presets.ratio_16x9"),
                  custom: t("presets.age_journey.params.custom"),
                  custom_placeholder: t("presets.age_journey.params.custom_placeholder"),
                },
              },
              photo_together: {
                name: t("presets.photo_together.name"),
                desc: t("presets.photo_together.desc"),
                params: {
                  other_person: t("presets.photo_together.params.other_person"),
                  other_person_placeholder: t("presets.photo_together.params.other_person_placeholder"),
                  pose: t("presets.photo_together.params.pose"),
                  pose_standing: t("presets.photo_together.params.pose_standing"),
                  pose_hugging: t("presets.photo_together.params.pose_hugging"),
                  pose_holding_hands: t("presets.photo_together.params.pose_holding_hands"),
                  pose_back_to_back: t("presets.photo_together.params.pose_back_to_back"),
                  pose_walking: t("presets.photo_together.params.pose_walking"),
                  pose_sitting: t("presets.photo_together.params.pose_sitting"),
                  pose_jumping: t("presets.photo_together.params.pose_jumping"),
                  pose_shoulder_arm: t("presets.photo_together.params.pose_shoulder_arm"),
                  background: t("presets.photo_together.params.background"),
                  bg_auto: t("presets.photo_together.params.bg_auto"),
                  bg_park: t("presets.photo_together.params.bg_park"),
                  bg_beach: t("presets.photo_together.params.bg_beach"),
                  bg_city: t("presets.photo_together.params.bg_city"),
                  bg_cafe: t("presets.photo_together.params.bg_cafe"),
                  bg_mountain: t("presets.photo_together.params.bg_mountain"),
                  bg_wedding_hall: t("presets.photo_together.params.bg_wedding_hall"),
                  bg_custom: t("presets.photo_together.params.bg_custom"),
                  bg_custom_label: t("presets.photo_together.params.bg_custom_label"),
                  bg_custom_placeholder: t("presets.photo_together.params.bg_custom_placeholder"),
                  ratio: t("presets.photo_together.params.ratio"),
                  ratio_1x1: t("presets.ratio_1x1"),
                  ratio_3x4: t("presets.ratio_3x4"),
                  ratio_4x3: t("presets.ratio_4x3"),
                  ratio_16x9: t("presets.ratio_16x9"),
                  custom: t("presets.photo_together.params.custom"),
                  custom_placeholder: t("presets.photo_together.params.custom_placeholder"),
                },
              },
              wallpaper: { name: t("presets.wallpaper.name"), desc: t("presets.wallpaper.desc"), params: { style: t("presets.wallpaper.params.style"), style_nature: t("presets.wallpaper.params.style_nature"), style_abstract: t("presets.wallpaper.params.style_abstract"), style_minimal: t("presets.wallpaper.params.style_minimal"), style_space: t("presets.wallpaper.params.style_space"), style_geometric: t("presets.wallpaper.params.style_geometric"), style_gradient: t("presets.wallpaper.params.style_gradient"), color: t("presets.wallpaper.params.color"), color_auto: t("presets.wallpaper.params.color_auto"), color_dark: t("presets.wallpaper.params.color_dark"), color_light: t("presets.wallpaper.params.color_light"), color_vibrant: t("presets.wallpaper.params.color_vibrant"), color_pastel: t("presets.wallpaper.params.color_pastel"), mood: t("presets.wallpaper.params.mood"), mood_calm: t("presets.wallpaper.params.mood_calm"), mood_energetic: t("presets.wallpaper.params.mood_energetic"), mood_dreamy: t("presets.wallpaper.params.mood_dreamy"), ratio: t("presets.wallpaper.params.ratio"), ratio_tall: t("presets.wallpaper.params.ratio_tall"), custom: t("presets.wallpaper.params.custom"), custom_placeholder: t("presets.wallpaper.params.custom_placeholder") } },
              logo_design: { name: t("presets.logo_design.name"), desc: t("presets.logo_design.desc"), params: { brand: t("presets.logo_design.params.brand"), brand_placeholder: t("presets.logo_design.params.brand_placeholder"), industry: t("presets.logo_design.params.industry"), industry_placeholder: t("presets.logo_design.params.industry_placeholder"), style: t("presets.logo_design.params.style"), style_minimal: t("presets.logo_design.params.style_minimal"), style_vintage: t("presets.logo_design.params.style_vintage"), style_tech: t("presets.logo_design.params.style_tech"), style_handdrawn: t("presets.logo_design.params.style_handdrawn"), style_luxury: t("presets.logo_design.params.style_luxury"), style_geometric: t("presets.logo_design.params.style_geometric"), color: t("presets.logo_design.params.color"), color_auto: t("presets.wallpaper.params.color_auto"), color_dark: t("presets.wallpaper.params.color_dark"), color_gold: t("presets.logo_design.params.color_gold"), color_blue: t("presets.logo_design.params.color_blue"), ratio: t("presets.logo_design.params.ratio"), custom: t("presets.logo_design.params.custom"), custom_placeholder: t("presets.logo_design.params.custom_placeholder") } },
              tattoo_design: { name: t("presets.tattoo_design.name"), desc: t("presets.tattoo_design.desc"), params: { theme: t("presets.tattoo_design.params.theme"), theme_placeholder: t("presets.tattoo_design.params.theme_placeholder"), style: t("presets.tattoo_design.params.style"), style_traditional: t("presets.tattoo_design.params.style_traditional"), style_tribal: t("presets.tattoo_design.params.style_tribal"), style_watercolor: t("presets.tattoo_design.params.style_watercolor"), style_minimalist: t("presets.tattoo_design.params.style_minimalist"), style_japanese: t("presets.tattoo_design.params.style_japanese"), style_geometric: t("presets.tattoo_design.params.style_geometric"), placement: t("presets.tattoo_design.params.placement"), placement_arm: t("presets.tattoo_design.params.placement_arm"), placement_chest: t("presets.tattoo_design.params.placement_chest"), placement_back: t("presets.tattoo_design.params.placement_back"), placement_wrist: t("presets.tattoo_design.params.placement_wrist"), placement_leg: t("presets.tattoo_design.params.placement_leg"), color: t("presets.tattoo_design.params.color"), color_bw: t("presets.tattoo_design.params.color_bw"), color_color: t("presets.tattoo_design.params.color_color"), ratio: t("presets.tattoo_design.params.ratio"), custom: t("presets.tattoo_design.params.custom"), custom_placeholder: t("presets.tattoo_design.params.custom_placeholder") } },
              interior_design: { name: t("presets.interior_design.name"), desc: t("presets.interior_design.desc"), params: { room_type: t("presets.interior_design.params.room_type"), room_living: t("presets.interior_design.params.room_living"), room_bedroom: t("presets.interior_design.params.room_bedroom"), room_kitchen: t("presets.interior_design.params.room_kitchen"), room_bathroom: t("presets.interior_design.params.room_bathroom"), room_office: t("presets.interior_design.params.room_office"), style: t("presets.interior_design.params.style"), style_modern: t("presets.interior_design.params.style_modern"), style_minimalist: t("presets.interior_design.params.style_minimalist"), style_industrial: t("presets.interior_design.params.style_industrial"), style_scandinavian: t("presets.interior_design.params.style_scandinavian"), style_japandi: t("presets.interior_design.params.style_japandi"), style_luxury: t("presets.interior_design.params.style_luxury"), color: t("presets.interior_design.params.color"), color_auto: t("presets.wallpaper.params.color_auto"), color_warm: t("presets.interior_design.params.color_warm"), color_cool: t("presets.interior_design.params.color_cool"), mood: t("presets.interior_design.params.mood"), mood_cozy: t("presets.interior_design.params.mood_cozy"), mood_luxurious: t("presets.interior_design.params.mood_luxurious"), mood_airy: t("presets.interior_design.params.mood_airy"), ratio: t("presets.interior_design.params.ratio"), custom: t("presets.interior_design.params.custom"), custom_placeholder: t("presets.interior_design.params.custom_placeholder") } },
              food_design: { name: t("presets.food_design.name"), desc: t("presets.food_design.desc"), params: { dish: t("presets.food_design.params.dish"), dish_placeholder: t("presets.food_design.params.dish_placeholder"), style: t("presets.food_design.params.style"), style_overhead: t("presets.food_design.params.style_overhead"), style_closeup: t("presets.food_design.params.style_closeup"), style_rustic: t("presets.food_design.params.style_rustic"), style_finedining: t("presets.food_design.params.style_finedining"), style_streetfood: t("presets.food_design.params.style_streetfood"), setting: t("presets.food_design.params.setting"), setting_wooden: t("presets.food_design.params.setting_wooden"), setting_marble: t("presets.food_design.params.setting_marble"), setting_outdoor: t("presets.food_design.params.setting_outdoor"), setting_restaurant: t("presets.food_design.params.setting_restaurant"), ratio: t("presets.food_design.params.ratio"), custom: t("presets.food_design.params.custom"), custom_placeholder: t("presets.food_design.params.custom_placeholder") } },
              package_design: { name: t("presets.package_design.name"), desc: t("presets.package_design.desc"), params: { product: t("presets.package_design.params.product"), product_placeholder: t("presets.package_design.params.product_placeholder"), package_type: t("presets.package_design.params.package_type"), type_box: t("presets.package_design.params.type_box"), type_bottle: t("presets.package_design.params.type_bottle"), type_bag: t("presets.package_design.params.type_bag"), type_tube: t("presets.package_design.params.type_tube"), type_jar: t("presets.package_design.params.type_jar"), style: t("presets.package_design.params.style"), style_modern: t("presets.package_design.params.style_modern"), style_luxury: t("presets.package_design.params.style_luxury"), style_eco: t("presets.package_design.params.style_eco"), style_vintage: t("presets.package_design.params.style_vintage"), style_minimal: t("presets.package_design.params.style_minimal"), color: t("presets.package_design.params.color"), color_auto: t("presets.wallpaper.params.color_auto"), color_dark: t("presets.wallpaper.params.color_dark"), color_light: t("presets.wallpaper.params.color_light"), ratio: t("presets.package_design.params.ratio"), custom: t("presets.package_design.params.custom"), custom_placeholder: t("presets.package_design.params.custom_placeholder") } },
              greeting_card: {
                name: t("presets.greeting_card.name"),
                desc: t("presets.greeting_card.desc"),
                params: {
                  holiday: t("presets.greeting_card.params.holiday"),
                  holiday_birthday: t("presets.greeting_card.params.holiday_birthday"),
                  holiday_christmas: t("presets.greeting_card.params.holiday_christmas"),
                  holiday_new_year: t("presets.greeting_card.params.holiday_new_year"),
                  holiday_valentine: t("presets.greeting_card.params.holiday_valentine"),
                  holiday_mothers: t("presets.greeting_card.params.holiday_mothers"),
                  holiday_fathers: t("presets.greeting_card.params.holiday_fathers"),
                  holiday_halloween: t("presets.greeting_card.params.holiday_halloween"),
                  holiday_thanksgiving: t("presets.greeting_card.params.holiday_thanksgiving"),
                  holiday_wedding: t("presets.greeting_card.params.holiday_wedding"),
                  holiday_graduation: t("presets.greeting_card.params.holiday_graduation"),
                  holiday_promotion: t("presets.greeting_card.params.holiday_promotion"),
                  holiday_project: t("presets.greeting_card.params.holiday_project"),
                  holiday_general: t("presets.greeting_card.params.holiday_general"),
                  from: t("presets.greeting_card.params.from"),
                  from_placeholder: t("presets.greeting_card.params.from_placeholder"),
                  to: t("presets.greeting_card.params.to"),
                  to_placeholder: t("presets.greeting_card.params.to_placeholder"),
                  message: t("presets.greeting_card.params.message"),
                  message_placeholder: t("presets.greeting_card.params.message_placeholder"),
                  style: t("presets.greeting_card.params.style"),
                  style_random: t("presets.greeting_card.params.style_random"),
                  style_watercolor: t("presets.greeting_card.params.style_watercolor"),
                  style_flat: t("presets.greeting_card.params.style_flat"),
                  style_3D: t("presets.greeting_card.params.style_3D"),
                  style_chinese: t("presets.greeting_card.params.style_chinese"),
                  style_minimal: t("presets.greeting_card.params.style_minimal"),
                  style_retro: t("presets.greeting_card.params.style_retro"),
                  ratio: t("presets.greeting_card.params.ratio"),
                  ratio_horizontal: t("presets.greeting_card.params.ratio_horizontal"),
                  ratio_vertical: t("presets.greeting_card.params.ratio_vertical"),
                  custom: t("presets.greeting_card.params.custom"),
                  custom_placeholder: t("presets.greeting_card.params.custom_placeholder"),
                },
              },
            },
          }}
        />
      </ImageGenerator>

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
