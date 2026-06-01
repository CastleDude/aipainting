// ── Image Generation Presets ────────────────────────────────
// Quick shortcuts that pre-configure prompts, models, and settings
// so users can generate specific image types without knowing how to craft prompts.

export interface PresetCustomField {
  id: string; // matches placeholder in promptTemplate, e.g. "recipient"
  labelKey: string; // i18n key
  placeholderKey: string;
  type: "text" | "select";
  options?: { value: string; labelKey: string }[];
  required: boolean;
}

export interface Preset {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: "photo" | "sparkles" | "card";
  /** Whether the preset requires a reference image upload before generation */
  requiresImage: boolean;
  /** When true, the prompt textarea becomes read-only (preset fills it automatically) */
  disablesPrompt: boolean;
  /** Template with {fieldId} placeholders for custom fields */
  promptTemplate: string;
  /** Model to force when this preset is active */
  defaultModel: string;
  defaultAspectRatio?: string;
  defaultStyle?: string;
  defaultNumImages?: number;
  /** Credit multiplier — e.g. 3 means 3 credits deducted per generated image */
  creditMultiplier: number;
  /** Extra form fields rendered below the prompt (empty for simple presets) */
  customFields: PresetCustomField[];
}

export const PRESETS: Preset[] = [
  {
    id: "photo_restoration",
    nameKey: "generate.presets.photo_restoration.name",
    descriptionKey: "generate.presets.photo_restoration.desc",
    icon: "photo",
    requiresImage: true,
    disablesPrompt: true,
    promptTemplate:
      "Restore and enhance this old or damaged photograph. Fix scratches, tears, fading, stains, and color degradation. Improve sharpness and clarity while strictly preserving the original content, faces, and scene. Do not alter people's appearance. Output a high quality, clean, restored photograph.",
    defaultModel: "nano-banana", // Gemini supports img2img via OpenRouter
    defaultAspectRatio: "1:1",
    defaultNumImages: 1,
    creditMultiplier: 3,
    customFields: [],
  },
  {
    id: "cartoon_avatar",
    nameKey: "generate.presets.cartoon_avatar.name",
    descriptionKey: "generate.presets.cartoon_avatar.desc",
    icon: "sparkles",
    requiresImage: true,
    disablesPrompt: false, // user can optionally describe a style
    promptTemplate:
      "Transform this photo into a cartoon/anime style avatar. Preserve the person's identity and key features while applying a vibrant cartoon art style. Clean linework, cel-shaded, colorful, Japanese animation aesthetic.",
    defaultModel: "nano-banana",
    defaultAspectRatio: "1:1",
    defaultStyle: "anime",
    defaultNumImages: 1,
    creditMultiplier: 2,
    customFields: [],
  },
  {
    id: "greeting_card",
    nameKey: "generate.presets.greeting_card.name",
    descriptionKey: "generate.presets.greeting_card.desc",
    icon: "card",
    requiresImage: false,
    disablesPrompt: true,
    promptTemplate:
      'Create a beautiful, festive greeting card design for {holiday}. The card is addressed to {recipient}. The greeting message reads: "{message}". The design should include {holiday}-themed decorations, warm colors, elegant typography, and a celebratory atmosphere. High quality greeting card illustration.',
    defaultModel: "schnell", // fast Runware, no img2img needed
    defaultAspectRatio: "3:4",
    defaultNumImages: 4,
    creditMultiplier: 1,
    customFields: [
      {
        id: "recipient",
        labelKey: "generate.presets.greeting_card.fields.recipient",
        placeholderKey: "generate.presets.greeting_card.fields.recipient_placeholder",
        type: "text",
        required: true,
      },
      {
        id: "message",
        labelKey: "generate.presets.greeting_card.fields.message",
        placeholderKey: "generate.presets.greeting_card.fields.message_placeholder",
        type: "text",
        required: true,
      },
      {
        id: "holiday",
        labelKey: "generate.presets.greeting_card.fields.holiday",
        placeholderKey: "generate.presets.greeting_card.fields.holiday_placeholder",
        type: "select",
        required: true,
        options: [
          { value: "Christmas", labelKey: "christmas" },
          { value: "New Year", labelKey: "new_year" },
          { value: "Birthday", labelKey: "birthday" },
          { value: "Valentine's Day", labelKey: "valentine" },
          { value: "Mother's Day", labelKey: "mothers_day" },
          { value: "Father's Day", labelKey: "fathers_day" },
          { value: "Easter", labelKey: "easter" },
          { value: "Halloween", labelKey: "halloween" },
          { value: "Thanksgiving", labelKey: "thanksgiving" },
          { value: "Wedding", labelKey: "wedding" },
          { value: "Graduation", labelKey: "graduation" },
          { value: "General Celebration", labelKey: "general" },
        ],
      },
    ],
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** Check whether a model supports image-to-image (reference image input).
 *  Runware models currently do not accept reference images. */
export function modelSupportsImg2Img(model: string): boolean {
  return !["schnell", "sdxl", "flux-dev"].includes(model);
}
