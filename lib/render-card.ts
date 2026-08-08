/**
 * Format B — the builder ID card.
 *
 * A 4:5 badge sized for a timeline post rather than a lanyard: cream stock, a
 * green header carrying the Hacker House wordmark, and the site's own palm
 * illustration running along the bottom edge. The lower strip carries a QR to
 * wherever the holder can be reached, so a posted card is actually actionable.
 */

import { COLORS, DISPLAY, EVENT, MONO } from "./brand";
import { ASSETS, asset } from "./assets";
import {
  drawCover,
  drawTracked,
  fitFontSize,
  roundRectPath,
  trackedWidth,
  Transform,
} from "./canvas";
import { drawSun } from "./render-pfp";
import { builderNumber, builderTitle } from "./titles";
import { qrCanvas, qrTarget } from "./qr";

export const CARD_W = 1200;
export const CARD_H = 1500;

export type CardOptions = {
  photo: HTMLCanvasElement | HTMLImageElement;
  transform: Transform;
  name: string;
  role: string;
  /** X handle, without the @. Printed on the card; QR falls back to it. */
  handle?: string;
  /** GitHub username. Preferred QR target. */
  github?: string;
  /** Free-text "what you're building right now". */
  shipping?: string;
  /** User-supplied title; falls back to the generated one when blank. */
  title?: string;
  /** Increments when the user rerolls, changing the generated title. */
  salt?: number;
};

const CARD = { x: 56, y: 56, w: 1088, h: 1388, r: 48 };
const HEADER_BOTTOM = 380;
const PHOTO = { x: 320, y: 400, size: 560, r: 28 };
const INFO_TOP = 1200;
const QR_SIZE = 96;
const BAND_TOP = 1320;

