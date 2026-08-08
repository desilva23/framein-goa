/**
 * Turns whatever a phone hands us into a plain, correctly-oriented canvas.
 *
 * Three things make real uploads awkward: iPhones send HEIC, most cameras
 * record rotation in EXIF rather than in the pixels, and a modern phone photo
 * is ~12 MP — far more than we need for a 1200px card, and big enough to make
 * every re-render feel sluggish. This normalises all three, once, at upload.
 */

/** Longest edge we keep. Comfortably above the largest box either renderer draws. */
const MAX_EDGE = 2400;

export type DecodedPhoto = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  // iOS sometimes reports an empty MIME type, so fall back to the extension.
  return /\.(heic|heif)$/i.test(file.name);
}

async function toBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  // `from-image` applies EXIF rotation for us where supported.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Older Safari rejects the options bag — fall through to the <img> path.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file isn't an image we can read."));
      img.src = url;
    });
  } finally {
    // Safari needs the URL alive until decode finishes; a task turn is enough.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

export async function decodePhoto(file: File): Promise<DecodedPhoto> {
  let source: Blob = file;

  if (isHeic(file)) {
    // ~600 KB of wasm-ish decoder — only pay for it when the file is actually HEIC.
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    source = Array.isArray(converted) ? converted[0] : (converted as Blob);
  }

  const bitmap = await toBitmap(source);
  const srcW = "width" in bitmap ? bitmap.width : 0;
  const srcH = "height" in bitmap ? bitmap.height : 0;
  if (!srcW || !srcH) throw new Error("That image looks empty or corrupted.");

  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser blocked canvas rendering.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);

  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  return { canvas, width, height };
}
