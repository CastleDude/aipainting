/**
 * Auto-translate locale messages using AI.
 *
 * Usage:
 *   npx tsx scripts/translate-locale.ts fr    # Translate to French
 *   npx tsx scripts/translate-locale.ts de es pt  # Translate multiple languages at once
 *
 * Requires OPENROUTER_API_KEY in .env.local
 */

import fs from "node:fs";
import path from "node:path";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_KEY) {
  console.error("OPENROUTER_API_KEY not set in environment. Set it in .env.local or export it.");
  process.exit(1);
}

// Load .env.local (try multiple paths)
function loadEnv() {
  const paths = [
    path.join(process.cwd(), ".env.local"),
    path.resolve(".env.local"),
  ];
  for (const envPath of paths) {
    try {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        if (!process.env[key]) process.env[key] = trimmed.slice(eqIdx + 1).trim();
      }
      return;
    } catch {}
  }
}
loadEnv();

// Language name mapping
const LANG_NAMES: Record<string, string> = {
  fr: "French", de: "German", es: "Spanish", pt: "Portuguese",
  it: "Italian", ru: "Russian", ar: "Arabic", hi: "Hindi",
  th: "Thai", vi: "Vietnamese", id: "Indonesian", tr: "Turkish",
  nl: "Dutch", pl: "Polish", sv: "Swedish", da: "Danish",
  fi: "Finnish", no: "Norwegian", cs: "Czech", ro: "Romanian",
  hu: "Hungarian", el: "Greek", he: "Hebrew", uk: "Ukrainian",
};

const targetLangs = process.argv.slice(2).filter(l => l.length === 2);
if (targetLangs.length === 0) {
  console.log("Usage: npx tsx scripts/translate-locale.ts <lang> [lang...]");
  console.log("Example: npx tsx scripts/translate-locale.ts fr de es");
  console.log("Supported: " + Object.keys(LANG_NAMES).join(", "));
  process.exit(1);
}

// Load source (English)
const messagesDir = path.join(process.cwd(), "messages");
const source = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf-8"));

async function translateText(text: string, lang: string): Promise<string> {
  if (!text || typeof text !== "string") return text;
  // Skip placeholders and short codes
  if (/^[a-z_]+$/.test(text) && text.length < 20) return text;

  const langName = LANG_NAMES[lang] || lang;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: `Translate this UI string to ${langName}. Keep placeholders like [[COUNT]], {count}, %s, %d exactly as-is. Return ONLY the translated text with no explanation:\n\n${text}`,
      }],
      max_tokens: 200,
      temperature: 0.1,
    }),
  });
  const data = await res.json();
  const translated = data?.choices?.[0]?.message?.content?.trim() || text;
  return translated;
}

async function translateObject(
  obj: Record<string, unknown>,
  lang: string,
  prefix = ""
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  const keys = Object.keys(obj);
  const total = keys.length;
  let done = 0;

  for (const key of keys) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    done++;
    process.stdout.write(`\r  ${done}/${total}: ${fullKey.slice(0, 50)}...`);

    if (typeof value === "string") {
      result[key] = await translateText(value, lang);
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 100));
    } else if (Array.isArray(value)) {
      result[key] = value; // Keep arrays as-is (ad_copies etc.)
    } else if (value && typeof value === "object") {
      result[key] = await translateObject(value as Record<string, unknown>, lang, fullKey);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function main() {
  for (const lang of targetLangs) {
    const langName = LANG_NAMES[lang] || lang;
    console.log(`\n🌐 Translating to ${langName} (${lang})...`);

    const outputPath = path.join(messagesDir, `${lang}.json`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  ⚠ ${lang}.json already exists, skipping. Delete it first to retranslate.`);
      continue;
    }

    const translated = await translateObject(source, lang);
    fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2));
    console.log(`\n  ✅ Saved to messages/${lang}.json`);

    // Add to i18n routing
    const routingPath = path.join(process.cwd(), "i18n", "routing.ts");
    let routing = fs.readFileSync(routingPath, "utf-8");
    if (!routing.includes(`"${lang}"`)) {
      routing = routing.replace(
        /locales:\s*\[([^\]]*)\]/,
        (match, langs: string) => {
          const arr = langs.split(",").map((s: string) => s.trim());
          arr.push(`"${lang}"`);
          return `locales: [${arr.join(", ")}]`;
        }
      );
      fs.writeFileSync(routingPath, routing);
      console.log(`  ✅ Added "${lang}" to i18n/routing.ts locales`);
    }

    console.log(`  📋 Next: add "${lang}" to proxy.ts matcher and middleware.ts if needed`);
  }
  console.log("\nDone! Restart dev server to see new languages.\n");
}

main().catch(e => { console.error(e); process.exit(1); });
