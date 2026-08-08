/** Loads and caches the brand artwork the renderers composite in. */

import { loadImage } from "./canvas";

const cache = new Map<string, Promise<HTMLImageElement>>();

export function asset(path: string): Promise<HTMLImageElement> {
  let pending = cache.get(path);
  if (!pending) {
    pending = loadImage(path);
    cache.set(path, pending);
  }
  return pending;
}

export const ASSETS = {
  wordmark: "/brand/logo-wordmark.png",
  trees: "/brand/trees.png",
  sunrise: "/brand/sunrise.png",
  goaHindi: "/brand/goa-hindi.svg",
} as const;

/** Warm the cache so the first render doesn't wait on the network. */
export function preloadBrand(): Promise<unknown> {
  return Promise.all(Object.values(ASSETS).map((p) => asset(p).catch(() => null)));
}

const tintCache = new Map<string, HTMLCanvasElement>();

/**
 * Recolour an image to a flat colour, keeping its alpha. Lets us reuse the
 * site's SVG marks in whichever brand colour a given layout needs.
 */
export function tinted(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const key = `${img.src}|${color}`;
  const hit = tintCache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  tintCache.set(key, canvas);
  return canvas;
}
