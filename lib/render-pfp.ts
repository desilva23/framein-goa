/**
 * Format A — the profile-picture frame.
 *
 * X renders avatars as a circle inscribed in the square, so the branding lives
 * in a ring hugging that circle's edge and the photo runs full-bleed underneath.
 * The corners outside the circle still get filled, because the downloaded PNG is
 * a square that people also post directly.
 */

import { COLORS, EVENT, MONO, THEMES, ThemeName } from "./brand";
import { drawArcText, drawCover, drawTracked, Transform } from "./canvas";

export const PFP_SIZE = 1000;

export type PfpOptions = {
  photo: HTMLCanvasElement | HTMLImageElement;
  transform: Transform;
  theme: ThemeName;
  /** Optional @handle set into the lower ring instead of the dates. */
  handle?: string;
};

/** A rising sun: half-disc plus rays, the site's signature mark. */
export function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
  ctx.fill();

  ctx.lineWidth = Math.max(1.5, radius * 0.16);
  for (let i = 0; i <= 6; i++) {
    const angle = Math.PI + (i / 6) * Math.PI;
    const inner = radius * 1.45;
    const outer = radius * 2.0;
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
    ctx.lineTo(cx + outer * Math.cos(angle), cy + outer * Math.sin(angle));
    ctx.stroke();
  }

  // Waterline under the sun.
  ctx.lineWidth = Math.max(1.2, radius * 0.13);
  ctx.beginPath();
  ctx.moveTo(cx - radius * 1.5, cy + radius * 0.34);
  ctx.lineTo(cx + radius * 1.5, cy + radius * 0.34);
  ctx.stroke();
  ctx.restore();
}

export function renderPfp(canvas: HTMLCanvasElement, opts: PfpOptions) {
  const S = PFP_SIZE;
  const ctx = canvas.getContext("2d")!;
  const theme = THEMES[opts.theme];

  canvas.width = S;
  canvas.height = S;
  ctx.clearRect(0, 0, S, S);
  ctx.imageSmoothingQuality = "high";

  const cx = S / 2;
  const cy = S / 2;
  const R = S / 2;
  const band = 76;

  // Corners outside the avatar circle.
  ctx.fillStyle = theme.band;
  ctx.fillRect(0, 0, S, S);

  // Photo, clipped to the circle so the ring sits flush with no seam.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  drawCover(ctx, opts.photo, 0, 0, S, S, opts.transform);
  ctx.restore();

  // The ring itself: an annulus punched out with the even-odd winding rule.
  ctx.save();
  ctx.fillStyle = theme.band;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2, false);
  ctx.arc(cx, cy, R - band, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();

  // Hairlines top and bottom of the band.
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, R - band + 2.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = theme.edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 5, 0, Math.PI * 2);
  ctx.stroke();

  // Ring copy. Top arc reads left-to-right; bottom arc is flipped to stay upright.
  const textRadius = R - band / 2 - 2;
  ctx.fillStyle = theme.ink;

  ctx.font = `700 40px "${MONO}", ui-monospace, monospace`;
  drawArcText(ctx, "HACKER HOUSE GOA", cx, cy, textRadius, -Math.PI / 2, 7, 1);

  const lower = opts.handle?.trim()
    ? `${opts.handle.trim().replace(/^@?/, "@")} · ${EVENT.datesShort} 26`
    : EVENT.dates;
  ctx.font = `500 30px "${MONO}", ui-monospace, monospace`;
  drawArcText(ctx, lower.toUpperCase(), cx, cy, textRadius, Math.PI / 2, 6, -1);

  // Suns mark the seam between the two arcs.
  drawSun(ctx, cx - textRadius, cy + 8, 15, theme.accent);
  drawSun(ctx, cx + textRadius, cy + 8, 15, theme.accent);

  // Corner tag, visible in the square download that X's circle crop hides.
  ctx.fillStyle = theme.ink;
  ctx.font = `700 21px "${MONO}", ui-monospace, monospace`;
  ctx.textBaseline = "alphabetic";
  drawTracked(ctx, EVENT.hashtag.toUpperCase(), S - 24, S - 24, 3, "right");
}

/** Flat colour behind the ring, used by the editor's checkerboard-free preview. */
export const PFP_BACKDROP = COLORS.green;
