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

export const SHARE_TEXT =
  "I'm framed up for Hacker House Goa 2026 🌴 247 builders, one beach, four days. Make yours:";
