import sharp from "sharp";

const THUMB_SIZE = 400; // px on longest edge

/**
 * Generate a JPEG thumbnail from an image URL or base64 data URL.
 * Returns a base64 data URL of the thumbnail, or null on failure.
 */
export async function generateThumbnail(
  imageUrl: string,
): Promise<string | null> {
  try {
    let buffer: Buffer;

    if (imageUrl.startsWith("data:")) {
      // base64 data URL — strip header and decode
      const base64 = imageUrl.split(",")[1];
      if (!base64) return null;
      buffer = Buffer.from(base64, "base64");
    } else {
      // External URL — fetch with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Resize with sharp — fit within THUMB_SIZE while preserving ratio
    const thumb = await sharp(buffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    return `data:image/jpeg;base64,${thumb.toString("base64")}`;
  } catch (e) {
    console.warn("[thumbnail]", (e as Error).message);
    return null;
  }
}
