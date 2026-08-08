# Frame in Goa — Hacker House Goa 2026

A one-pass tool for the `#FrameInGoa` campaign: drop a photo, get a branded
HH Goa 2026 graphic back in a couple of seconds, download it, post it to X.
No login, no signup, no watermark paywall.

Two formats, one upload:

- **Profile frame** — a ring that wraps the photo for use as an X avatar, in
  three colourways. The photo runs full-bleed under a branded ring, so it still
  reads once X crops the square to a circle.
- **Builder ID** — a 4:5 event badge with the photo, name, stack/role, a
  generated builder title, and a badge number in the cohort's 001–247 range.

## How it works

Everything renders client-side on `<canvas>`, so there is no server round-trip
between adjusting a field and seeing the result — the preview updates as you
type and the download is a real 1000×1000 or 1200×1500 PNG.

Photos are normalised once at upload (`lib/photo.ts`): HEIC is converted via
`heic2any`, EXIF rotation is baked in, and anything over 2400px is downscaled so
re-renders stay instant. Any aspect ratio works — the renderers cover-fit and
the user pans/zooms from there, so nobody has to pre-crop.

### The share flow

X's tweet intent cannot attach an image, so there are two paths:

1. **Phones** — the Web Share API shares the PNG itself into the X app.
2. **Everywhere** — the PNG is uploaded to Vercel Blob and X opens with a link
   to `/i/[id]`, whose OG tags point at that image.

Because X crops link previews to roughly 1.91:1, `/i/[id]` does **not** serve the
raw 1:1 or 4:5 graphic. `lib/render-og.ts` composites it onto a branded 1200×630
plate first, so the preview shows the actual generated artwork rather than a
cropped or blank thumbnail.

## Brand

Colours, typefaces, and illustrations are taken from
[hhgoa.com](https://hhgoa.com): deep green `#0b6839`, sun yellow `#fee101`,
bougainvillea pink `#ff0080`, cream `#fffbe8`, with Imbue for display and
Victor Mono for everything else. Tokens live in `lib/brand.ts`; the artwork is
in `public/brand/`.

## Running locally

```bash
npm install
npm run dev   # http://localhost:3100
```

The dev port is pinned to 3100 so it doesn't collide with anything already on
3000.

Sharing-by-link needs a Vercel Blob store. Without one the app still uploads
nothing and works end to end — upload, render, and download all run offline, and
the share button falls back to asking you to attach the downloaded file.

```bash
# .env.local
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
NEXT_PUBLIC_SITE_URL=https://your-deployment.vercel.app
```

`NEXT_PUBLIC_SITE_URL` is optional on Vercel — it falls back to the deployment
URL Vercel injects. Set it only if you use a custom domain.

## Layout

```
app/
  page.tsx              landing + studio
  i/[id]/page.tsx       share page, per-image OG tags
  api/upload/route.ts   PNG -> Vercel Blob
  opengraph-image.tsx   homepage preview
lib/
  brand.ts              colours, fonts, event copy
  photo.ts              HEIC / EXIF / downscale
  canvas.ts             cover-fit, arc text, letter-spacing
  render-pfp.ts         format A
  render-card.ts        format B
  render-og.ts          1200x630 share plate
  titles.ts             deterministic builder titles
```
