import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 20;

/** Generated PNGs are well under this; the cap just stops abuse. */
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "Sharing storage isn't configured on this deployment." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Malformed upload." }, { status: 400 });
  }

  const image = form.get("image");
  const og = form.get("og");
  if (!(image instanceof Blob) || !(og instanceof Blob)) {
    return Response.json({ error: "Both image and og are required." }, { status: 400 });
  }
  if (image.size > MAX_BYTES || og.size > MAX_BYTES) {
    return Response.json({ error: "Image too large." }, { status: 413 });
  }

  const id = nanoid(10);

  try {
    const [full, preview] = await Promise.all([
      put(`s/${id}.png`, image, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
        cacheControlMaxAge: 31_536_000,
      }),
      put(`s/${id}-og.png`, og, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
        cacheControlMaxAge: 31_536_000,
      }),
    ]);

    return Response.json({
      id,
      imageUrl: full.url,
      ogUrl: preview.url,
      pageUrl: `${siteUrl()}/i/${id}`,
    });
  } catch {
    return Response.json({ error: "Upload failed." }, { status: 500 });
  }
}
