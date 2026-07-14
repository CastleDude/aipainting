#!/usr/bin/env node

/**
 * Runware AI Image Generation MCP Server
 *
 * Wraps the Runware API (https://api.runware.ai/v1) as a Claude Code MCP tool.
 * Generated images are automatically saved to a local directory in the project.
 *
 * Install globally (available in all projects):
 *   claude mcp add --scope user runware -- node <absolute-path-to-this-file>
 */

import { randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

// ── Config ──────────────────────────────────────────────────────────────────

// Load API keys from env files, in priority order:
// 1. Shell environment variables (already set)
// 2. Project .env.local (CWD = project root)
// 3. Global ~/.claude/runware.env (shared across all projects)
function loadEnvFile(cwd) {
  const envFiles = [
    resolve(cwd, ".env.local"),                           // project-specific
    resolve(process.env.HOME || process.env.USERPROFILE || "~", ".claude", "runware.env"), // global fallback
  ];

  for (const envPath of envFiles) {
    try {
      const envContent = readFileSync(envPath, "utf8");
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    } catch {
      // File not found — skip to next source
    }
  }
}
loadEnvFile(process.cwd());

const RUNWARE_API_URL = "https://api.runware.ai/v1";
const DEFAULT_OUTPUT_DIR = "generated_images";

const MODEL_MAP = {
  schnell: "runware:100@1",
  sdxl: "civitai:133005@782002",
  "flux-dev": "runware:101@1",
};

const SIZES = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1280, height: 960 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "3:4": { width: 960, height: 1280 },
  "2:3": { width: 832, height: 1280 },
  "3:2": { width: 1280, height: 832 },
  "21:9": { width: 1536, height: 640 },
};

const DEFAULT_MODEL = "schnell";
const DEFAULT_ASPECT = "1:1";
const DEFAULT_NUM_IMAGES = 1;

// ── Helpers ──────────────────────────────────────────────────────────────────

function logStderr(...args) {
  process.stderr.write(`[runware-mcp] ${args.join(" ")}\n`);
}

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function sendError(id, code, message) {
  process.stdout.write(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n"
  );
}

// ── File helpers ─────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    logStderr(`Created directory: ${dir}`);
  }
}

function sanitizeFilename(prompt) {
  return prompt
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9一-鿿\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    || "image";
}

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(filepath, buffer);
  return buffer;
}

// ── Runware API call ─────────────────────────────────────────────────────────

async function generateImage(params) {
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) throw new Error("RUNWARE_API_KEY environment variable is not set");

  const modelKey = params.model || DEFAULT_MODEL;
  const modelId = MODEL_MAP[modelKey] || MODEL_MAP[DEFAULT_MODEL];
  const dims = SIZES[params.aspectRatio] || SIZES[DEFAULT_ASPECT];
  const numImages = Math.min(params.numImages || DEFAULT_NUM_IMAGES, 4);

  const task = {
    taskType: "imageInference",
    taskUUID: randomUUID(),
    model: modelId,
    positivePrompt: params.prompt,
    width: dims.width,
    height: dims.height,
    numberResults: numImages,
    outputType: "URL",
    outputFormat: "JPG",
    includeCost: true,
  };

  if (params.negativePrompt?.trim()) {
    task.negativePrompt = params.negativePrompt.trim();
  }

  logStderr(`Generating ${numImages} image(s) with model "${modelKey}" (${modelId}) at ${dims.width}x${dims.height}`);

  const res = await fetch(RUNWARE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([task]),
  });

  const json = await res.json();

  if (!res.ok) {
    const msg = json.errorMessage || json.error || `Runware error ${res.status}`;
    throw new Error(msg);
  }

  const data = json.data;
  if (!data?.length) throw new Error("Runware returned no images");

  return data.map((img) => img.imageURL || "").filter(Boolean);
}

// ── MCP Handlers ─────────────────────────────────────────────────────────────

async function handleInitialize(id, _params) {
  sendResponse(id, {
    protocolVersion: "2024-11-05",
    capabilities: { tools: {} },
    serverInfo: {
      name: "runware-mcp",
      version: "1.1.0",
    },
  });
}