export async function renderCard(canvas: HTMLCanvasElement, opts: CardOptions) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "alphabetic";

  const name = opts.name.trim() || "YOUR NAME";
  const role = opts.role.trim() || "BUILDER";
  const handle = opts.handle?.trim().replace(/^@/, "") ?? "";
  const shipping = opts.shipping?.trim() ?? "";
  const target = qrTarget(opts.github, handle);
  const title = opts.title?.trim() || builderTitle(name, role, opts.salt ?? 0);
  const number = builderNumber(name, role, opts.salt ?? 0);

  const [wordmark, trees, qr] = await Promise.all([
    asset(ASSETS.wordmark).catch(() => null),
    asset(ASSETS.trees).catch(() => null),
    qrCanvas(target.url, 256).catch(() => null),
  ]);

  ctx.fillStyle = COLORS.greenDeep;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.save();
  roundRectPath(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.clip();

  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);

  // --- Header -------------------------------------------------------------
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(CARD.x, CARD.y, CARD.w, HEADER_BOTTOM - CARD.y);

  ctx.fillStyle = COLORS.cream;
  roundRectPath(ctx, CARD_W / 2 - 92, 100, 184, 24, 12);
  ctx.fill();

  if (wordmark) {
    const w = 470;
    const h = (w * wordmark.naturalHeight) / wordmark.naturalWidth;
    ctx.drawImage(wordmark, (CARD_W - w) / 2, 152, w, h);
  } else {
    ctx.fillStyle = COLORS.yellow;
    ctx.font = `900 92px "${DISPLAY}", serif`;
    ctx.textAlign = "center";
    ctx.fillText(EVENT.name, CARD_W / 2, 246);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = COLORS.yellow;
  ctx.font = `700 38px "${MONO}", ui-monospace, monospace`;
  drawTracked(ctx, EVENT.place, CARD_W / 2, 302, 18, "center");

  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 24px "${MONO}", ui-monospace, monospace`;
  drawTracked(ctx, EVENT.dates, CARD_W / 2, 344, 8, "center");

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

  ctx.font = `700 26px "${MONO}", ui-monospace, monospace`;
  const numText = `No. ${number}`;
  const numW = trackedWidth(ctx, numText, 3) + 44;
  ctx.fillStyle = COLORS.green;
  roundRectPath(ctx, PHOTO.x - 14, PHOTO.y - 20, numW, 56, 28);
  ctx.fill();
  ctx.fillStyle = COLORS.yellow;
  drawTracked(ctx, numText, PHOTO.x - 14 + 22, PHOTO.y + 16, 3, "left");

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
  fitFontSize(ctx, name.toUpperCase(), 980, 104, (s) => `900 ${s}px "${DISPLAY}", serif`, 44);
  ctx.fillText(name.toUpperCase(), CARD_W / 2, 1046);
  ctx.textAlign = "left";

  ctx.fillStyle = COLORS.black;
  const roleSize = fitFontSize(
    ctx,
    role.toUpperCase(),
    900,
    30,
    (s) => `500 ${s}px "${MONO}", ui-monospace, monospace`,
    16,
  );
  drawTracked(ctx, role.toUpperCase(), CARD_W / 2, 1090, roleSize * 0.22, "center");

  // Generated (or user-chosen) title, in a pink pill.
  ctx.font = `700 28px "${MONO}", ui-monospace, monospace`;
  const titleText = title.toUpperCase();
  const pillTextW = trackedWidth(ctx, titleText, 4);
  const pillW = Math.min(pillTextW + 84, 1000);
  ctx.fillStyle = COLORS.pink;
  roundRectPath(ctx, (CARD_W - pillW) / 2, 1112, pillW, 62, 31);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  drawTracked(ctx, titleText, CARD_W / 2, 1152, 4, "center");

  // --- QR + contact strip -------------------------------------------------
  const qrX = 116;
  if (qr) {
    // Quiet zone, so the code still scans against the cream stock.
    ctx.fillStyle = COLORS.cream;
    roundRectPath(ctx, qrX - 8, INFO_TOP - 8, QR_SIZE + 16, QR_SIZE + 16, 12);
    ctx.fill();
    ctx.drawImage(qr, qrX, INFO_TOP, QR_SIZE, QR_SIZE);
  }

  const textX = qrX + QR_SIZE + 30;
  const label = (text: string, y: number) => {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.font = `500 15px "${MONO}", ui-monospace, monospace`;
    drawTracked(ctx, text, textX, y, 3, "left");
  };
  const value = (text: string, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    const s = fitFontSize(
      ctx,
      text,
      CARD.x + CARD.w - 60 - textX,
      size,
      (v) => `700 ${v}px "${MONO}", ui-monospace, monospace`,
      14,
    );
    drawTracked(ctx, text, textX, y, s * 0.06, "left");
  };

  // First row always describes the QR, so the caption matches what scanning does.
  const rows = [{ label: target.label, value: target.display }];
  if (shipping) {
    // Prose, so it keeps whatever casing the user typed.
    rows.push({ label: "CURRENTLY SHIPPING", value: shipping });
  } else if (handle && !target.display.startsWith("@")) {
    // QR went to GitHub, so the X handle still gets its own line.
    rows.push({ label: "FIND ME AT", value: `@${handle}`.toLowerCase() });
  }

  if (rows.length === 2) {
    label(rows[0].label, INFO_TOP + 16);
    value(rows[0].value, INFO_TOP + 46, 27, COLORS.green);
    label(rows[1].label, INFO_TOP + 72);
    value(rows[1].value, INFO_TOP + 98, 23, COLORS.black);
  } else {
    label(rows[0].label, INFO_TOP + 30);
    value(rows[0].value, INFO_TOP + 68, 32, COLORS.green);
  }

  // --- Palm band ----------------------------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.rect(CARD.x, BAND_TOP, CARD.w, CARD.y + CARD.h - BAND_TOP);
  ctx.clip();
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(CARD.x, BAND_TOP, CARD.w, CARD.y + CARD.h - BAND_TOP);
  if (trees) {
    drawCover(ctx, trees, CARD.x, BAND_TOP, CARD.w, CARD.y + CARD.h - BAND_TOP, {
      zoom: 1.5,
      x: 0,
      y: -100000,
    });
  }
  ctx.restore();

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
