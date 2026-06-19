# AI Model API Reference

## Generation Models (9 total)

| # | Model Key | Display Name | Provider | Per-Image Cost (USD) | Credit Multiplier | Default for Presets | Free Tier | Status |
|---|-----------|-------------|----------|----------------------|--------------------|---------------------|-----------|--------|
| 1 | `schnell` | Flux Schnell (Fast) | Runware | ~$0.0006 | 1x | greeting_card, logo_design, tattoo_design, interior_design, food_design, package_design, wallpaper | ✅ | ✅ Active |
| 2 | `sdxl` | SDXL (Quality) | Runware (CivitAI) | ~$0.0013 | 2x | — | ❌ | ✅ Active |
| 3 | `flux-dev` | Flux Dev (Pro) | Runware | ~$0.003 | 3x | photo_restoration, cartoon_avatar, age_journey, photo_together, product_ad | ❌ | ✅ Active |
| 4 | `seedream` | Seedream 4.5 | ByteDance (via OpenRouter) | ~$0.005-0.008 | 4x | — | ❌ | ✅ Active |
| 5 | `nano-banana` | Nano Banana (Gemini 2.5 Flash) | Google (via OpenRouter) | ~$0.003 | 3x | — | ❌ | ✅ Active |
| 6 | `nano-banana2` | Nano Banana 2 (Gemini 3.1 Flash) | Google (via OpenRouter) | ~$0.005 | 4x | — | ❌ | ✅ Active |
| 7 | `banana-pro` | Banana Pro (Gemini 3 Pro) | Google (via OpenRouter) | ~$0.01 | 6x | — | ❌ | ✅ Active |
| 8 | `gpt-image` | GPT-5 Image Mini | OpenAI (via OpenRouter) | ~$0.01 | 8x | — | ❌ | ✅ Active |
| 9 | `gpt-image-pro` | GPT-5 Image | OpenAI (via OpenRouter) | ~$0.04 | 12x | — | ❌ | ✅ Active |

**Note:** Free tier only allows `schnell` by default. Paid tiers (Basic/Premium/Ultimate) get all models.

### API Flow

```
Runware models (schnell, sdxl, flux-dev):
  Primary: api.runware.ai/v1 (sync)
  Fallback 1: api.novita.ai/v3/async (if NOVITA_API_KEY set)
  Fallback 2: openrouter.ai/api/v1 (last resort)

OpenRouter models (seedream, nano-banana*, banana-pro, gpt-image*):
  openrouter.ai/api/v1/chat/completions
```

### API Keys Status

| Key | Variable | Status |
|-----|----------|--------|
| Runware | `RUNWARE_API_KEY` | ✅ Active |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ Active |
| Novita | `NOVITA_API_KEY` | ❌ Not configured |
| ModelScope | `MODELSCOPE_API_KEY` | ❌ Commented out |
| Volcano ARK | `VOLCANO_API_KEY` | ❌ Commented out (legacy) |
| DashScope | `DASHSCOPE_API_KEY` | ❌ Commented out (legacy) |

---

## Image Tools (3 AI tools)

| # | Tool | API | Per-Use Cost (USD) | Credit Cost | Free Tier | Status |
|---|------|-----|-------------------|-------------|-----------|--------|
| 1 | Background Removal | Baidu AI (body_seg) | Free (50,000 lifetime) | 1 credit | ✅ Unlimited | ✅ Active |
| 2 | AI Upscale (2x/4x) | ModelScope Real-ESRGAN | Free (2,000/day) | 2 credits | ✅ 2000/day | ⚠️ Fallback to OpenRouter |
| 3 | Skin Smoothing | OpenRouter (Seedream 4.5) | ~$0.004-0.008 | 3 credits | ❌ Paid only | ✅ Active |

### Tool API Keys

| Key | Variable | Status |
|-----|----------|--------|
| Baidu AI | `BAIDU_AI_API_KEY` / `BAIDU_AI_SECRET_KEY` | ✅ Active |
| ModelScope | `MODELSCOPE_API_KEY` | ❌ Commented out (uses OpenRouter fallback) |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ Active (upscale + smooth fallback) |

---

## Content Moderation

| # | Service | API | Per-Call Cost | Status |
|---|---------|-----|--------------|--------|
| 1 | Creem Moderation | api.creem.io/v1/moderation/prompt | ~$0.001/call | ✅ Active (production) |

**Scope:** All prompt-based endpoints — `/api/generate`, `/api/image-tools`, `/api/translate`.

---

## Credit Multiplier Rules

**Generation formula:** `total_deduction = numImages × presetMultiplier × modelMultiplier`

| Factor | Range | Applies To |
|--------|-------|------------|
| numImages | 1-4 | Always |
| presetMultiplier | 1-8 | Preset-based generation (baseCost + extraCost options) |
| modelMultiplier | 1-5x | Model selection (see table above) |

**Example:** Photo Restoration (base 3) + 4x upscale (+2 extra) + flux-dev (3x) × 1 image = 5 × 3 = **15 credits**

---

## Monthly Credit Allocation

| Tier | Monthly Credits | Price |
|------|----------------|-------|
| Free | 10/day | $0 |
| Basic | 500/month | $6/mo |
| Premium | 2,000/month | $10/mo |
| Ultimate | 5,000/month | $20/mo |
