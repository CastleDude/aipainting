import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh", "zh-Hant", "ja", "ko", "fr", "de", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
