/**
 * Builds the 1200×630 link-preview image.
 *
 * X crops OG images to roughly 1.91:1 in the timeline. A 1:1 frame or a 4:5 card
 * dropped in raw would get its top and bottom sliced off, so instead we letterbox
 * the artwork onto a branded 1200×630 plate and hand X something already the
 * right shape.
 */

import { COLORS, EVENT, MONO } from "./brand";
import { ASSETS, asset } from "./assets";
import { drawTracked, roundRectPath } from "./canvas";

export const OG_W = 1200;
export const OG_H = 630;

export async function renderOg(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
): Promise<void> {
  const ctx = target.getContext("2d")!;
  target.width = OG_W;
  target.height = OG_H;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = COLORS.green;
  ctx.fillRect(0, 0, OG_W, OG_H);

  // Horizon grid, matching the site's vector treatment.
  ctx.strokeStyle = "rgba(255,251,232,0.08)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= OG_W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, OG_H);
    ctx.stroke();
  }
  for (let y = 0; y <= OG_H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(OG_W, y);
    ctx.stroke();
  }

  // Artwork, right-aligned and fitted to the plate height.
  const pad = 40;
  const maxH = OG_H - pad * 2;
  const scale = maxH / source.height;
  const artW = source.width * scale;
  const artH = maxH;
  const artX = OG_W - pad - artW;
  const artY = pad;

  ctx.save();
  roundRectPath(ctx, artX, artY, artW, artH, 20);
  ctx.clip();
  ctx.drawImage(source, artX, artY, artW, artH);
  ctx.restore();

  // Copy block fills the space the artwork's aspect ratio leaves behind.
  const textRight = artX - 44;
  const textLeft = 56;
  const available = Math.max(0, textRight - textLeft);

  if (available > 180) {
    const wordmark = await asset(ASSETS.wordmark).catch(() => null);
    if (wordmark) {
      const w = Math.min(available, 420);
      const h = (w * wordmark.naturalHeight) / wordmark.naturalWidth;
      ctx.drawImage(wordmark, textLeft, 214, w, h);
    }

    ctx.fillStyle = COLORS.yellow;
    ctx.font = `700 46px "${MONO}", ui-monospace, monospace`;
    drawTracked(ctx, EVENT.place, textLeft, 372, 16, "left");

    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 22px "${MONO}", ui-monospace, monospace`;
    drawTracked(ctx, EVENT.dates, textLeft, 412, 6, "left");

    ctx.fillStyle = COLORS.pink;
    ctx.font = `700 24px "${MONO}", ui-monospace, monospace`;
    drawTracked(ctx, EVENT.hashtag.toUpperCase(), textLeft, 462, 4, "left");
  }
}
