// ── Image Generation Presets ────────────────────────────────

export interface ExampleImage {
  thumb: string;
  large: string;
  rotate: "left" | "right";
}

export interface PresetOption {
  value: string;
  labelKey: string;
  extraCost?: number;
  icon?: string;
}

export interface PresetParam {
  id: string;
  labelKey: string;
  type: "select" | "text" | "textarea" | "custom_prompt";
  defaultValue: string;
  options?: PresetOption[];
  placeholderKey?: string;
}

export interface CardTemplate {
  thumb: string;
  large: string;
  attrs: Record<string, string>; // param values to fill
}

export interface Preset {
  id: string;
  nameKey: string;
  descriptionKey: string;
  iconImage: string;
  exampleImages: ExampleImage[];
  templates?: CardTemplate[];
  requiresImage: boolean;
  /** Max number of images user can upload (1 for most presets, 2 for photo_together) */
  maxImages?: number;
  /** Whether a reference/style image can be uploaded in addition to the main image */
  hasRefImage?: boolean;
  promptTemplate: string;
  defaultModel: string;
  defaultAspectRatio?: string;
  defaultNumImages: number;
  baseCost: number;          // base credit cost (before extra options)
  params: PresetParam[];     // customization params shown in the modal
}

export const PRESETS: Preset[] = [
  // ── 1. Old Photo Restoration ──
  {
    id: "photo_restoration",
    nameKey: "presets.photo_restoration.name",
    descriptionKey: "presets.photo_restoration.desc",
    iconImage: "/images/G1.jpg",
    exampleImages: [
      { thumb: "/images/G1-1.jpg", large: "/images/G1-1-1.jpg", rotate: "left" },
      { thumb: "/images/G1-2.jpg", large: "/images/G1-2-1.jpg", rotate: "right" },
      { thumb: "/images/G1-3.jpg", large: "/images/G1-3-1.jpg", rotate: "left" },
    ],
    requiresImage: true,
    promptTemplate:
      "Restore and enhance this photograph. {color_desc} {resolution_desc} {style_desc}. Fix all scratches, tears, fading, stains. Improve sharpness and clarity. Strictly preserve original content, faces, and scene. Do NOT alter people appearance. {custom} Output: 8K ultra high quality, professional photo restoration, masterpiece, highly detailed, sharp focus, natural skin texture, stunning.",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 1,  // seedream 8x = 8 credits total
    params: [
      {
        id: "color",
        labelKey: "presets.photo_restoration.params.color",
        type: "select",
        defaultValue: "color",
        options: [
          { value: "color", labelKey: "presets.photo_restoration.params.color_color" },
          { value: "bw", labelKey: "presets.photo_restoration.params.color_bw" },
          { value: "original", labelKey: "presets.photo_restoration.params.color_original" },
        ],
      },
      {
        id: "resolution",
        labelKey: "presets.photo_restoration.params.resolution",
        type: "select",
        defaultValue: "original",
        options: [
          { value: "original", labelKey: "presets.photo_restoration.params.resolution_original" },
          { value: "2x", labelKey: "presets.photo_restoration.params.resolution_2x", extraCost: 1 },
          { value: "4x", labelKey: "presets.photo_restoration.params.resolution_4x", extraCost: 2 },
        ],
      },
      {
        id: "style",
        labelKey: "presets.photo_restoration.params.style",
        type: "select",
        defaultValue: "fresh",
        options: [
          { value: "fresh", labelKey: "presets.photo_restoration.params.style_fresh" },
          { value: "vintage", labelKey: "presets.photo_restoration.params.style_vintage" },
        ],
      },
      {
        id: "ratio",
        labelKey: "presets.photo_restoration.params.ratio",
        type: "select",
        defaultValue: "original",
        options: [
          { value: "original", labelKey: "ratio_original" },
          { value: "1:1", labelKey: "ratio_1x1" },
          { value: "4:3", labelKey: "ratio_4x3" },
          { value: "16:9", labelKey: "ratio_16x9" },
          { value: "9:16", labelKey: "ratio_9x16" },
          { value: "3:4", labelKey: "ratio_3x4" },
          { value: "2:3", labelKey: "ratio_2x3" },
          { value: "3:2", labelKey: "ratio_3x2" },
          { value: "21:9", labelKey: "ratio_21x9" },
        ],
      },
      {
        id: "custom",
        labelKey: "presets.photo_restoration.params.custom",
        type: "custom_prompt",
        defaultValue: "",
        placeholderKey: "presets.photo_restoration.params.custom_placeholder",
      },
    ],
  },

  // ── 2. Cartoon Avatar ──
  {
    id: "cartoon_avatar",
    nameKey: "presets.cartoon_avatar.name",
    descriptionKey: "presets.cartoon_avatar.desc",
    iconImage: "/images/G2.jpg",
    exampleImages: [
      { thumb: "/images/G2-1.jpg", large: "/images/G2-1-1.jpg", rotate: "left" },
      { thumb: "/images/G2-2.jpg", large: "/images/G2-2-1.jpg", rotate: "right" },
      { thumb: "/images/G2-3.jpg", large: "/images/G2-3-1.jpg", rotate: "left" },
    ],
    requiresImage: true,
    promptTemplate:
      "Transform this photo into a cartoon avatar. {style_desc} {size_desc}. Background: {bg_desc}. Gender style: {gender_desc}. Age style: make them look like a {age}. {custom} Preserve the person's identity and key facial features. Masterpiece, highest quality, incredibly detailed art, vibrant colors, professional illustration, stunning visual impact.",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 1,  // seedream 8x = 8 credits total
    params: [
      {
        id: "style",
        labelKey: "presets.cartoon_avatar.params.style",
        type: "select",
        defaultValue: "anime",
        options: [
          { value: "3d", labelKey: "presets.cartoon_avatar.params.style_3d", icon: "/images/K1.jpg" },
          { value: "chibi", labelKey: "presets.cartoon_avatar.params.style_chibi", icon: "/images/K2.jpg" },
          { value: "ghibli", labelKey: "presets.cartoon_avatar.params.style_ghibli", icon: "/images/K3.jpg" },
          { value: "anime", labelKey: "presets.cartoon_avatar.params.style_anime", icon: "/images/K4.jpg" },
          { value: "comic", labelKey: "presets.cartoon_avatar.params.style_comic", icon: "/images/K5.jpg" },
          { value: "manhwa", labelKey: "presets.cartoon_avatar.params.style_manhwa", icon: "/images/K6.jpg" },
          { value: "cyberpunk", labelKey: "presets.cartoon_avatar.params.style_cyberpunk", icon: "/images/K7.jpg" },
          { value: "steampunk", labelKey: "presets.cartoon_avatar.params.style_steampunk", icon: "/images/K8.jpg" },
          { value: "pixel", labelKey: "presets.cartoon_avatar.params.style_pixel", icon: "/images/K9.jpg" },
        ],
      },
      {
        id: "size",
        labelKey: "presets.cartoon_avatar.params.size",
        type: "select",
        defaultValue: "head",
        options: [
          { value: "head", labelKey: "presets.cartoon_avatar.params.size_head" },
          { value: "bust", labelKey: "presets.cartoon_avatar.params.size_bust" },
          { value: "full", labelKey: "presets.cartoon_avatar.params.size_full" },
        ],
      },
      {
        id: "background",
        labelKey: "presets.cartoon_avatar.params.background",
        type: "select",
        defaultValue: "keep",
        options: [
          { value: "keep", labelKey: "presets.cartoon_avatar.params.bg_keep" },
          { value: "transparent", labelKey: "presets.cartoon_avatar.params.bg_transparent" },
          { value: "custom", labelKey: "presets.cartoon_avatar.params.bg_custom" },
        ],
      },
      {
        id: "bg_custom",
        labelKey: "presets.cartoon_avatar.params.bg_custom_label",
        type: "text",
        defaultValue: "",
        placeholderKey: "presets.cartoon_avatar.params.bg_custom_placeholder",
      },
      {
        id: "gender",
        labelKey: "presets.cartoon_avatar.params.gender",
        type: "select",
        defaultValue: "keep",
        options: [
          { value: "keep", labelKey: "presets.cartoon_avatar.params.gender_keep" },
          { value: "male", labelKey: "presets.cartoon_avatar.params.gender_male" },
          { value: "female", labelKey: "presets.cartoon_avatar.params.gender_female" },
        ],
      },
      {
        id: "age",
        labelKey: "presets.cartoon_avatar.params.age",
        type: "select",
        defaultValue: "child",
        options: [
          { value: "baby", labelKey: "presets.cartoon_avatar.params.age_baby" },
          { value: "child", labelKey: "presets.cartoon_avatar.params.age_child" },
          { value: "teen", labelKey: "presets.cartoon_avatar.params.age_teen" },
          { value: "adult", labelKey: "presets.cartoon_avatar.params.age_adult" },
        ],
      },
      {
        id: "ratio",
        labelKey: "presets.cartoon_avatar.params.ratio",
        type: "select",
        defaultValue: "1:1",
        options: [
          { value: "1:1", labelKey: "ratio_1x1" },
          { value: "4:3", labelKey: "presets.ratio_4x3" },
          { value: "16:9", labelKey: "presets.ratio_16x9" },
          { value: "9:16", labelKey: "presets.ratio_9x16" },
          { value: "3:4", labelKey: "presets.ratio_3x4" },
          { value: "2:3", labelKey: "presets.ratio_2x3" },
          { value: "3:2", labelKey: "presets.ratio_3x2" },
          { value: "21:9", labelKey: "presets.ratio_21x9" },
        ],
      },
      {
        id: "custom",
        labelKey: "presets.cartoon_avatar.params.custom",
        type: "custom_prompt",
        defaultValue: "",
        placeholderKey: "presets.cartoon_avatar.params.custom_placeholder",
      },
    ],
  },

  // ── 3. Greeting Card ──
  {
    id: "greeting_card",
    nameKey: "presets.greeting_card.name",
    descriptionKey: "presets.greeting_card.desc",
    iconImage: "/images/G3.jpg",
    exampleImages: [
      { thumb: "/images/G3-1.jpg", large: "/images/G3-1-1.jpg", rotate: "left" },
      { thumb: "/images/G3-2.jpg", large: "/images/G3-2-1.jpg", rotate: "right" },
      { thumb: "/images/G3-3.jpg", large: "/images/G3-3-1.jpg", rotate: "left" },
    ],
    templates: [
      { thumb: "/images/C1.jpg", large: "/images/C1.jpg", attrs: { style: "watercolor", holiday: "birthday", ratio: "3:4", message: "Happy Birthday! May your day be filled with joy and laughter!" } },
      { thumb: "/images/C2.jpg", large: "/images/C2.jpg", attrs: { style: "flat", holiday: "birthday", ratio: "3:4", message: "Wishing you a fantastic birthday! Celebrate and make wonderful memories!" } },
      { thumb: "/images/C3.jpg", large: "/images/C3.jpg", attrs: { style: "watercolor", holiday: "christmas", ratio: "3:4", message: "Merry Christmas! Wishing you warmth and happiness this holiday season." } },
      { thumb: "/images/C4.jpg", large: "/images/C4.jpg", attrs: { style: "retro", holiday: "christmas", ratio: "4:3", message: "Ho Ho Ho! May your Christmas sparkle with moments of love and laughter." } },
      { thumb: "/images/C5.jpg", large: "/images/C5.jpg", attrs: { style: "chinese", holiday: "new_year", ratio: "3:4", message: "新年快乐！万事如意，阖家幸福！" } },
      { thumb: "/images/C6.jpg", large: "/images/C6.jpg", attrs: { style: "minimal", holiday: "new_year", ratio: "4:3", message: "Happy New Year! May this year bring new happiness and new goals." } },
      { thumb: "/images/C7.jpg", large: "/images/C7.jpg", attrs: { style: "3D", holiday: "valentine", ratio: "3:4", message: "Happy Valentine's Day! You are my sunshine and my everything." } },
      { thumb: "/images/C8.jpg", large: "/images/C8.jpg", attrs: { style: "watercolor", holiday: "valentine", ratio: "4:3", message: "Love is in the air! Wishing you a day full of romance and sweet moments." } },
      { thumb: "/images/C9.jpg", large: "/images/C9.jpg", attrs: { style: "minimal", holiday: "wedding", ratio: "3:4", message: "Congratulations! May your love story be forever beautiful." } },
      { thumb: "/images/C10.jpg", large: "/images/C10.jpg", attrs: { style: "chinese", holiday: "wedding", ratio: "4:3", message: "百年好合，永结同心！愿你们的婚姻幸福美满。" } },
      { thumb: "/images/C11.jpg", large: "/images/C11.jpg", attrs: { style: "retro", holiday: "graduation", ratio: "3:4", message: "Congratulations Graduate! The future is yours to create." } },
      { thumb: "/images/C12.jpg", large: "/images/C12.jpg", attrs: { style: "flat", holiday: "graduation", ratio: "4:3", message: "Hats off to you, Graduate! Dream big and reach for the stars!" } },
      // mothers_day
      { thumb: "/images/C13.jpg", large: "/images/C13.jpg", attrs: { style: "watercolor", holiday: "mothers_day", ratio: "3:4", message: "Happy Mother's Day! Thank you for your endless love and sacrifice." } },
      { thumb: "/images/C14.jpg", large: "/images/C14.jpg", attrs: { style: "flat", holiday: "mothers_day", ratio: "4:3", message: "To the best mom in the world — you deserve all the love today and always!" } },
      // fathers_day
      { thumb: "/images/C15.jpg", large: "/images/C15.jpg", attrs: { style: "3D", holiday: "fathers_day", ratio: "3:4", message: "Happy Father's Day! You are my hero and my guiding light." } },
      { thumb: "/images/C16.jpg", large: "/images/C16.jpg", attrs: { style: "retro", holiday: "fathers_day", ratio: "4:3", message: "Dad, thank you for always being there. Wishing you a wonderful Father's Day!" } },
      // halloween
      { thumb: "/images/C17.jpg", large: "/images/C17.jpg", attrs: { style: "retro", holiday: "halloween", ratio: "3:4", message: "Happy Halloween! May your night be filled with magic and spooky fun!" } },
      { thumb: "/images/C18.jpg", large: "/images/C18.jpg", attrs: { style: "3D", holiday: "halloween", ratio: "4:3", message: "Trick or Treat! Wishing you a hauntingly good time this Halloween!" } },
      // thanksgiving
      { thumb: "/images/C19.jpg", large: "/images/C19.jpg", attrs: { style: "minimal", holiday: "thanksgiving", ratio: "3:4", message: "Happy Thanksgiving! Grateful for wonderful people like you in my life." } },
      { thumb: "/images/C20.jpg", large: "/images/C20.jpg", attrs: { style: "watercolor", holiday: "thanksgiving", ratio: "4:3", message: "Wishing you a harvest of blessings, good health, and happiness. Happy Thanksgiving!" } },
      // promotion
      { thumb: "/images/C21.jpg", large: "/images/C21.jpg", attrs: { style: "flat", holiday: "promotion", ratio: "3:4", message: "Congratulations on your promotion! You earned it with your hard work and dedication." } },
      { thumb: "/images/C22.jpg", large: "/images/C22.jpg", attrs: { style: "minimal", holiday: "promotion", ratio: "4:3", message: "Cheers to your success! May this be just the beginning of greater achievements ahead." } },
      // project_done (项目杀青)
      { thumb: "/images/C23.jpg", large: "/images/C23.jpg", attrs: { style: "3D", holiday: "project_done", ratio: "3:4", message: "Project complete! All the hard work has paid off — congratulations team!" } },
      { thumb: "/images/C24.jpg", large: "/images/C24.jpg", attrs: { style: "flat", holiday: "project_done", ratio: "4:3", message: "Mission accomplished! Time to celebrate this amazing milestone together!" } },
      // general
      { thumb: "/images/C25.jpg", large: "/images/C25.jpg", attrs: { style: "watercolor", holiday: "general", ratio: "3:4", message: "Sending you warm wishes and positive vibes. May your day be as wonderful as you are!" } },
      { thumb: "/images/C26.jpg", large: "/images/C26.jpg", attrs: { style: "minimal", holiday: "general", ratio: "4:3", message: "Thinking of you today and always. Wishing you happiness, peace, and joy!" } },
    ],
    requiresImage: false,
    promptTemplate:
      'Create a beautiful greeting card in {style_desc} style for {holiday}. From: "{from}". To: "{to}". Message: "{message}". {ratio_desc} decorations, elegant typography, warm celebratory atmosphere. {custom} High quality.',
    defaultModel: "schnell",
    defaultAspectRatio: "3:4",
    defaultNumImages: 4,
    baseCost: 1,
    params: [
      {
        id: "holiday",
        labelKey: "presets.greeting_card.params.holiday",
        type: "select",
        defaultValue: "birthday",
        options: [
          { value: "birthday", labelKey: "presets.greeting_card.params.holiday_birthday" },
          { value: "christmas", labelKey: "presets.greeting_card.params.holiday_christmas" },
          { value: "new_year", labelKey: "presets.greeting_card.params.holiday_new_year" },
          { value: "valentine", labelKey: "presets.greeting_card.params.holiday_valentine" },
          { value: "mothers_day", labelKey: "presets.greeting_card.params.holiday_mothers" },
          { value: "fathers_day", labelKey: "presets.greeting_card.params.holiday_fathers" },
          { value: "halloween", labelKey: "presets.greeting_card.params.holiday_halloween" },
          { value: "thanksgiving", labelKey: "presets.greeting_card.params.holiday_thanksgiving" },
          { value: "wedding", labelKey: "presets.greeting_card.params.holiday_wedding" },
          { value: "graduation", labelKey: "presets.greeting_card.params.holiday_graduation" },
          { value: "promotion", labelKey: "presets.greeting_card.params.holiday_promotion" },
          { value: "project_done", labelKey: "presets.greeting_card.params.holiday_project" },
          { value: "general", labelKey: "presets.greeting_card.params.holiday_general" },
        ],
      },
      {
        id: "from",
        labelKey: "presets.greeting_card.params.from",
        type: "text",
        defaultValue: "",
        placeholderKey: "presets.greeting_card.params.from_placeholder",
      },
      {
        id: "to",
        labelKey: "presets.greeting_card.params.to",
        type: "text",
        defaultValue: "",
        placeholderKey: "presets.greeting_card.params.to_placeholder",
      },
      {
        id: "message",
        labelKey: "presets.greeting_card.params.message",
        type: "textarea",
        defaultValue: "",
        placeholderKey: "presets.greeting_card.params.message_placeholder",
      },
      {
        id: "style",
        labelKey: "presets.greeting_card.params.style",
        type: "select",
        defaultValue: "watercolor",
        options: [
          { value: "watercolor", labelKey: "presets.greeting_card.params.style_watercolor" },
          { value: "flat", labelKey: "presets.greeting_card.params.style_flat" },
          { value: "3D", labelKey: "presets.greeting_card.params.style_3D" },
          { value: "chinese", labelKey: "presets.greeting_card.params.style_chinese" },
          { value: "minimal", labelKey: "presets.greeting_card.params.style_minimal" },
          { value: "retro", labelKey: "presets.greeting_card.params.style_retro" },
        ],
      },
      {
        id: "ratio",
        labelKey: "presets.greeting_card.params.ratio",
        type: "select",
        defaultValue: "3:4",
        options: [
          { value: "4:3", labelKey: "presets.greeting_card.params.ratio_horizontal" },
          { value: "3:4", labelKey: "presets.greeting_card.params.ratio_vertical" },
        ],
      },
      {
        id: "custom",
        labelKey: "presets.greeting_card.params.custom",
        type: "custom_prompt",
        defaultValue: "",
        placeholderKey: "presets.greeting_card.params.custom_placeholder",
      },
    ],
  },

  // ── 4. Product Ad ──
  {
    id: "product_ad",
    nameKey: "presets.product_ad.name",
    descriptionKey: "presets.product_ad.desc",
    iconImage: "/images/G4.jpg",
    exampleImages: [
      { thumb: "/images/G4-1.jpg", large: "/images/G4-1-1.jpg", rotate: "left" },
      { thumb: "/images/G4-2.jpg", large: "/images/G4-2-1.jpg", rotate: "right" },
      { thumb: "/images/G4-3.jpg", large: "/images/G4-3-1.jpg", rotate: "left" },
    ],
    requiresImage: true,
    hasRefImage: true,
    promptTemplate:
      "Create a professional product advertisement poster. Product: {title}. {ad_style} {font_style} {ref_style} Ad copy: \"{copy}\". Key selling points: {points}. {details} {size_desc}. Clean, commercial-grade product photography style, professional lighting, eye-catching composition. {custom} High quality marketing poster.",
    defaultModel: "schnell",
    defaultAspectRatio: "3:4",
    defaultNumImages: 1,
    baseCost: 2,
    params: [
      { id: "title", labelKey: "presets.product_ad.params.title", type: "text", defaultValue: "", placeholderKey: "presets.product_ad.params.title_placeholder" },
      { id: "copy", labelKey: "presets.product_ad.params.copy", type: "text", defaultValue: "", placeholderKey: "presets.product_ad.params.copy_placeholder" },
      { id: "points", labelKey: "presets.product_ad.params.points", type: "textarea", defaultValue: "", placeholderKey: "presets.product_ad.params.points_placeholder" },
      { id: "ad_style", labelKey: "presets.product_ad.params.ad_style", type: "select", defaultValue: "tech", options: [
        { value: "tech", labelKey: "presets.product_ad.params.style_tech" },
        { value: "warm", labelKey: "presets.product_ad.params.style_warm" },
        { value: "luxury", labelKey: "presets.product_ad.params.style_luxury" },
        { value: "minimal", labelKey: "presets.product_ad.params.style_minimal" },
        { value: "natural", labelKey: "presets.product_ad.params.style_natural" },
        { value: "vibrant", labelKey: "presets.product_ad.params.style_vibrant" },
        { value: "retro", labelKey: "presets.product_ad.params.style_retro" },
        { value: "industrial", labelKey: "presets.product_ad.params.style_industrial" },
      ]},
      { id: "font_style", labelKey: "presets.product_ad.params.font_style", type: "select", defaultValue: "auto", options: [
        { value: "auto", labelKey: "presets.product_ad.params.font_auto" },
        { value: "modern", labelKey: "presets.product_ad.params.font_modern" },
        { value: "luxury", labelKey: "presets.product_ad.params.font_luxury" },
        { value: "bold", labelKey: "presets.product_ad.params.font_bold" },
        { value: "handwriting", labelKey: "presets.product_ad.params.font_handwriting" },
        { value: "tech", labelKey: "presets.product_ad.params.font_tech" },
        { value: "cute", labelKey: "presets.product_ad.params.font_cute" },
      ]},
      { id: "ratio", labelKey: "presets.product_ad.params.ratio", type: "select", defaultValue: "3:4", options: [
        { value: "3:4", labelKey: "ratio_3x4" }, { value: "1:1", labelKey: "ratio_1x1" }, { value: "4:3", labelKey: "ratio_4x3" }, { value: "16:9", labelKey: "ratio_16x9" }, { value: "9:16", labelKey: "ratio_9x16" },
      ]},
      { id: "event_time", labelKey: "presets.product_ad.params.event_time", type: "text", defaultValue: "", placeholderKey: "presets.product_ad.params.event_time_placeholder" },
      { id: "company", labelKey: "presets.product_ad.params.company", type: "text", defaultValue: "", placeholderKey: "presets.product_ad.params.company_placeholder" },
      { id: "contact", labelKey: "presets.product_ad.params.contact", type: "text", defaultValue: "", placeholderKey: "presets.product_ad.params.contact_placeholder" },
      { id: "phone", labelKey: "presets.product_ad.params.phone", type: "text", defaultValue: "", placeholderKey: "presets.product_ad.params.phone_placeholder" },
      { id: "has_qrcode", labelKey: "presets.product_ad.params.has_qrcode", type: "select", defaultValue: "no", options: [
        { value: "no", labelKey: "presets.product_ad.params.qrcode_no" }, { value: "yes", labelKey: "presets.product_ad.params.qrcode_yes" },
      ]},
      { id: "custom", labelKey: "presets.product_ad.params.custom", type: "custom_prompt", defaultValue: "", placeholderKey: "presets.product_ad.params.custom_placeholder" },
    ],
  },

  // ── 5. Age Journey ──
  {
    id: "age_journey",
    nameKey: "presets.age_journey.name",
    descriptionKey: "presets.age_journey.desc",
    iconImage: "/images/G5.jpg",
    exampleImages: [
      { thumb: "/images/G5-1.jpg", large: "/images/G5-1-1.jpg", rotate: "left" },
      { thumb: "/images/G5-2.jpg", large: "/images/G5-2-1.jpg", rotate: "right" },
      { thumb: "/images/G5-3.jpg", large: "/images/G5-3-1.jpg", rotate: "left" },
    ],
    requiresImage: true,
    promptTemplate:
      "Transform this person's photo to show what they would look like at age {age}. {framing_desc} CRITICAL: This is the SAME PERSON at a different age. You MUST preserve: 1) their EXACT gender — NEVER swap male to female or vice versa, 2) their facial bone structure and identity, 3) their ethnic appearance. HAIR: give them age-appropriate hair — babies have fine soft hair, children cute styles, teens trendy, adults mature, seniors gray/thinning with natural hairlines. Background: {bg_desc}. Natural transformation, 8K ultra high quality, professional portrait photography, masterpiece, highly detailed, photorealistic skin, studio lighting, stunning. {custom}",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 1,  // seedream 8x = 8 credits total (single age)
    params: [
      { id: "source_age", labelKey: "presets.age_journey.params.source_age", type: "text", defaultValue: "", placeholderKey: "presets.age_journey.params.source_age_placeholder" },
      { id: "age", labelKey: "presets.age_journey.params.age", type: "select", defaultValue: "child", options: [
        { value: "0", labelKey: "presets.age_journey.params.age_baby" },
        { value: "6", labelKey: "presets.age_journey.params.age_child" },
        { value: "16", labelKey: "presets.age_journey.params.age_teen" },
        { value: "25", labelKey: "presets.age_journey.params.age_adult" },
        { value: "40", labelKey: "presets.age_journey.params.age_40" },
        { value: "60", labelKey: "presets.age_journey.params.age_60" },
        { value: "80", labelKey: "presets.age_journey.params.age_80" },
        { value: "100", labelKey: "presets.age_journey.params.age_100" },
      ]},
      { id: "background", labelKey: "presets.age_journey.params.background", type: "select", defaultValue: "auto", options: [
        { value: "auto", labelKey: "presets.age_journey.params.bg_auto" }, { value: "studio", labelKey: "presets.age_journey.params.bg_studio" }, { value: "nature", labelKey: "presets.age_journey.params.bg_nature" },
        { value: "urban", labelKey: "presets.age_journey.params.bg_urban" }, { value: "fantasy", labelKey: "presets.age_journey.params.bg_fantasy" }, { value: "historical", labelKey: "presets.age_journey.params.bg_historical" },
        { value: "scifi", labelKey: "presets.age_journey.params.bg_scifi" }, { value: "beach", labelKey: "presets.age_journey.params.bg_beach" },
      ]},
      { id: "framing", labelKey: "presets.age_journey.params.framing", type: "select", defaultValue: "head", options: [
        { value: "head", labelKey: "presets.age_journey.params.framing_head" },
        { value: "bust", labelKey: "presets.age_journey.params.framing_bust" },
        { value: "full", labelKey: "presets.age_journey.params.framing_full" },
      ]},
      { id: "ratio", labelKey: "presets.age_journey.params.ratio", type: "select", defaultValue: "1:1", options: [
        { value: "1:1", labelKey: "ratio_1x1" }, { value: "3:4", labelKey: "ratio_3x4" }, { value: "4:3", labelKey: "ratio_4x3" }, { value: "16:9", labelKey: "ratio_16x9" },
      ]},
      { id: "custom", labelKey: "presets.age_journey.params.custom", type: "custom_prompt", defaultValue: "", placeholderKey: "presets.age_journey.params.custom_placeholder" },
    ],
  },

  // ── 6. Photo Together ──
  {
    id: "photo_together",
    nameKey: "presets.photo_together.name",
    descriptionKey: "presets.photo_together.desc",
    iconImage: "/images/G6.jpg",
    exampleImages: [
      { thumb: "/images/G6-1.jpg", large: "/images/G6-1-1.jpg", rotate: "left" },
      { thumb: "/images/G6-2.jpg", large: "/images/G6-2-1.jpg", rotate: "right" },
      { thumb: "/images/G6-3.jpg", large: "/images/G6-3-1.jpg", rotate: "left" },
    ],
    requiresImage: true,
    maxImages: 2,
    promptTemplate:
      "PERSON A is the person in the uploaded reference photo — you MUST faithfully preserve their exact facial identity, features, ethnic appearance, gender, hairstyle, and build. PERSON B is {other_person}. Create a realistic photo of these TWO SPECIFIC people together. Pose: {pose}. Background: {bg_desc}. Natural lighting, realistic blending, both people looking at the camera. The result must clearly show the REFERENCE person's actual face — not a generic face. Photorealistic quality. IMPORTANT: Only use for consensual, appropriate purposes. Do NOT create misleading images. {custom}",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 1,  // seedream 8x = 8 credits total
    params: [
      { id: "other_person", labelKey: "presets.photo_together.params.other_person", type: "text", defaultValue: "", placeholderKey: "presets.photo_together.params.other_person_placeholder" },
      { id: "pose", labelKey: "presets.photo_together.params.pose", type: "select", defaultValue: "standing", options: [
        { value: "standing", labelKey: "presets.photo_together.params.pose_standing" }, { value: "hugging", labelKey: "presets.photo_together.params.pose_hugging" }, { value: "holding_hands", labelKey: "presets.photo_together.params.pose_holding_hands" },
        { value: "back_to_back", labelKey: "presets.photo_together.params.pose_back_to_back" }, { value: "walking", labelKey: "presets.photo_together.params.pose_walking" }, { value: "sitting", labelKey: "presets.photo_together.params.pose_sitting" },
        { value: "jumping", labelKey: "presets.photo_together.params.pose_jumping" }, { value: "shoulder_arm", labelKey: "presets.photo_together.params.pose_shoulder_arm" },
      ]},
      { id: "background", labelKey: "presets.photo_together.params.background", type: "select", defaultValue: "auto", options: [
        { value: "auto", labelKey: "presets.photo_together.params.bg_auto" }, { value: "park", labelKey: "presets.photo_together.params.bg_park" }, { value: "beach", labelKey: "presets.photo_together.params.bg_beach" },
        { value: "city", labelKey: "presets.photo_together.params.bg_city" }, { value: "cafe", labelKey: "presets.photo_together.params.bg_cafe" }, { value: "mountain", labelKey: "presets.photo_together.params.bg_mountain" },
        { value: "wedding_hall", labelKey: "presets.photo_together.params.bg_wedding_hall" }, { value: "custom", labelKey: "presets.photo_together.params.bg_custom" },
      ]},
      { id: "bg_custom", labelKey: "presets.photo_together.params.bg_custom_label", type: "text", defaultValue: "", placeholderKey: "presets.photo_together.params.bg_custom_placeholder" },
      { id: "ratio", labelKey: "presets.photo_together.params.ratio", type: "select", defaultValue: "3:4", options: [
        { value: "3:4", labelKey: "ratio_3x4" }, { value: "1:1", labelKey: "ratio_1x1" }, { value: "4:3", labelKey: "ratio_4x3" }, { value: "16:9", labelKey: "ratio_16x9" },
      ]},
      { id: "custom", labelKey: "presets.photo_together.params.custom", type: "custom_prompt", defaultValue: "", placeholderKey: "presets.photo_together.params.custom_placeholder" },
    ],
  },
  // ── 7-12. Runware text-to-image presets ──
  { id: "wallpaper", nameKey: "presets.wallpaper.name", descriptionKey: "presets.wallpaper.desc", iconImage: "/images/G7.jpg", exampleImages: [{thumb:"/images/G7-1.jpg",large:"/images/G7-1-1.jpg",rotate:"left"},{thumb:"/images/G7-2.jpg",large:"/images/G7-2-1.jpg",rotate:"right"},{thumb:"/images/G7-3.jpg",large:"/images/G7-3-1.jpg",rotate:"left"}], templates: [{thumb:"/images/S1.jpg",large:"/images/S1.jpg",attrs:{}},{thumb:"/images/S2.jpg",large:"/images/S2.jpg",attrs:{}},{thumb:"/images/S3.jpg",large:"/images/S3.jpg",attrs:{}},{thumb:"/images/S4.jpg",large:"/images/S4.jpg",attrs:{}},{thumb:"/images/S5.jpg",large:"/images/S5.jpg",attrs:{}},{thumb:"/images/S6.jpg",large:"/images/S6.jpg",attrs:{}},{thumb:"/images/S7.jpg",large:"/images/S7.jpg",attrs:{}},{thumb:"/images/S8.jpg",large:"/images/S8.jpg",attrs:{}}], requiresImage: false, promptTemplate: "Create a beautiful phone wallpaper in {style} style. {color_desc} {mood_desc}. Clean mobile composition. 8K UHD, award-winning digital art, masterpiece, highly detailed, vibrant, professional. {custom}", defaultModel: "schnell", defaultAspectRatio: "9:16", defaultNumImages: 1, baseCost: 1, params: [{id:"style",labelKey:"presets.wallpaper.params.style",type:"select",defaultValue:"nature",options:[{value:"nature",labelKey:"presets.wallpaper.params.style_nature"},{value:"abstract",labelKey:"presets.wallpaper.params.style_abstract"},{value:"minimal",labelKey:"presets.wallpaper.params.style_minimal"},{value:"space",labelKey:"presets.wallpaper.params.style_space"},{value:"geometric",labelKey:"presets.wallpaper.params.style_geometric"},{value:"gradient",labelKey:"presets.wallpaper.params.style_gradient"}]},{id:"color",labelKey:"presets.wallpaper.params.color",type:"select",defaultValue:"auto",options:[{value:"auto",labelKey:"color_auto"},{value:"dark",labelKey:"color_dark"},{value:"light",labelKey:"color_light"},{value:"vibrant",labelKey:"presets.wallpaper.params.color_vibrant"},{value:"pastel",labelKey:"presets.wallpaper.params.color_pastel"}]},{id:"mood",labelKey:"presets.wallpaper.params.mood",type:"select",defaultValue:"calm",options:[{value:"calm",labelKey:"presets.wallpaper.params.mood_calm"},{value:"energetic",labelKey:"presets.wallpaper.params.mood_energetic"},{value:"dreamy",labelKey:"presets.wallpaper.params.mood_dreamy"}]},{id:"ratio",labelKey:"presets.wallpaper.params.ratio",type:"select",defaultValue:"9:16",options:[{value:"9:16",labelKey:"ratio_9x16"},{value:"9:19.5",labelKey:"presets.wallpaper.params.ratio_tall"}]},{id:"custom",labelKey:"presets.wallpaper.params.custom",type:"custom_prompt",defaultValue:"",placeholderKey:"presets.wallpaper.params.custom_placeholder"}] },
  { id: "logo_design", nameKey: "presets.logo_design.name", descriptionKey: "presets.logo_design.desc", iconImage: "/images/G8.jpg", exampleImages: [{thumb:"/images/G8-1.jpg",large:"/images/G8-1-1.jpg",rotate:"left"},{thumb:"/images/G8-2.jpg",large:"/images/G8-2-1.jpg",rotate:"right"},{thumb:"/images/G8-3.jpg",large:"/images/G8-3-1.jpg",rotate:"left"}], templates: [{thumb:"/images/L1.jpg",large:"/images/L1.jpg",attrs:{}},{thumb:"/images/L2.jpg",large:"/images/L2.jpg",attrs:{}},{thumb:"/images/L3.jpg",large:"/images/L3.jpg",attrs:{}},{thumb:"/images/L4.jpg",large:"/images/L4.jpg",attrs:{}},{thumb:"/images/L5.jpg",large:"/images/L5.jpg",attrs:{}},{thumb:"/images/L6.jpg",large:"/images/L6.jpg",attrs:{}},{thumb:"/images/L7.jpg",large:"/images/L7.jpg",attrs:{}},{thumb:"/images/L8.jpg",large:"/images/L8.jpg",attrs:{}},{thumb:"/images/L9.jpg",large:"/images/L9.jpg",attrs:{}},{thumb:"/images/L10.jpg",large:"/images/L10.jpg",attrs:{}},{thumb:"/images/L11.jpg",large:"/images/L11.jpg",attrs:{}},{thumb:"/images/L12.jpg",large:"/images/L12.jpg",attrs:{}},{thumb:"/images/L13.jpg",large:"/images/L13.jpg",attrs:{}}], requiresImage: false, promptTemplate: "Create a professional logo for {brand} in {industry}. Style: {style}. {color_desc}. Clean vector logo. Masterpiece, iconic, memorable, high-end brand identity, professional graphic design, award-winning. {custom}", defaultModel: "schnell", defaultNumImages: 4, baseCost: 1, params: [{id:"brand",labelKey:"presets.logo_design.params.brand",type:"text",defaultValue:"",placeholderKey:"presets.logo_design.params.brand_placeholder"},{id:"industry",labelKey:"presets.logo_design.params.industry",type:"text",defaultValue:"",placeholderKey:"presets.logo_design.params.industry_placeholder"},{id:"style",labelKey:"presets.logo_design.params.style",type:"select",defaultValue:"minimal",options:[{value:"minimal",labelKey:"presets.logo_design.params.style_minimal"},{value:"vintage",labelKey:"presets.logo_design.params.style_vintage"},{value:"tech",labelKey:"presets.logo_design.params.style_tech"},{value:"handdrawn",labelKey:"presets.logo_design.params.style_handdrawn"},{value:"luxury",labelKey:"presets.logo_design.params.style_luxury"},{value:"geometric",labelKey:"presets.logo_design.params.style_geometric"}]},{id:"color",labelKey:"presets.logo_design.params.color",type:"select",defaultValue:"auto",options:[{value:"auto",labelKey:"color_auto"},{value:"dark",labelKey:"color_dark"},{value:"gold",labelKey:"presets.logo_design.params.color_gold"},{value:"blue",labelKey:"presets.logo_design.params.color_blue"}]},{id:"custom",labelKey:"presets.logo_design.params.custom",type:"custom_prompt",defaultValue:"",placeholderKey:"presets.logo_design.params.custom_placeholder"}] },
  { id: "tattoo_design", nameKey: "presets.tattoo_design.name", descriptionKey: "presets.tattoo_design.desc", iconImage: "/images/G9.jpg", exampleImages: [{thumb:"/images/G9-1.jpg",large:"/images/G9-1-1.jpg",rotate:"left"},{thumb:"/images/G9-2.jpg",large:"/images/G9-2-1.jpg",rotate:"right"},{thumb:"/images/G9-3.jpg",large:"/images/G9-3-1.jpg",rotate:"left"}], templates: [{thumb:"/images/W1.jpg",large:"/images/W1.jpg",attrs:{}},{thumb:"/images/W2.jpg",large:"/images/W2.jpg",attrs:{}},{thumb:"/images/W3.jpg",large:"/images/W3.jpg",attrs:{}},{thumb:"/images/W4.jpg",large:"/images/W4.jpg",attrs:{}},{thumb:"/images/W5.jpg",large:"/images/W5.jpg",attrs:{}},{thumb:"/images/W6.jpg",large:"/images/W6.jpg",attrs:{}},{thumb:"/images/W7.jpg",large:"/images/W7.jpg",attrs:{}},{thumb:"/images/W8.jpg",large:"/images/W8.jpg",attrs:{}},{thumb:"/images/W9.jpg",large:"/images/W9.jpg",attrs:{}},{thumb:"/images/W10.jpg",large:"/images/W10.jpg",attrs:{}},{thumb:"/images/W11.jpg",large:"/images/W11.jpg",attrs:{}},{thumb:"/images/W12.jpg",large:"/images/W12.jpg",attrs:{}},{thumb:"/images/W13.jpg",large:"/images/W13.jpg",attrs:{}},{thumb:"/images/W14.jpg",large:"/images/W14.jpg",attrs:{}},{thumb:"/images/W15.jpg",large:"/images/W15.jpg",attrs:{}},{thumb:"/images/W16.jpg",large:"/images/W16.jpg",attrs:{}},{thumb:"/images/W17.jpg",large:"/images/W17.jpg",attrs:{}},{thumb:"/images/W18.jpg",large:"/images/W18.jpg",attrs:{}},{thumb:"/images/W19.jpg",large:"/images/W19.jpg",attrs:{}},{thumb:"/images/W20.jpg",large:"/images/W20.jpg",attrs:{}},{thumb:"/images/W21.jpg",large:"/images/W21.jpg",attrs:{}},{thumb:"/images/W22.jpg",large:"/images/W22.jpg",attrs:{}}], requiresImage: false, promptTemplate: "Create a tattoo design. Theme: {theme}. Style: {style}. Placement: {placement}. {color_desc}. Masterpiece artwork, highest quality, intricate details, professional tattoo flash art, bold clean lines, stunning. {custom}", defaultModel: "schnell", defaultNumImages: 4, baseCost: 1, params: [{id:"theme",labelKey:"presets.tattoo_design.params.theme",type:"text",defaultValue:"",placeholderKey:"presets.tattoo_design.params.theme_placeholder"},{id:"style",labelKey:"presets.tattoo_design.params.style",type:"select",defaultValue:"traditional",options:[{value:"traditional",labelKey:"presets.tattoo_design.params.style_traditional"},{value:"tribal",labelKey:"presets.tattoo_design.params.style_tribal"},{value:"watercolor",labelKey:"presets.tattoo_design.params.style_watercolor"},{value:"minimalist",labelKey:"presets.tattoo_design.params.style_minimalist"},{value:"japanese",labelKey:"presets.tattoo_design.params.style_japanese"},{value:"geometric",labelKey:"presets.tattoo_design.params.style_geometric"}]},{id:"placement",labelKey:"presets.tattoo_design.params.placement",type:"select",defaultValue:"arm",options:[{value:"arm",labelKey:"presets.tattoo_design.params.placement_arm"},{value:"chest",labelKey:"presets.tattoo_design.params.placement_chest"},{value:"back",labelKey:"presets.tattoo_design.params.placement_back"},{value:"wrist",labelKey:"presets.tattoo_design.params.placement_wrist"},{value:"leg",labelKey:"presets.tattoo_design.params.placement_leg"}]},{id:"color",labelKey:"presets.tattoo_design.params.color",type:"select",defaultValue:"bw",options:[{value:"bw",labelKey:"presets.tattoo_design.params.color_bw"},{value:"color",labelKey:"presets.tattoo_design.params.color_color"}]},{id:"custom",labelKey:"presets.tattoo_design.params.custom",type:"custom_prompt",defaultValue:"",placeholderKey:"presets.tattoo_design.params.custom_placeholder"}] },
  { id: "interior_design", nameKey: "presets.interior_design.name", descriptionKey: "presets.interior_design.desc", iconImage: "/images/G10.jpg", exampleImages: [{thumb:"/images/G10-1.jpg",large:"/images/G10-1-1.jpg",rotate:"left"},{thumb:"/images/G10-2.jpg",large:"/images/G10-2-1.jpg",rotate:"right"},{thumb:"/images/G10-3.jpg",large:"/images/G10-3-1.jpg",rotate:"left"}], templates: [{thumb:"/images/R1.jpg",large:"/images/R1.jpg",attrs:{}},{thumb:"/images/R2.jpg",large:"/images/R2.jpg",attrs:{}},{thumb:"/images/R3.jpg",large:"/images/R3.jpg",attrs:{}},{thumb:"/images/R4.jpg",large:"/images/R4.jpg",attrs:{}},{thumb:"/images/R5.jpg",large:"/images/R5.jpg",attrs:{}},{thumb:"/images/R6.jpg",large:"/images/R6.jpg",attrs:{}},{thumb:"/images/R7.jpg",large:"/images/R7.jpg",attrs:{}},{thumb:"/images/R8.jpg",large:"/images/R8.jpg",attrs:{}},{thumb:"/images/R9.jpg",large:"/images/R9.jpg",attrs:{}}], requiresImage: false, promptTemplate: "Create a photorealistic interior design for a {room_type} in {style} style. {color_desc} {mood_desc}. 8K ultra high quality, professional interior photography, masterpiece, highly detailed, architectural digest quality, stunning lighting. {custom}", defaultModel: "schnell", defaultAspectRatio: "16:9", defaultNumImages: 1, baseCost: 1, params: [{id:"room_type",labelKey:"presets.interior_design.params.room_type",type:"select",defaultValue:"living",options:[{value:"living",labelKey:"presets.interior_design.params.room_living"},{value:"bedroom",labelKey:"presets.interior_design.params.room_bedroom"},{value:"kitchen",labelKey:"presets.interior_design.params.room_kitchen"},{value:"bathroom",labelKey:"presets.interior_design.params.room_bathroom"},{value:"office",labelKey:"presets.interior_design.params.room_office"}]},{id:"style",labelKey:"presets.interior_design.params.style",type:"select",defaultValue:"modern",options:[{value:"modern",labelKey:"presets.interior_design.params.style_modern"},{value:"minimalist",labelKey:"presets.interior_design.params.style_minimalist"},{value:"industrial",labelKey:"presets.interior_design.params.style_industrial"},{value:"scandinavian",labelKey:"presets.interior_design.params.style_scandinavian"},{value:"japandi",labelKey:"presets.interior_design.params.style_japandi"},{value:"luxury",labelKey:"presets.interior_design.params.style_luxury"}]},{id:"color",labelKey:"presets.interior_design.params.color",type:"select",defaultValue:"auto",options:[{value:"auto",labelKey:"color_auto"},{value:"warm",labelKey:"presets.interior_design.params.color_warm"},{value:"cool",labelKey:"presets.interior_design.params.color_cool"}]},{id:"mood",labelKey:"presets.interior_design.params.mood",type:"select",defaultValue:"cozy",options:[{value:"cozy",labelKey:"presets.interior_design.params.mood_cozy"},{value:"luxurious",labelKey:"presets.interior_design.params.mood_luxurious"},{value:"airy",labelKey:"presets.interior_design.params.mood_airy"}]},{id:"custom",labelKey:"presets.interior_design.params.custom",type:"custom_prompt",defaultValue:"",placeholderKey:"presets.interior_design.params.custom_placeholder"}] },
  { id: "food_design", nameKey: "presets.food_design.name", descriptionKey: "presets.food_design.desc", iconImage: "/images/G11.jpg", exampleImages: [{thumb:"/images/G11-1.jpg",large:"/images/G11-1-1.jpg",rotate:"left"},{thumb:"/images/G11-2.jpg",large:"/images/G11-2-1.jpg",rotate:"right"},{thumb:"/images/G11-3.jpg",large:"/images/G11-3-1.jpg",rotate:"left"}], templates: [{thumb:"/images/F1.jpg",large:"/images/F1.jpg",attrs:{}},{thumb:"/images/F2.jpg",large:"/images/F2.jpg",attrs:{}},{thumb:"/images/F3.jpg",large:"/images/F3.jpg",attrs:{}},{thumb:"/images/F4.jpg",large:"/images/F4.jpg",attrs:{}},{thumb:"/images/F5.jpg",large:"/images/F5.jpg",attrs:{}},{thumb:"/images/F6.jpg",large:"/images/F6.jpg",attrs:{}},{thumb:"/images/F7.jpg",large:"/images/F7.jpg",attrs:{}},{thumb:"/images/F8.jpg",large:"/images/F8.jpg",attrs:{}},{thumb:"/images/F9.jpg",large:"/images/F9.jpg",attrs:{}},{thumb:"/images/F10.jpg",large:"/images/F10.jpg",attrs:{}},{thumb:"/images/F11.jpg",large:"/images/F11.jpg",attrs:{}},{thumb:"/images/F12.jpg",large:"/images/F12.jpg",attrs:{}}], requiresImage: false, promptTemplate: "Create an appetizing food photo of {dish}. Style: {style}. Setting: {setting_desc}. Professional food photography. 8K ultra high quality, masterpiece, highly detailed, Michelin-star presentation, gorgeous plating, studio lighting, stunning. {custom}", defaultModel: "schnell", defaultAspectRatio: "4:3", defaultNumImages: 1, baseCost: 1, params: [{id:"dish",labelKey:"presets.food_design.params.dish",type:"text",defaultValue:"",placeholderKey:"presets.food_design.params.dish_placeholder"},{id:"style",labelKey:"presets.food_design.params.style",type:"select",defaultValue:"overhead",options:[{value:"overhead",labelKey:"presets.food_design.params.style_overhead"},{value:"closeup",labelKey:"presets.food_design.params.style_closeup"},{value:"rustic",labelKey:"presets.food_design.params.style_rustic"},{value:"fine_dining",labelKey:"presets.food_design.params.style_finedining"},{value:"street_food",labelKey:"presets.food_design.params.style_streetfood"}]},{id:"setting",labelKey:"presets.food_design.params.setting",type:"select",defaultValue:"wooden_table",options:[{value:"wooden_table",labelKey:"presets.food_design.params.setting_wooden"},{value:"marble",labelKey:"presets.food_design.params.setting_marble"},{value:"outdoor",labelKey:"presets.food_design.params.setting_outdoor"},{value:"restaurant",labelKey:"presets.food_design.params.setting_restaurant"}]},{id:"custom",labelKey:"presets.food_design.params.custom",type:"custom_prompt",defaultValue:"",placeholderKey:"presets.food_design.params.custom_placeholder"}] },
  { id: "package_design", nameKey: "presets.package_design.name", descriptionKey: "presets.package_design.desc", iconImage: "/images/G12.jpg", exampleImages: [{thumb:"/images/G12-1.jpg",large:"/images/G12-1-1.jpg",rotate:"left"},{thumb:"/images/G12-2.jpg",large:"/images/G12-2-1.jpg",rotate:"right"},{thumb:"/images/G12-3.jpg",large:"/images/G12-3-1.jpg",rotate:"left"}], templates: [{thumb:"/images/B1.jpg",large:"/images/B1.jpg",attrs:{}},{thumb:"/images/B2.jpg",large:"/images/B2.jpg",attrs:{}},{thumb:"/images/B3.jpg",large:"/images/B3.jpg",attrs:{}},{thumb:"/images/B4.jpg",large:"/images/B4.jpg",attrs:{}},{thumb:"/images/B5.jpg",large:"/images/B5.jpg",attrs:{}},{thumb:"/images/B6.jpg",large:"/images/B6.jpg",attrs:{}},{thumb:"/images/B7.jpg",large:"/images/B7.jpg",attrs:{}}], requiresImage: false, promptTemplate: "Create a product packaging design for {product}. Type: {package_type}. Style: {style}. {color_desc}. Masterpiece, high-end commercial product rendering, professional studio lighting, premium packaging, award-winning design, highly detailed. {custom}", defaultModel: "schnell", defaultNumImages: 1, baseCost: 1, params: [{id:"product",labelKey:"presets.package_design.params.product",type:"text",defaultValue:"",placeholderKey:"presets.package_design.params.product_placeholder"},{id:"package_type",labelKey:"presets.package_design.params.package_type",type:"select",defaultValue:"box",options:[{value:"box",labelKey:"presets.package_design.params.type_box"},{value:"bottle",labelKey:"presets.package_design.params.type_bottle"},{value:"bag",labelKey:"presets.package_design.params.type_bag"},{value:"tube",labelKey:"presets.package_design.params.type_tube"},{value:"jar",labelKey:"presets.package_design.params.type_jar"}]},{id:"style",labelKey:"presets.package_design.params.style",type:"select",defaultValue:"modern",options:[{value:"modern",labelKey:"presets.package_design.params.style_modern"},{value:"luxury",labelKey:"presets.package_design.params.style_luxury"},{value:"eco",labelKey:"presets.package_design.params.style_eco"},{value:"vintage",labelKey:"presets.package_design.params.style_vintage"},{value:"minimal",labelKey:"presets.package_design.params.style_minimal"}]},{id:"color",labelKey:"presets.package_design.params.color",type:"select",defaultValue:"auto",options:[{value:"auto",labelKey:"color_auto"},{value:"dark",labelKey:"color_dark"},{value:"light",labelKey:"color_light"}]},{id:"custom",labelKey:"presets.package_design.params.custom",type:"custom_prompt",defaultValue:"",placeholderKey:"presets.package_design.params.custom_placeholder"}] },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
