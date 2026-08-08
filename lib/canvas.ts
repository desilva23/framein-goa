/** Low-level canvas helpers shared by both renderers. */

import { FONT_PRELOAD } from "./brand";

export type Transform = {
  /** 1 = the photo exactly covers the frame; higher zooms in. */
  zoom: number;
  /** Pan, in destination pixels, applied after centring. */
  x: number;
  y: number;
};

export const IDENTITY: Transform = { zoom: 1, x: 0, y: 0 };

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

/** Resolves once every font the renderers use is actually available to canvas. */
export async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all(FONT_PRELOAD.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } catch {
    // A missing webfont should degrade to a fallback, never block the render.
  }
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Clamp a pan offset so the photo never exposes a gap at the edge of its frame.
 * Returned in the same units as `Transform.x` / `.y`.
 */
export function clampTransform(
  img: { width: number; height: number },
  boxW: number,
  boxH: number,
  t: Transform,
): Transform {
  const base = Math.max(boxW / img.width, boxH / img.height);
  const scale = base * t.zoom;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const slackX = Math.max(0, (drawW - boxW) / 2);
  const slackY = Math.max(0, (drawH - boxH) / 2);
  return {
    zoom: t.zoom,
    x: Math.max(-slackX, Math.min(slackX, t.x)),
    y: Math.max(-slackY, Math.min(slackY, t.y)),
  };
}

/**
 * Draw `img` so it covers the box completely, honouring the user's pan/zoom.
 * Any aspect ratio works — portrait, landscape, panorama — without pre-cropping.
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  t: Transform = IDENTITY,
) {
  const clamped = clampTransform(img, w, h, t);
  const base = Math.max(w / img.width, h / img.height);
  const scale = base * clamped.zoom;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = x + (w - drawW) / 2 + clamped.x;
  const dy = y + (h - drawH) / 2 + clamped.y;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

/** Measure a string drawn with manual letter-spacing. */
export function trackedWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  spacing: number,
): number {
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + spacing;
  return total - spacing;
}

/** Draw text with manual letter-spacing, since canvas `letterSpacing` is uneven across browsers. */
export function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "center" | "right" = "left",
) {
  const width = trackedWidth(ctx, text, spacing);
  let cursor = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = prevAlign;
}

/**
 * Lay text around a circle. `sweep` of 1 runs clockwise (readable along the top
 * of the ring); -1 runs anticlockwise (readable along the bottom).
 */
export function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  centerAngle: number,
  spacing: number,
  sweep: 1 | -1 = 1,
) {
  const chars = [...text];
  // Angular width of each glyph, so proportional text stays evenly spaced.
  const widths = chars.map((c) => ctx.measureText(c).width + spacing);
  const totalArc = widths.reduce((sum, w) => sum + w, 0) / radius;

  let angle = centerAngle - (sweep * totalArc) / 2;
  const prevAlign = ctx.textAlign;
  const prevBaseline = ctx.textBaseline;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < chars.length; i++) {
    const step = widths[i] / radius;
    const at = angle + (sweep * step) / 2;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(at), cy + radius * Math.sin(at));
    // Glyph baseline sits tangent to the circle; flip it when running along the bottom.
    ctx.rotate(at + (sweep === 1 ? Math.PI / 2 : -Math.PI / 2));
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    angle += sweep * step;
  }

  ctx.textAlign = prevAlign;
  ctx.textBaseline = prevBaseline;
}

/** Shrink `font` until `text` fits `maxWidth`. Returns the size actually used. */
export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  fontFor: (size: number) => string,
  minSize = 12,
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = fontFor(size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.font = fontFor(size);
  return size;
}

/** Canvas → PNG Blob. */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/png",
    );
  });
}
