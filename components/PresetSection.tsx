"use client";

import { useState, useRef, useEffect } from "react";
import { PRESETS, getPreset } from "@/lib/presets";
import type { ExampleImage } from "@/lib/presets";
import { getRandomGreeting } from "@/lib/greetings";

// ── Product ad copy suggestions ──
const AD_COPIES = [
  "限时优惠，错过再等一年！立即下单享受惊喜折扣！",
  "品质之选，值得信赖。百万用户的一致选择！",
  "新品首发，引领潮流！为你的生活增添一份精彩。",
  "专业品质，平民价格。超高性价比，不容错过！",
  "好物不贵，精致生活从这里开始。立即抢购！",
  "热销爆款，好评如潮！你值得拥有的品质好物。",
  "限时特惠，全场满减！快来选购你的心仪好物！",
  "来自匠心之作，每一件都是艺术品。送给最懂生活的你。",
  "口碑好物，复购率超高！用过都说好的品质保证。",
  "独家定制，限量发售！为特别的你准备特别的礼物。",
];
let _adCopyIdx = 0;
function getRandomAdCopy(): string {
  const copy = AD_COPIES[_adCopyIdx % AD_COPIES.length];
  _adCopyIdx = (_adCopyIdx + 1) % AD_COPIES.length;
  return copy;
}

