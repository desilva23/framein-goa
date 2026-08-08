/**
 * Absolute base URL for the deployment.
 *
 * Open Graph tags must carry absolute URLs or X will show a blank preview, and
 * the value differs between local dev, Vercel previews, and production.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

/**
 * LinkedIn's share endpoint takes only a URL — it dropped prefilled title and
 * summary parameters years ago and ignores them now. The preview LinkedIn shows
 * is pulled from the target page's Open Graph tags, which is why /i/[id] serves
 * the generated graphic as its og:image.
 */
export function linkedInShareUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}

export const SHARE_TEXT =
  "I'm framed up for Hacker House Goa 2026 🌴 247 builders, one beach, four days. Make yours:";