async function handleListTools(id) {
  sendResponse(id, {
    tools: [
      {
        name: "generate_image",
        description:
          "Generate images using Runware AI and save them to the project. Images are automatically downloaded and saved locally to `generated_images/` (or a custom directory). Supports Flux Schnell (fastest/cheapest, ~$0.0006/img), SDXL (quality, ~$0.0013/img), and Flux Dev (pro, ~$0.003/img).",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Text description of the image to generate. Be detailed and specific for best results.",
            },
            model: {
              type: "string",
              enum: ["schnell", "sdxl", "flux-dev"],
              description:
                "Model: 'schnell' = Flux Schnell (fastest, cheapest), 'sdxl' = SDXL (quality), 'flux-dev' = Flux Dev (pro). Default: 'schnell'.",
            },
            aspectRatio: {
              type: "string",
              enum: ["1:1", "4:3", "16:9", "9:16", "3:4", "2:3", "3:2", "21:9"],
              description: "Aspect ratio. Default: '1:1' (square).",
            },
            numImages: {
              type: "number",
              minimum: 1,
              maximum: 4,
              description: "Number of images (1-4). Default: 1.",
            },
            negativePrompt: {
              type: "string",
              description: "What to avoid in the generated image. Optional.",
            },
            outputDir: {
              type: "string",
              description: `Directory to save images, relative to project root. Default: "${DEFAULT_OUTPUT_DIR}". Images are saved as JPG files.`,
            },
          },
          required: ["prompt"],
        },
      },
    ],
  });
}

async function handleCallTool(id, params) {
  try {
    const { name, arguments: args } = params;

    if (name !== "generate_image") {
      sendError(id, -32601, `Unknown tool: ${name}`);
      return;
    }

    // 1. Generate image URLs via Runware
    const imageUrls = await generateImage(args);

    // 2. Download and save to local project directory
    const cwd = process.cwd();
    const outputDir = args.outputDir || DEFAULT_OUTPUT_DIR;
    const absOutputDir = resolve(cwd, outputDir);
    ensureDir(absOutputDir);

    const baseName = sanitizeFilename(args.prompt);
    const ts = Date.now();
    const results = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const filename = `${baseName}_${ts}_${i + 1}.jpg`;
      const filepath = join(absOutputDir, filename);
      const relPath = join(outputDir, filename);

      logStderr(`Downloading to: ${relPath}`);
      await downloadImage(imageUrls[i], filepath);
      results.push({ url: imageUrls[i], localPath: relPath, absPath: filepath });
      logStderr(`Saved: ${relPath}`);
    }

    // 3. Build response
    const textLines = [
      `Generated ${results.length} image(s), saved to \`${outputDir}/\`:\n`,
      ...results.map((r, i) => `${i + 1}. \`${r.localPath}\` (source: ${r.url})`),
      `\nUse these images in your project: \`${outputDir}/${baseName}_${ts}_*.jpg\``,
    ];

    sendResponse(id, {
      content: [
        {
          type: "text",
          text: textLines.join("\n"),
        },
        // Include each image for visual display in Claude Code
        ...imageUrls.map((url) => ({
          type: "image",
          data: url,
          mimeType: "image/jpeg",
        })),
      ],
    });
  } catch (err) {
    sendResponse(id, {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    });
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  logStderr("Starting Runware MCP server...");

  let buffer = "";

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const msg = JSON.parse(trimmed);
        handleMessage(msg);
      } catch (err) {
        logStderr("Parse error:", err.message, trimmed.slice(0, 100));
      }
    }
  });

  process.stdin.on("end", () => {
    logStderr("Stdin closed, exiting");
    process.exit(0);
  });

  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  if (id === undefined || id === null) {
    if (method === "notifications/initialized") {
      logStderr("Client initialized");
    }
    return;
  }

  switch (method) {
    case "initialize":
      handleInitialize(id, params);
      break;
    case "tools/list":
      handleListTools(id);
      break;
    case "tools/call":
      handleCallTool(id, params);
      break;
    default:
      sendError(id, -32601, `Method not found: ${method}`);
  }
}

main();