// ── AI product recognition via Gemini Vision ──
async function analyzeProductImage(imageBase64: string): Promise<{ title: string; copy: string; points: string } | null> {
  try {
    const res = await fetch("/api/analyze-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Event dispatched to ImageGenerator ──
export interface PresetApplyEvent {
  presetId: string;
  prompt: string;
  model: string;
  aspectRatio?: string;
  style?: string;
  numImages: number;
  multiplier: number;
  imageBase64: string | null;
  imageBase64_2?: string | null;
  requiresImage: boolean;
  autoGenerate: boolean;
}

export function dispatchPresetApply(data: PresetApplyEvent) {
  window.dispatchEvent(new CustomEvent("apply-preset", { detail: data }));
}

// ── Messages shape ──
interface PresetSectionMessages {
  title: string;
  subtitle: string;
  start_btn: string;
  generate_btn: string;
  upload_hint: string;
  credit_multiplier: string;
  random_btn: string;
  random_cost: string;
  custom_prompt_priority: string;
  free: string;
  presets: Record<string, { name: string; desc: string; params?: Record<string, string>; holidays?: Record<string, string> }>;
}

interface Props {
  messages: PresetSectionMessages;
}

function RoundIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="h-10 w-10 rounded-full object-cover shrink-0" />;
}

// ── Compute total credit cost ──
function calcCost(presetId: string, paramValues: Record<string, string>): number {
  const preset = getPreset(presetId);
  if (!preset) return 1;
  let cost = preset.baseCost;
  for (const p of preset.params) {
    const val = paramValues[p.id];
    if (val && p.options) {
      const opt = p.options.find((o) => o.value === val);
      if (opt?.extraCost) cost += opt.extraCost;
    }
  }
  return cost;
}

// ── Build final prompt ──
function buildPrompt(presetId: string, paramValues: Record<string, string>, selectedAges: string[], img2?: string | null): string {
  const preset = getPreset(presetId);
  if (!preset) return "";
  let prompt = preset.promptTemplate;

  // Photo restoration
  if (presetId === "photo_restoration") {
    const colorMap: Record<string, string> = { color: "Add natural colorization to the image", bw: "Keep the image in classic black and white tones", original: "Preserve the original tone and patina of the photograph" };
    const resMap: Record<string, string> = { original: "Maintain the original resolution", "2x": "Enhance to 2x resolution with super-resolution upscaling", "4x": "Enhance to 4x resolution with super-resolution upscaling" };
    const styleMap: Record<string, string> = { fresh: "Give the photo a fresh, renewed look with vibrant details", vintage: "Preserve a nostalgic, vintage atmosphere with subtle aging character" };
    prompt = prompt.replace("{color_desc}", colorMap[paramValues["color"]] || colorMap.color);
    prompt = prompt.replace("{resolution_desc}", resMap[paramValues["resolution"]] || resMap.original);
    prompt = prompt.replace("{style_desc}", styleMap[paramValues["style"]] || styleMap.fresh);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional style instructions (do not render this as text): ${ct}.` : "");
  }

  // Cartoon avatar
  if (presetId === "cartoon_avatar") {
    const styleMap: Record<string, string> = {
      anime: "In Japanese anime/manga art style, cel-shaded, vibrant colors, clean linework. MATCH the subject's exact gender.",
      "3d": "In 3D rendered Pixar-style, smooth, cute, modern CGI. MATCH the subject's exact gender.",
      chibi: "In super-deformed Q-version chibi style, big head small body, adorable, cute, round features. MATCH the subject's exact gender.",
      ghibli: "In Studio Ghibli hand-drawn animation style, soft watercolor backgrounds, whimsical magical realism. MATCH the subject's exact gender.",
      comic: "In Western comic book illustration style, bold outlines, vibrant colors, dynamic. MATCH the subject's exact gender.",
      manhwa: "In Korean manhwa/webtoon style, elegant, refined, soft lighting. MATCH the subject's exact gender.",
      cyberpunk: "In cyberpunk digital art style, neon colors, futuristic, high-tech aesthetic. CRITICAL: faithfully preserve the subject's gender, facial features, and identity from the reference photo.",
      steampunk: "In steampunk art style, brass and copper machinery, Victorian era, gears and steam engines. MATCH the subject's exact gender.",
      pixel: "In retro pixel art style, 8-bit/16-bit game aesthetic, blocky and charming. MATCH the subject's exact gender.",
    };
    const sizeMap: Record<string, string> = { head: "Close-up headshot portrait", bust: "Upper body bust portrait", full: "Full body character illustration" };
    const bgMap: Record<string, string> = { keep: "Keep the original photo background", transparent: "Transparent background, suitable for stickers and profile pictures", custom: paramValues["bg_custom"]?.trim() || "a clean, simple background" };
    const genderMap: Record<string, string> = { keep: "Preserve the original gender appearance", male: "Slightly masculine features", female: "Slightly feminine features" };
    const ageMap: Record<string, string> = { baby: "a cute baby/toddler", child: "a cute child", teen: "a teenager", adult: "an adult" };

    prompt = prompt.replace("{style_desc}", styleMap[paramValues["style"]] || styleMap.anime);
    prompt = prompt.replace("{size_desc}", sizeMap[paramValues["size"]] || sizeMap.head);
    prompt = prompt.replace("{bg_desc}", bgMap[paramValues["background"]] || bgMap.keep);
    prompt = prompt.replace("{gender_desc}", genderMap[paramValues["gender"]] || genderMap.keep);
    prompt = prompt.replace("{age}", ageMap[paramValues["age"]] || ageMap.child);
    // Remove bg_custom param from prompt since it's handled in bg_desc
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional style instructions (do not render this as text): ${ct}.` : "");
  }

  // Product ad
  if (presetId === "product_ad") {
    const ratioMap: Record<string, string> = { "3:4": "Portrait poster 3:4", "1:1": "Square poster 1:1", "4:3": "Landscape poster 4:3", "16:9": "Widescreen 16:9", "9:16": "Story format 9:16" };
    const moreFields = [paramValues["event_time"] ? `Event time: ${paramValues["event_time"]}` : "", paramValues["company"] ? `Company: ${paramValues["company"]}` : "", paramValues["contact"] ? `Contact: ${paramValues["contact"]}` : "", paramValues["phone"] ? `Phone: ${paramValues["phone"]}` : "", paramValues["has_qrcode"] === "yes" ? "Include a QR code placeholder" : ""].filter(Boolean).join(". ");
    const refStyle = img2 ? "The second uploaded image is a style reference — adopt its design language, color palette, composition, and visual tone for this poster." : "";
    const adStyleMap: Record<string, string> = {
      tech: "futuristic tech style with blue neon accents, sleek metallic surfaces, holographic elements",
      warm: "warm cozy lifestyle style with soft golden lighting, natural textures, inviting atmosphere",
      luxury: "premium luxury style with gold and black tones, elegant marble textures, sophisticated ambiance",
      minimal: "clean minimalist style with white space, simple geometric compositions, modern aesthetic",
      natural: "fresh natural style with greenery, earthy tones, organic textures, outdoor lighting",
      vibrant: "vibrant youthful style with bold bright colors, dynamic motion, energetic pop-art feel",
      retro: "retro vintage style with warm film tones, nostalgic textures, classic mid-century aesthetic",
      industrial: "industrial style with dark metal textures, concrete backgrounds, edgy raw aesthetic",
    };
    const adStyle = adStyleMap[paramValues["ad_style"]] || adStyleMap.tech;
    prompt = prompt.replace("{ref_style}", refStyle);
    prompt = prompt.replace("{ad_style}", `Visual style: ${adStyle}.`);
    const fontMap: Record<string, string> = {
      auto: "Choose the most suitable typography style matching the visual style",
      modern: "Modern minimalist typography with clean sans-serif fonts, elegant spacing",
      luxury: "Premium serif typography with gold accents, sophisticated letterforms",
      bold: "Bold impactful typography with heavy weight titles, strong visual hierarchy",
      handwriting: "Warm handwritten/calligraphy style typography, personal and approachable",
      tech: "Tech-inspired typography with monospace elements, glowing digital text effects",
      cute: "Round cute typography with soft curves, playful and youthful lettering",
    };
    prompt = prompt.replace("{font_style}", `Typography: ${fontMap[paramValues["font_style"]] || fontMap.auto}.`);
    prompt = prompt.replace("{title}", `THEME: ${paramValues["title"] || "Product"}`);
    prompt = prompt.replace("{copy}", `TAGLINE to render on poster: "${paramValues["copy"] || "Amazing product!"}"`);
    prompt = prompt.replace("{points}", `FEATURES to list on poster: ${paramValues["points"] || ""}`);
    prompt = prompt.replace("{details}", moreFields ? `DETAILS to render: ${moreFields}.` : "");
    prompt = prompt.replace("{size_desc}", ratioMap[paramValues["ratio"]] || ratioMap["3:4"]);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional style instructions (do not render this as text): ${ct}.` : "");
  }

  // Age journey
  if (presetId === "age_journey") {
    const ages = selectedAges.length > 0 ? selectedAges : [paramValues["age"] || "child"];
    const bgMap: Record<string, string> = {
      auto: "a naturally matching environment", studio: "a professional studio photography backdrop", nature: "a beautiful natural landscape with greenery and sunlight",
      urban: "a modern urban city street scene", fantasy: "a magical fantasy realm with ethereal elements", historical: "a historical period setting with classical architecture",
      scifi: "a futuristic sci-fi world with advanced technology and neon lights", beach: "a sunny beach with ocean waves and golden sand",
    };
    const framingMap: Record<string, string> = { head: "Close-up headshot portrait.", bust: "Upper body bust portrait.", full: "Full body portrait." };
    const framing = framingMap[paramValues["framing"]] || framingMap.head;
    prompt = prompt.replace("{framing_desc}", framing);
    const sourceAge = paramValues["source_age"]?.trim();
    const sourceHint = sourceAge ? `The person in the uploaded photo is approximately ${sourceAge} years old. ` : "";
    if (ages.length <= 1) {
      prompt = prompt.replace("{age}", ages[0] || "child");
      prompt = prompt.replace("{bg_desc}", bgMap[paramValues["background"]] || bgMap.auto);
      prompt = sourceHint + prompt;
    } else {
      const compositions = [
        "seated casually on a comfortable sofa, some on the floor in front, relaxed and natural",
        "gathered around a dining table, sharing a meal together, warm family atmosphere",
        "walking together along a path outdoors, candid snapshot moment, natural stride",
        "in a garden, some sitting on a bench, others standing around, flowers in background",
        "sitting on stairs, different people on different steps, casual and cool",
        "standing in a semi-circle facing the camera, arms around each other, warm smiles",
        "on a picnic blanket in a park, some sitting cross-legged, some lounging, sunny day",
        "leaning against a wall together, relaxed urban style, different heights and poses",
      ];
      const comp = compositions[Math.floor(Math.random() * compositions.length)];
      const ageList = ages.map((a) => `a ${a}-year-old version`).join(", ");
      prompt = `${sourceHint}IMPORTANT: The uploaded photo shows a real person. Study their unique facial features carefully — face shape, eye shape, nose bridge, lip shape, jawline, cheekbone structure, skin tone, ethnicity and gender. These are the permanent identity markers that remain recognizable at any age.

Now create a group portrait with ${ages.length} versions of THIS EXACT SAME PERSON at different ages. Composition: ${comp}. Ages in the photo: ${ageList}.

STRICT RULES:
1. SAME PERSON GUARANTEE: Every version must share the identical permanent features extracted from the reference photo. Same exact gender (NEVER swap male to female or female to male). Same unique face shape, same distinctive eyes, same nose, same lips, same jaw. Same ethnic appearance. This is ONE person aging — NOT different people.
2. AGE REALISM — THIS IS CRITICAL: Babies (0-3): HUGE round head (1/4 of body length), chubby cheeks, tiny flat nose, very big eyes, smooth soft baby skin, short limbs. Young children (4-12): Child body proportions, round face with NO cheekbone definition, small jaw, button nose, big bright eyes, soft plump skin. They must look unmistakably like children — NOT miniature adults. Teens (13-19): Lanky body, some baby fat remaining, emerging jawline but NOT full adult bone structure. Adults (20-50): Defined bone structure, normal adult proportions, mature facial features. Seniors (60+): Fine wrinkles, age spots, thinner lips, softer jaw.
3. HAIR must match each age biologically: baby (fine soft hair or bald spots), child (age-appropriate cute style), teen (trendy youthful style), adult (mature professional style), senior (gray/white, thinning, receding hairline). Hair color, volume, density, and texture must follow natural aging — do NOT give a child adult hair or a senior youthful hair.
4. NEVER put an adult face on a child body. NEVER put a child face on an adult body. This is the most critical rule.
5. Clothing must match each age naturally.
6. ALL faces must be clearly visible, looking directly at the camera lens. No face hidden or turned away.
7. Same lighting, same background: ${bgMap[paramValues["background"]] || bgMap.auto}.
${framing} Photorealistic, consistent scale, professional quality.`;
    }
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional style instructions (do not render this as text): ${ct}.` : "");
  }

  // Photo together
  if (presetId === "photo_together") {
    const poseMap: Record<string, string> = {
      standing: "standing side by side, smiling warmly", hugging: "sharing a warm embrace, genuine smiles", holding_hands: "holding hands, looking at each other affectionately",
      back_to_back: "standing back to back with confident expressions", walking: "walking together naturally, candid moment", sitting: "sitting side by side, relaxed and comfortable",
      jumping: "jumping together joyfully in the air", shoulder_arm: "arm around shoulder, friendly and casual",
    };
    const bgMap: Record<string, string> = {
      auto: "a naturally lit pleasant environment", park: "a beautiful park with trees and flowers", beach: "a sunny beach with waves and sand",
      city: "a vibrant city street with architecture", cafe: "a cozy coffee shop interior with warm lighting", mountain: "a scenic mountain landscape with panoramic views",
      wedding_hall: "an elegant wedding hall with floral decorations", custom: paramValues["bg_custom"] || "a nice background",
    };
    const other = paramValues["other_person"]?.trim() || (img2 ? "the person in the second uploaded photo" : "another person");
    prompt = prompt.replace("{other_person}", other);
    prompt = prompt.replace("{pose}", poseMap[paramValues["pose"]] || poseMap.standing);
    prompt = prompt.replace("{bg_desc}", bgMap[paramValues["background"]] || bgMap.auto);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional style instructions (do not render this as text): ${ct}.` : "");
  }

  // Greeting card
  if (presetId === "greeting_card") {
    const styleMap: Record<string, string> = {
      watercolor: "a watercolor hand-painted",
      flat: "a flat modern illustration",
      "3D": "a 3D rendered isometric",
      chinese: "a traditional Chinese ink and brush",
      minimal: "a minimalist clean line-art",
      retro: "a retro vintage",
    };
    const ratioMap: Record<string, string> = { "4:3": "Horizontal", "3:4": "Vertical" };
    prompt = prompt.replace("{style_desc}", styleMap[paramValues["style"]] || styleMap.random);
    prompt = prompt.replace("{holiday}", paramValues["holiday"] || "birthday");
    prompt = prompt.replace("{from}", paramValues["from"] || "Anonymous");
    prompt = prompt.replace("{to}", paramValues["to"] || "You");
    prompt = prompt.replace("{message}", `TEXT TO RENDER ON CARD: "${paramValues["message"] || "Best wishes!"}"`);
    prompt = prompt.replace("{ratio_desc}", ratioMap[paramValues["ratio"]] || "Vertical");
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional style instructions (do not render this as text): ${ct}.` : "");
  }

  // Wallpaper
  if (presetId === "wallpaper") {
    const styleMap: Record<string, string> = {
      nature: "nature landscape", abstract: "abstract art", minimal: "minimalist",
      space: "cosmic space", geometric: "geometric pattern", gradient: "smooth gradient",
    };
    const colorMap: Record<string, string> = {
      auto: "with balanced colors", dark: "in dark tones", light: "in light tones",
      vibrant: "with vibrant saturated colors", pastel: "with soft pastel colors",
    };
    const moodMap: Record<string, string> = {
      calm: "Calm and serene atmosphere", energetic: "Energetic and dynamic feel", dreamy: "Dreamy and ethereal mood",
    };
    prompt = prompt.replace("{style}", styleMap[paramValues["style"]] || styleMap.nature);
    prompt = prompt.replace("{color_desc}", colorMap[paramValues["color"]] || colorMap.auto);
    prompt = prompt.replace("{mood_desc}", moodMap[paramValues["mood"]] || moodMap.calm);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional instructions: ${ct}.` : "");
  }

  // Logo design
  if (presetId === "logo_design") {
    const styleMap: Record<string, string> = {
      minimal: "minimalist clean", vintage: "vintage retro", tech: "modern tech",
      handdrawn: "hand-drawn organic", luxury: "luxury premium", geometric: "geometric bold",
    };
    const colorMap: Record<string, string> = {
      auto: "Harmonious color palette", dark: "Dark elegant color scheme", gold: "Gold and black premium palette", blue: "Blue professional color scheme",
    };
    prompt = prompt.replace("{brand}", paramValues["brand"] || "Brand");
    prompt = prompt.replace("{industry}", paramValues["industry"] || "technology");
    prompt = prompt.replace("{style}", styleMap[paramValues["style"]] || styleMap.minimal);
    prompt = prompt.replace("{color_desc}", colorMap[paramValues["color"]] || colorMap.auto);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional instructions: ${ct}.` : "");
  }

  // Tattoo design
  if (presetId === "tattoo_design") {
    const styleMap: Record<string, string> = {
      traditional: "traditional old-school", tribal: "tribal bold", watercolor: "watercolor artistic",
      minimalist: "minimalist fine-line", japanese: "Japanese irezumi", geometric: "geometric precise",
    };
    const placementMap: Record<string, string> = {
      arm: "upper arm sleeve", chest: "chest plate", back: "full back", wrist: "wrist band", leg: "leg calf",
    };
    const colorMap: Record<string, string> = {
      bw: "Black ink only, no color", color: "Full color vibrant ink",
    };
    prompt = prompt.replace("{theme}", paramValues["theme"] || "custom design");
    prompt = prompt.replace("{style}", styleMap[paramValues["style"]] || styleMap.traditional);
    prompt = prompt.replace("{placement}", placementMap[paramValues["placement"]] || placementMap.arm);
    prompt = prompt.replace("{color_desc}", colorMap[paramValues["color"]] || colorMap.bw);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional instructions: ${ct}.` : "");
  }

  // Interior design
  if (presetId === "interior_design") {
    const roomMap: Record<string, string> = {
      living: "living room", bedroom: "bedroom", kitchen: "kitchen", bathroom: "bathroom", office: "home office",
    };
    const styleMap: Record<string, string> = {
      modern: "modern contemporary", minimalist: "minimalist clean", industrial: "industrial loft",
      scandinavian: "Scandinavian hygge", japandi: "Japandi fusion", luxury: "luxury high-end",
    };
    const colorMap: Record<string, string> = {
      auto: "balanced natural palette", warm: "warm earthy tones", cool: "cool serene tones",
    };
    const moodMap: Record<string, string> = {
      cozy: "Cozy and inviting atmosphere", luxurious: "Luxurious and opulent feel", airy: "Airy and spacious ambiance",
    };
    prompt = prompt.replace("{room_type}", roomMap[paramValues["room_type"]] || roomMap.living);
    prompt = prompt.replace("{style}", styleMap[paramValues["style"]] || styleMap.modern);
    prompt = prompt.replace("{color_desc}", colorMap[paramValues["color"]] || colorMap.auto);
    prompt = prompt.replace("{mood_desc}", moodMap[paramValues["mood"]] || moodMap.cozy);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional instructions: ${ct}.` : "");
  }

  // Food design
  if (presetId === "food_design") {
    const styleMap: Record<string, string> = {
      overhead: "flat-lay overhead", closeup: "macro close-up", rustic: "rustic farmhouse",
      fine_dining: "fine dining gourmet", street_food: "street food casual",
    };
    const settingMap: Record<string, string> = {
      wooden_table: "on a rustic wooden table", marble: "on a sleek marble counter", outdoor: "in natural outdoor lighting", restaurant: "in an elegant restaurant setting",
    };
    prompt = prompt.replace("{dish}", paramValues["dish"] || "delicious cuisine");
    prompt = prompt.replace("{style}", styleMap[paramValues["style"]] || styleMap.overhead);
    prompt = prompt.replace("{setting_desc}", settingMap[paramValues["setting"]] || settingMap.wooden_table);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional instructions: ${ct}.` : "");
  }

  // Package design
  if (presetId === "package_design") {
    const typeMap: Record<string, string> = {
      box: "product box", bottle: "bottle", bag: "paper bag", tube: "tube", jar: "glass jar",
    };
    const styleMap: Record<string, string> = {
      modern: "modern sleek", luxury: "luxury premium", eco: "eco-friendly natural", vintage: "vintage classic", minimal: "minimalist clean",
    };
    const colorMap: Record<string, string> = {
      auto: "Balanced color palette", dark: "Dark sophisticated color scheme", light: "Light fresh color scheme",
    };
    prompt = prompt.replace("{product}", paramValues["product"] || "product");
    prompt = prompt.replace("{package_type}", typeMap[paramValues["package_type"]] || typeMap.box);
    prompt = prompt.replace("{style}", styleMap[paramValues["style"]] || styleMap.modern);
    prompt = prompt.replace("{color_desc}", colorMap[paramValues["color"]] || colorMap.auto);
    const ct = paramValues["custom"]?.trim();
    prompt = prompt.replace("{custom}", ct ? `Additional instructions: ${ct}.` : "");
  }

  return prompt;
}

// ── Cache last edit values per preset (persists across modal open/close) ──
const lastParamCache: Record<string, Record<string, string>> = {};
const lastAgeCache: Record<string, string[]> = {};
let lastReopenImage: string | null = null;

// ── Preset Modal ──
function PresetModal({
  presetId,
  onClose,
  messages,
}: {
  presetId: string;
  onClose: () => void;
  messages: PresetSectionMessages;
}) {
  const preset = getPreset(presetId);
  const pm = preset ? messages.presets[presetId] : null;
  const cached = lastParamCache[presetId] || {};
  const reopenImage = lastReopenImage;
  const [imageBase64, setImageBase64] = useState<string | null>(reopenImage);
  const [imagePreview, setImagePreview] = useState<string | null>(reopenImage);
  const [qrImageBase64, setQrImageBase64] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>(cached);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  lastReopenImage = null; // consume the cached image

  if (!preset || !pm) return null;

  // Save to cache whenever paramValues change
  const setParamAndCache = (id: string, value: string) => {
    setParamValues((prev) => {
      const next = { ...prev, [id]: value };
      lastParamCache[presetId] = next;
      return next;
    });
  };

  const resetParams = () => {
    const defaults: Record<string, string> = {};
    for (const p of preset.params) defaults[p.id] = p.defaultValue;
    setParamValues(defaults);
    lastParamCache[presetId] = defaults;
    setSelectedAges([]);
    lastAgeCache[presetId] = [];
  };

  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false); // product_ad more fields toggle
  const [selectedAges, setSelectedAges] = useState<string[]>(lastAgeCache[presetId] || []); // age_journey multi-select

  // Lock body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const totalCost = calcCost(presetId, paramValues);
  const displayCost = presetId === "age_journey" ? (
    selectedAges.length <= 1 ? 2 : selectedAges.length === 2 ? 4 : selectedAges.length === 3 ? 5 : selectedAges.length === 4 ? 7 : 8
  ) : totalCost;

  const applyTemplate = (attrs: Record<string, string>) => {
    const next = { ...paramValues };
    for (const [k, v] of Object.entries(attrs)) next[k] = v;
    setParamValues(next);
    lastParamCache[presetId] = next;
    setHoveredTemplate(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImagePreview(url);
      setImageBase64(url);
    };
    reader.readAsDataURL(file);
  };

  // Keep setParam alias for clean usage below (calls setParamAndCache)
  const setParam = setParamAndCache;

  const handleGenerate = (autoGen: boolean) => {
    const prompt = buildPrompt(presetId, paramValues, selectedAges, null);
    const ratio = paramValues["ratio"] || preset.defaultAspectRatio;
    // Map card style for ImageGenerator's style field
    let style: string | undefined;
    if (presetId === "cartoon_avatar") {
      const styleVal = paramValues["style"] || "anime";
      if (styleVal === "anime" || styleVal === "ghibli") style = "anime";
      else if (styleVal === "3d") style = "3d-render";
      else if (styleVal === "comic") style = "digital-art";
      else style = undefined;
    }

    // Age journey — force 16:9 and use multi-age settings
    const effectiveRatio = presetId === "age_journey" && selectedAges.length > 1 ? "16:9" : ratio;
    const effectiveCost = presetId === "age_journey" ? (
      selectedAges.length <= 1 ? 2 : selectedAges.length === 2 ? 4 : selectedAges.length === 3 ? 5 : selectedAges.length === 4 ? 7 : 8
    ) : totalCost;

    dispatchPresetApply({
      presetId: preset.id,
      prompt,
      model: preset.defaultModel,
      aspectRatio: effectiveRatio,
      style,
      numImages: 1,
      multiplier: effectiveCost,
      imageBase64,
      requiresImage: preset.requiresImage,
      autoGenerate: autoGen,
    });
    onClose();
  };

  // Random: just use the uploaded image with the preset's base prompt (no custom params)
  const handleRandom = () => {
    handleGenerate(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onMouseLeave={() => setHoveredTemplate(null)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Large preview — aligned with right column param labels */}
      {hoveredTemplate && (
        <div className="fixed z-[200] pointer-events-none flex items-center" style={{ right: "calc(50% - 188px)", top: "50%", transform: "translateY(-50%)", maxWidth: "calc(50vw - 240px)", animation: "previewPop 0.2s ease-out" }}>
          <img
            src={hoveredTemplate}
            alt="Preview"
            className="rounded-xl shadow-2xl"
            style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "80vh", border: "3px solid rgba(255,255,255,0.9)" }}
          />
        </div>
      )}
      <div
        className="relative bg-bg-primary rounded-2xl border border-border/30 shadow-2xl flex flex-col"
        style={{ width: 800, height: 600, maxWidth: "95vw", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/20 shrink-0">
          <RoundIcon src={preset.iconImage} alt={pm.name} />
          <div>
            <h3 className="text-base font-bold text-text-primary">{pm.name}</h3>
            <p className="text-xs text-text-muted">{pm.desc}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: left upload + right params */}
        <div className="flex flex-1 overflow-y-auto">
          {/* Left column: upload — hidden for greeting card */}
          {preset.requiresImage && (
          <div className="shrink-0 border-r border-border/20 p-4 flex flex-col gap-3 w-[240px]">
            {preset.requiresImage ? (
              <>
                {/* Main image — square */}
                {imagePreview ? (
                  <div className="relative mx-auto w-full aspect-square">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover bg-bg-secondary rounded-lg" />
                    <button onClick={() => { setImagePreview(null); setImageBase64(null); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-[10px] hover:bg-red-500">✕</button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="mx-auto rounded-xl border-2 border-dashed border-border/50 hover:border-accent/40 hover:bg-bg-secondary/50 transition-all flex flex-col items-center justify-center gap-2 text-text-muted hover:text-accent cursor-pointer w-full aspect-square">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-xs text-center px-2">{messages.upload_hint}</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {/* QR code upload — shown when has_qrcode is yes */}
                {presetId === "product_ad" && paramValues["has_qrcode"] === "yes" && (
                  <>
                    {qrPreview ? (
                      <div className="relative w-full aspect-square">
                        <img src={qrPreview} alt="QR" className="w-full h-full object-contain bg-bg-secondary rounded-lg" />
                        <button onClick={() => { setQrPreview(null); setQrImageBase64(null); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-[10px] hover:bg-red-500">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => qrInputRef.current?.click()} className="w-full rounded-lg border border-dashed border-border/50 hover:border-accent/40 flex items-center justify-center gap-1 py-2 text-[10px] text-text-muted hover:text-accent transition-colors">
                        + 上传二维码
                      </button>
                    )}
                    <input ref={qrInputRef} type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !file.type.startsWith("image/")) return;
                      const reader = new FileReader();
                      reader.onload = () => { const url = reader.result as string; setQrPreview(url); setQrImageBase64(url); };
                      reader.readAsDataURL(file);
                    }} className="hidden" />
                  </>
                )}
                {/* Random button — moved below uploads */}
                {presetId !== "product_ad" && (
                  <>
                  <button onClick={handleRandom} disabled={!imageBase64}
                    className="w-full rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    {messages.random_btn}
                  </button>
                  {messages.random_cost && (
                    <p className="text-[10px] text-text-muted text-center">{messages.random_cost.replace("[[COUNT]]", String(preset.baseCost))}</p>
                  )}
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <div className="rounded-xl border-2 border-dashed border-border/30 p-4 flex items-center justify-center text-xs text-text-muted w-full" style={{ height: 260 }}>
                  <p className="text-center">无需上传图片</p>
                </div>
                <button onClick={handleRandom}
                  className="w-full rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60 transition-all flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  {messages.random_btn}
                </button>
                <p className="text-[10px] text-text-muted text-center">{messages.random_cost.replace("[[COUNT]]", String(preset.baseCost))}</p>
              </div>
            )}
          </div>
          )}

          {/* Right column: params */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {preset.params.map((param) => {
              if (param.type === "custom_prompt") {
                return (
                  <div key={param.id}>
                    <label className="text-[11px] font-medium text-amber-400 block mb-1">
                      {pm.params?.[param.id] ?? param.labelKey} <span className="text-text-muted">({messages.custom_prompt_priority})</span>
                    </label>
                    <textarea
                      value={paramValues[param.id] || ""}
                      onChange={(e) => setParam(param.id, e.target.value)}
                      placeholder={pm.params?.[param.placeholderKey || ""] || ""}
                      rows={2}
                      className="w-full rounded-lg border border-border/50 bg-bg-card px-3 py-1.5 text-xs text-text-primary outline-none placeholder:text-text-muted resize-none"
                    />
                  </div>
                );
              }
              if (param.type === "textarea") {
                return (
                  <div key={param.id}>
                    <label className="text-[11px] font-medium text-text-secondary block mb-1">{pm.params?.[param.id] ?? param.labelKey}</label>
                    <div className="relative">
                      <textarea
                        value={paramValues[param.id] || ""}
                        onChange={(e) => setParam(param.id, e.target.value)}
                        placeholder={pm.params?.[param.placeholderKey || ""] || ""}
                        rows={3}
                        className="w-full rounded-lg border border-border/50 bg-bg-card px-3 py-1.5 text-xs text-text-primary outline-none placeholder:text-text-muted resize-none pr-16"
                      />
                      {param.id === "message" && (
                        <button type="button" onClick={() => setParam("message", getRandomGreeting(paramValues["holiday"] || "general"))}
                          className="absolute right-1 top-1 rounded-md bg-accent/10 px-2 py-1 text-[10px] text-accent hover:bg-accent/20 transition-colors">
                          🎲 推荐贺词
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
              if (param.type === "text") {
                // Skip bg_custom if background is not "custom"
                if (param.id === "bg_custom" && paramValues["background"] !== "custom") return null;
                // Skip hidden product_ad fields unless "more" is open
                if (presetId === "product_ad" && ["event_time", "company", "contact", "phone", "has_qrcode"].includes(param.id) && !showMore) return null;
                            return (
                  <div key={param.id}>
                    <label className="text-[11px] font-medium text-text-secondary block mb-1">{pm.params?.[param.id] ?? param.labelKey}</label>
                    <div className="relative">
                    <input
                      type="text"
                      value={paramValues[param.id] || ""}
                      onChange={(e) => setParam(param.id, e.target.value)}
                      placeholder={pm.params?.[param.placeholderKey || ""] || ""}
                      className={`rounded-lg border border-border/50 bg-bg-card px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-muted ${param.id === "source_age" ? "w-24" : "w-full"} ${param.id === "copy" ? "pr-16" : ""}`}
                    />
                    {param.id === "source_age" && presetId === "age_journey" && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {[
                          { v:"0", label:"0-3岁" },{ v:"4", label:"4-12岁" },{ v:"13", label:"13-19岁" },{ v:"20", label:"20-35岁" },
                          { v:"36", label:"36-50岁" },{ v:"51", label:"51-65岁" },{ v:"66", label:"66-80岁" },{ v:"81", label:"80岁以上" },
                        ].map((item) => (
                          <button key={item.v} type="button" onClick={() => setParam("source_age", item.v)}
                            className={`rounded-md border px-2 py-0.5 text-[10px] transition-colors ${paramValues["source_age"] === item.v ? "border-accent bg-accent/10 text-accent" : "border-border/50 text-text-muted hover:border-border"}`}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {param.id === "title" && presetId === "product_ad" && (
                      <button type="button" onClick={async () => {
                        if (!imageBase64) return;
                        setParam("title", "AI识别中...");
                        setParam("copy", "AI识别中...");
                        setParam("points", "AI识别中...");
                        const result = await analyzeProductImage(imageBase64);
                        if (result) {
                          setParam("title", result.title);
                          setParam("copy", result.copy);
                          setParam("points", result.points);
                        }
                      }}
                        className="absolute right-1 top-1 rounded-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-2 py-1 text-[10px] text-accent hover:from-purple-500/30 hover:to-blue-500/30 transition-colors">
                        AI识别推荐 (1积分)
                      </button>
                    )}
                    </div>
                  </div>
                );
              }
              // Hide has_qrcode unless more is open for product_ad
              if (presetId === "product_ad" && param.id === "has_qrcode" && !showMore) return null;
              // Insert "更多选项" toggle after ratio select for product_ad
              const isRatioForProductAd = presetId === "product_ad" && param.id === "ratio";
              // Age multi-select for age_journey
              if (presetId === "age_journey" && param.id === "age") {
                const maxAges = 5;
                const toggleAge = (val: string) => {
                  setSelectedAges((prev) => {
                    const next = prev.includes(val) ? prev.filter((v) => v !== val) : prev.length >= maxAges ? prev : [...prev, val];
                    lastAgeCache[presetId] = next;
                    return next;
                  });
                };
                const ageCost = selectedAges.length <= 1 ? 2 : selectedAges.length === 2 ? 4 : selectedAges.length === 3 ? 5 : selectedAges.length === 4 ? 7 : 8;
                return (
                  <div key={param.id}>
                    <label className="text-[11px] font-medium text-text-secondary block mb-1">{pm.params?.[param.id] ?? param.labelKey}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {param.options?.map((o) => {
                        const selected = selectedAges.includes(o.value);
                        const disabled = !selected && selectedAges.length >= maxAges;
                        return (
                          <button key={o.value} type="button" onClick={() => toggleAge(o.value)}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                              disabled ? "opacity-30 cursor-not-allowed" :
                              selected ? "border-accent bg-accent/15 text-accent shadow-sm" :
                              "border-border/50 bg-bg-card text-text-secondary hover:border-border hover:text-text-primary"
                            }`}>
                            {pm.params?.[o.labelKey] ?? pm.params?.[o.labelKey.split(".").pop()!] ?? o.value}
                          </button>
                        );
                      })}
                    </div>
                    {selectedAges.length <= 1 ? (
                      <p className="mt-1 text-[10px] text-text-muted">选择一个年龄看穿越效果</p>
                    ) : (
                      <div className="mt-1 text-[10px]">
                        <p className="text-accent">已选 {selectedAges.length} 个年龄段，将生成跨代合影</p>
                        <p className="text-text-muted">多人合影自动切换为横版 16:9</p>
                      </div>
                    )}
                  </div>
                );
              }
              // select — render as clickable chip tags
              return (
                <div key={param.id}>
                  <label className="text-[11px] font-medium text-text-secondary block mb-1">{pm.params?.[param.id] ?? param.labelKey}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {param.options?.map((o) => {
                      const selected = (paramValues[param.id] || param.defaultValue) === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setParam(param.id, o.value)}
                          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                            selected
                              ? "border-accent bg-accent/15 text-accent shadow-sm"
                              : "border-border/50 bg-bg-card text-text-secondary hover:border-border hover:text-text-primary"
                          }`}
                        >
                          {o.icon && <img src={o.icon} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                          {pm.params?.[o.labelKey] ?? pm.params?.[o.labelKey.split(".").pop()!] ?? o.value}
                          {o.extraCost ? <span className="ml-1 text-[10px] text-text-muted">+{o.extraCost}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                  {isRatioForProductAd && (
                    <button type="button" onClick={() => setShowMore(!showMore)}
                      className="mt-1 text-[11px] text-accent hover:underline">
                      {showMore ? "收起更多选项 ▲" : "更多选项 ▼"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {/* Waterfall templates — right column for greeting_card + text-to-image presets */}
          {(presetId === "greeting_card" || !preset.requiresImage) && (
            <div className={`shrink-0 border-l border-border/20 flex flex-col ${presetId === "greeting_card" ? "w-[180px]" : "w-[200px]"}`} onMouseLeave={() => setHoveredTemplate(null)}>
              <div className="overflow-y-auto overflow-x-hidden flex-1 p-2 flex flex-col gap-1.5">
                {(preset.templates || preset.exampleImages.map((img, i) => ({ thumb: img.thumb, large: img.large, attrs: {} }))).map((tpl: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/30 group/tpl hover:border-accent/40 transition-colors relative mb-2 break-inside-avoid"
                    onMouseEnter={() => setHoveredTemplate(tpl.large)}
                  >
                    <img src={tpl.thumb} alt="" className="w-full h-auto rounded-lg" />
                    {Object.keys(tpl.attrs).length > 0 && (
                    <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-6 pb-2 px-2 opacity-0 group-hover/tpl:opacity-100 transition-opacity flex justify-center">
                      <button
                        type="button"
                        onClick={() => applyTemplate(tpl.attrs)}
                        className="cursor-pointer rounded-md bg-white/25 backdrop-blur-sm px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-accent hover:scale-105 transition-all"
                      >
                        做同款
                      </button>
                    </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: reset + cost + generate button */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border/20 bg-bg-secondary/30 shrink-0">
          <button
            type="button"
            onClick={resetParams}
            className="rounded-lg border border-border/50 px-3 py-2 text-[11px] text-text-muted hover:text-text-primary hover:border-border transition-colors"
          >
            重置属性
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-muted">消耗 <span className="text-accent font-semibold text-sm">{displayCost}</span> {messages.free || "积分"}</span>
            <button
              onClick={() => handleGenerate(false)}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25"
            >
              {messages.generate_btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preset Card ──
function PresetCard({
  presetId, messages, onStart,
}: {
  presetId: string; messages: PresetSectionMessages; onStart: () => void;
}) {
  const preset = getPreset(presetId);
  const pm = preset ? messages.presets[presetId] : null;
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [showLarge, setShowLarge] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!preset || !pm) return null;

  const handleEnter = (key: string) => {
    setHoveredKey(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowLarge(key), 300);
  };
  const handleLeave = () => {
    setHoveredKey(null); setShowLarge(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="rounded-2xl border border-border/30 bg-bg-card overflow-visible hover:border-accent/20 transition-all">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <RoundIcon src={preset.iconImage} alt={pm.name} />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-text-primary">{pm.name}</h4>
            <p className="text-[12px] text-text-muted truncate" title={pm.desc}>{pm.desc}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="ml-2 shrink-0 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-500 hover:to-blue-500 transition-all cursor-pointer"
        >
          {messages.start_btn}
        </button>
      </div>
      <div className="flex items-end justify-center gap-6 pb-6 px-4 pt-2" style={{ overflow: "visible" }}>
        {preset.exampleImages.map((img: ExampleImage, i: number) => (
          <div key={i} className="relative shrink-0"
            style={{
              width: 90, height: 120,
              transform: hoveredKey === img.large
                ? `${img.rotate === "left" ? "rotate(6deg)" : "rotate(-6deg)"} scale(1.05)`
                : `${img.rotate === "left" ? "rotate(-6deg)" : "rotate(6deg)"} scale(1)`,
              transition: "transform 0.3s ease",
              zIndex: showLarge === img.large ? 50 : 1,
              borderRadius: 8,
              outline: hoveredKey === img.large ? "2px solid rgba(255,255,255,0.85)" : "none",
            }}
            onMouseEnter={() => handleEnter(img.large)}
            onMouseLeave={handleLeave}
          >
            <img src={img.thumb} alt="" className="w-full h-full object-cover shadow-md" style={{ borderRadius: 8 }} />
            {showLarge === img.large && (
              <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: "calc(100% + 12px)", animation: "previewPop 0.25s ease-out" }}>
                <img src={img.large} alt="Preview" className="rounded-xl shadow-2xl" style={{ width: "auto", height: "auto", maxWidth: "none", maxHeight: "none", border: "3px solid rgba(255,255,255,0.9)", transform: img.rotate === "left" ? "rotate(-6deg)" : "rotate(6deg)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section ──
export default function PresetSection({ messages }: Props) {
  const [modalPresetId, setModalPresetId] = useState<string | null>(null);

  // Listen for reopen-preset event (dispatched from ImageGenerator output area)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ presetId: string; imageBase64?: string | null }>).detail;
      // Cache the image so the modal can restore it
      if (detail.imageBase64) lastReopenImage = detail.imageBase64;
      setModalPresetId(detail.presetId);
    };
    window.addEventListener("reopen-preset", handler);
    return () => window.removeEventListener("reopen-preset", handler);
  }, []);

  return (
    <>
      <style>{`@keyframes previewPop{0%{opacity:0;transform:translateY(8px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <section className="mt-12 mb-20 mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">{messages.title}</h2>
          <p className="text-sm text-text-muted mt-1">{messages.subtitle}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((preset) => (
            <PresetCard key={preset.id} presetId={preset.id} messages={messages} onStart={() => setModalPresetId(preset.id)} />
          ))}
        </div>
      </section>
      {modalPresetId && <PresetModal presetId={modalPresetId} onClose={() => setModalPresetId(null)} messages={messages} />}
    </>
  );
}
