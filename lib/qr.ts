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

export type QrTarget = {
  url: string;
  /** Caption printed beside the code, so people know what they're scanning. */
  label: string;
  /** Human-readable form of the destination. */
  display: string;
};

/** GitHub usernames: alphanumerics and single hyphens, up to 39 characters. */
function cleanGithub(value?: string): string | null {
  const v = value?.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "");
  return v && /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(v) ? v : null;
}

/** X handles are ASCII word characters, up to 15. */
function cleanX(value?: string): string | null {
  const v = value?.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?(x|twitter)\.com\//i, "");
  return v && /^\w{1,15}$/.test(v) ? v : null;
}

/**
 * What the badge's QR points at, in priority order: the holder's GitHub, then
 * their X profile, then the event site. GitHub leads because the residency
 * weighs shipped repositories, so that is the most useful thing to scan into.
 */
export function qrTarget(github?: string, xHandle?: string): QrTarget {
  const gh = cleanGithub(github);
  if (gh) {
    return {
      url: `https://github.com/${gh}`,
      label: "SCAN FOR MY CODE",
      display: `GITHUB.COM/${gh}`.toUpperCase(),
    };
  }

  const x = cleanX(xHandle);
  if (x) {
    return { url: `https://x.com/${x}`, label: "FIND ME AT", display: `@${x}` };
  }

  return { url: "https://hhgoa.com", label: "THE RESIDENCY", display: "HHGOA.COM" };
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
