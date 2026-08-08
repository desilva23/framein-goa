import Image from "next/image";
import Link from "next/link";
import { EVENT } from "@/lib/brand";

/**
 * Branded 404.
 *
 * The likeliest way to land here is a mistyped or stale /i/[id] share link, so
 * this is less an error page than a second chance to send someone into the tool.
 */
export default function NotFound() {
  return (
    <main className="hh-grid flex-1 flex flex-col items-center justify-center px-6 py-16 text-center gap-6">
      <Image
        src="/brand/logo-wordmark.png"
        alt="Hacker House"
        width={1148}
        height={237}
        className="w-[min(320px,70vw)] h-auto"
      />

      <p className="hh-display text-[clamp(3.5rem,18vw,7rem)] text-hh-yellow">404</p>

      <div className="space-y-2">
        <p className="text-hh-cream text-base sm:text-lg">
          That frame has drifted out to sea.
        </p>
        <p className="text-hh-cream/65 text-sm max-w-sm mx-auto leading-relaxed">
          The link may be mistyped or the graphic may have been removed. Making a new
          one takes about ten seconds.
        </p>
      </div>

      <Link
        href="/"
        className="rounded-xl bg-hh-yellow text-hh-green-deep font-extrabold py-3 px-7 text-sm hover:brightness-95 active:brightness-90 transition"
      >
        Make your own →
      </Link>

      <p className="text-[11px] tracking-[0.18em] uppercase text-hh-cream/50 mt-2">
        {EVENT.hashtag} · {EVENT.dates}
      </p>
    </main>
  );
}
