/**
 * Format B — the builder ID card.
 *
 * A 4:5 badge sized for a timeline post rather than a lanyard: cream stock, a
 * green header carrying the Hacker House wordmark, and the site's own palm
 * illustration running along the bottom edge.
 */

import { COLORS, DISPLAY, EVENT, MONO } from "./brand";
import { ASSETS, asset } from "./assets";
import { drawSun } from "./render-pfp";
import {
  drawCover,
  drawTracked,
  fitFontSize,
  roundRectPath,
  trackedWidth,
  Transform,
} from "./canvas";
import { builderNumber, builderTitle } from "./titles";

export const CARD_W = 1200;
export const CARD_H = 1500;

export type CardOptions = {
  photo: HTMLCanvasElement | HTMLImageElement;
  transform: Transform;
  name: string;
  role: string;
  /** Increments when the user rerolls, changing the generated title. */
  salt?: number;
};

const CARD = { x: 56, y: 56, w: 1088, h: 1388, r: 48 };
const HEADER_BOTTOM = 380;
const PHOTO = { x: 300, y: 412, size: 600, r: 28 };
const BAND_TOP = 1268;

export async function renderCard(canvas: HTMLCanvasElement, opts: CardOptions) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "alphabetic";

  const name = opts.name.trim() || "YOUR NAME";
  const role = opts.role.trim() || "BUILDER";
  const title = builderTitle(name, role, opts.salt ?? 0);
  const number = builderNumber(name, role, opts.salt ?? 0);

  const [wordmark, trees] = await Promise.all([
    asset(ASSETS.wordmark).catch(() => null),
    asset(ASSETS.trees).catch(() => null),
  ]);

  // Backdrop just outside the card, so the PNG has no transparent margin.
  ctx.fillStyle = COLORS.greenDeep;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Card stock.
  ctx.save();
  roundRectPath(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.clip();

  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);

  // --- Header -------------------------------------------------------------
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(CARD.x, CARD.y, CARD.w, HEADER_BOTTOM - CARD.y);

  // Lanyard slot: the one cue that says "badge" before you read anything.
  ctx.fillStyle = COLORS.cream;
  roundRectPath(ctx, CARD_W / 2 - 92, 100, 184, 24, 12);
  ctx.fill();

  if (wordmark) {
    const w = 470;
    const h = (w * wordmark.naturalHeight) / wordmark.naturalWidth;
    ctx.drawImage(wordmark, (CARD_W - w) / 2, 156, w, h);
  } else {
    ctx.fillStyle = COLORS.yellow;
    ctx.font = `900 92px "${DISPLAY}", serif`;
    ctx.textAlign = "center";
    ctx.fillText(EVENT.name, CARD_W / 2, 250);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = COLORS.yellow;
  ctx.font = `700 38px "${MONO}", ui-monospace, monospace`;
  drawTracked(ctx, EVENT.place, CARD_W / 2, 306, 18, "center");

  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 24px "${MONO}", ui-monospace, monospace`;
  drawTracked(ctx, EVENT.dates, CARD_W / 2, 348, 8, "center");

  // --- Photo --------------------------------------------------------------
  ctx.save();
  roundRectPath(ctx, PHOTO.x, PHOTO.y, PHOTO.size, PHOTO.size, PHOTO.r);
  ctx.clip();
  drawCover(ctx, opts.photo, PHOTO.x, PHOTO.y, PHOTO.size, PHOTO.size, opts.transform);
  ctx.restore();

  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 8;
  roundRectPath(ctx, PHOTO.x + 4, PHOTO.y + 4, PHOTO.size - 8, PHOTO.size - 8, PHOTO.r - 4);
  ctx.stroke();

  // Badge number, tucked over the photo's top-left corner.
  ctx.font = `700 26px "${MONO}", ui-monospace, monospace`;
  const numText = `No. ${number}`;
  const numW = trackedWidth(ctx, numText, 3) + 44;
  ctx.fillStyle = COLORS.green;
  roundRectPath(ctx, PHOTO.x - 14, PHOTO.y - 20, numW, 56, 28);
  ctx.fill();
  ctx.fillStyle = COLORS.yellow;
  drawTracked(ctx, numText, PHOTO.x - 14 + 22, PHOTO.y + 16, 3, "left");

  // Sunrise sticker, balancing the badge number across the photo's top edge.
  const scx = PHOTO.x + PHOTO.size + 4;
  const scy = PHOTO.y - 4;
  ctx.save();
  ctx.fillStyle = COLORS.yellow;
  ctx.beginPath();
  ctx.arc(scx, scy, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 5;
  ctx.stroke();
  drawSun(ctx, scx, scy + 14, 17, COLORS.green);
  ctx.restore();

  // --- Identity -----------------------------------------------------------
  ctx.textAlign = "center";

  ctx.fillStyle = COLORS.green;
  fitFontSize(
    ctx,
    name.toUpperCase(),
    980,
    112,
    (s) => `900 ${s}px "${DISPLAY}", serif`,
    44,
  );
  ctx.fillText(name.toUpperCase(), CARD_W / 2, 1116);
  ctx.textAlign = "left";

  ctx.fillStyle = COLORS.black;
  const roleSize = fitFontSize(
    ctx,
    role.toUpperCase(),
    900,
    32,
    (s) => `500 ${s}px "${MONO}", ui-monospace, monospace`,
    16,
  );
  drawTracked(ctx, role.toUpperCase(), CARD_W / 2, 1166, roleSize * 0.22, "center");

  // Generated title, in a pink pill.
  ctx.font = `700 30px "${MONO}", ui-monospace, monospace`;
  const titleText = title.toUpperCase();
  const pillTextW = trackedWidth(ctx, titleText, 4);
  const pillW = Math.min(pillTextW + 88, 1000);
  ctx.fillStyle = COLORS.pink;
  roundRectPath(ctx, (CARD_W - pillW) / 2, 1188, pillW, 64, 32);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  drawTracked(ctx, titleText, CARD_W / 2, 1229, 4, "center");

  // --- Palm band ----------------------------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.rect(CARD.x, BAND_TOP, CARD.w, CARD.y + CARD.h - BAND_TOP);
  ctx.clip();
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(CARD.x, BAND_TOP, CARD.w, CARD.y + CARD.h - BAND_TOP);
  if (trees) {
    // Anchor to the bottom of the illustration so the bougainvillea strip shows
    // rather than a flat slice of sky. clampTransform pins the large offset.
    drawCover(ctx, trees, CARD.x, BAND_TOP, CARD.w, CARD.y + CARD.h - BAND_TOP, {
      zoom: 1.5,
      x: 0,
      y: -100000,
    });
  }
  ctx.restore();

  // Legibility plate, so the strapline reads over the illustration.
  ctx.font = `700 25px "${MONO}", ui-monospace, monospace`;
  const strap = `${EVENT.hashtag.toUpperCase()}  ·  ${EVENT.site.toUpperCase()}`;
  const strapW = trackedWidth(ctx, strap, 5);
  ctx.fillStyle = COLORS.greenDeep;
  roundRectPath(ctx, (CARD_W - strapW) / 2 - 30, BAND_TOP + 32, strapW + 60, 52, 26);
  ctx.fill();

  ctx.fillStyle = COLORS.yellow;
  drawTracked(ctx, strap, CARD_W / 2, BAND_TOP + 67, 5, "center");

  ctx.restore();
}
