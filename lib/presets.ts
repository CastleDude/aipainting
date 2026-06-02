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
      "Restore and enhance this photograph. {color_desc} {resolution_desc} {style_desc}. Fix all scratches, tears, fading, stains. Improve sharpness and clarity. Strictly preserve original content, faces, and scene. Do NOT alter people appearance. {custom} Output high quality photograph.",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 3,
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
        defaultValue: "1:1",
        options: [
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
      "Transform this photo into a cartoon avatar. {style_desc} {size_desc}. Background: {bg_desc}. Gender style: {gender_desc}. Age style: make them look like a {age}. {custom} Preserve the person's identity and key facial features. High quality.",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 2,
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
      'Create a beautiful greeting card in {style_desc} style for {holiday}. From: {from}. To: {to}. Message: "{message}". {ratio_desc} decorations, elegant typography, warm celebratory atmosphere. {custom} High quality.',
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
      "Transform this person's photo to show what they would look like at age {age}. {framing_desc} Preserve their core facial features and identity while realistically aging or de-aging them. Background: {bg_desc}. Natural, realistic transformation, high quality portrait photography. {custom}",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 2,
    params: [
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
      { id: "source_age", labelKey: "presets.age_journey.params.source_age", type: "select", defaultValue: "auto", options: [
        { value: "auto", labelKey: "presets.age_journey.params.source_auto" },
        { value: "0", labelKey: "presets.age_journey.params.source_0" },
        { value: "6", labelKey: "presets.age_journey.params.source_6" },
        { value: "16", labelKey: "presets.age_journey.params.source_16" },
        { value: "25", labelKey: "presets.age_journey.params.source_adult" },
        { value: "40", labelKey: "presets.age_journey.params.source_40" },
        { value: "60", labelKey: "presets.age_journey.params.source_60" },
        { value: "80", labelKey: "presets.age_journey.params.source_80" },
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
      "Create a realistic photo of two people together. Person from the first uploaded photo and {other_person} standing together. Pose: {pose}. Background: {bg_desc}. Natural lighting, realistic blending, both people looking at the camera, photorealistic quality. IMPORTANT: Only use this for consensual, appropriate purposes. Do NOT create misleading or deceptive images. {custom}",
    defaultModel: "seedream",
    defaultNumImages: 1,
    baseCost: 3,
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
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
