/**
 * QR codes for the builder ID.
 *
 * The badge encodes wherever the holder can actually be found — their X profile
 * when they've given a handle, the event site otherwise — so scanning a posted
 * card leads somewhere useful rather than back at the generator.
 */

import QRCode from "qrcode";
import { COLORS } from "./brand";

const cache = new Map<string, HTMLCanvasElement>();

export function qrTarget(handle?: string): string {
  const clean = handle?.trim().replace(/^@/, "");
  // X handles are ASCII word characters only; anything else is user noise.
  if (clean && /^\w{1,15}$/.test(clean)) return `https://x.com/${clean}`;
  return "https://hhgoa.com";
}

/**
 * Render `text` to an offscreen canvas in brand colours. Synchronous callers
 * (the card renderer) get a cached canvas; the first call must be awaited.
 */
export async function qrCanvas(text: string, size = 256): Promise<HTMLCanvasElement> {
  const key = `${text}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: COLORS.greenDeep,
      light: COLORS.cream,
    },
  });

  cache.set(key, canvas);
  return canvas;
}
