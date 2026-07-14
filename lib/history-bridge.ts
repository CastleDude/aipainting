const REMIX_KEY = "remix_image_url";
const REMIX_PROMPT_KEY = "remix_prompt";
const REMIX_MODEL_KEY = "remix_model";
const EDIT_KEY = "edit_image_url";

export function setRemixImage(url: string, prompt?: string, model?: string) {
  sessionStorage.setItem(REMIX_KEY, url);
  if (prompt) sessionStorage.setItem(REMIX_PROMPT_KEY, prompt);
  if (model) sessionStorage.setItem(REMIX_MODEL_KEY, model);
}

export function consumeRemixImage(): { url: string; prompt?: string; model?: string } | null {
  const url = sessionStorage.getItem(REMIX_KEY);
  if (!url) return null;
  sessionStorage.removeItem(REMIX_KEY);
  const prompt = sessionStorage.getItem(REMIX_PROMPT_KEY) || undefined;
  if (prompt) sessionStorage.removeItem(REMIX_PROMPT_KEY);
  const model = sessionStorage.getItem(REMIX_MODEL_KEY) || undefined;
  if (model) sessionStorage.removeItem(REMIX_MODEL_KEY);
  return { url, prompt, model };
}

export function setEditImage(url: string) {
  sessionStorage.setItem(EDIT_KEY, url);
}

export function consumeEditImage(): string | null {
  const url = sessionStorage.getItem(EDIT_KEY);
  if (url) sessionStorage.removeItem(EDIT_KEY);
  return url;
}
