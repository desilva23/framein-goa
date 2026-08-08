import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { list } from "@vercel/blob";
import { siteUrl, SHARE_TEXT } from "@/lib/site";

/** Blobs are immutable once written, so this page can cache hard. */
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

async function resolveShare(id: string) {
  if (!/^[A-Za-z0-9_-]{6,24}$/.test(id)) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  try {
    const { blobs } = await list({ prefix: `s/${id}`, limit: 4 });
    const full = blobs.find((b) => b.pathname === `s/${id}.png`);
    const og = blobs.find((b) => b.pathname === `s/${id}-og.png`);
    if (!full) return null;
    return { imageUrl: full.url, ogUrl: og?.url ?? full.url };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const share = await resolveShare(id);

  const title = "Frame in Goa — Hacker House Goa 2026";
  const description =
    "Made with the HH Goa 2026 frame generator. Drop a photo, get yours in seconds.";

  if (!share) return { title, description };

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}/i/${id}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl()}/i/${id}`,
      siteName: "Frame in Goa",
      type: "website",
      images: [{ url: share.ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [share.ogUrl],
    },
  };
}

export default async function SharePage({ params }: Params) {
  const { id } = await params;
  const share = await resolveShare(id);
  if (!share) notFound();

  const intent = new URL("https://x.com/intent/post");
  intent.searchParams.set("text", SHARE_TEXT);
  intent.searchParams.set("url", `${siteUrl()}/i/${id}`);
  intent.searchParams.set("hashtags", "FrameInGoa");

  return (
    <main className="hh-grid flex-1 flex flex-col items-center justify-center px-4 py-12 gap-8">
      <img
        src={share.imageUrl}
        alt="Hacker House Goa 2026 graphic"
        className="max-h-[68vh] w-auto max-w-full rounded-2xl shadow-2xl"
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={share.imageUrl}
          download={`hh-goa-2026-${id}.png`}
          className="rounded-xl bg-hh-yellow text-hh-green-deep font-extrabold py-3 px-6 text-sm"
        >
          Download
        </a>
        <a
          href={intent.toString()}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border-2 border-hh-cream/35 font-bold py-3 px-6 text-sm hover:border-hh-yellow hover:text-hh-yellow transition-colors"
        >
          Post to X
        </a>
        <Link
          href="/"
          className="rounded-xl border-2 border-hh-cream/35 font-bold py-3 px-6 text-sm hover:border-hh-yellow hover:text-hh-yellow transition-colors"
        >
          Make your own
        </Link>
      </div>

      <p className="text-xs text-hh-cream/55 tracking-[0.18em] uppercase">
        #FrameInGoa · 28–31 Oct 2026
      </p>
    </main>
  );
}
