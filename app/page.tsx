import Image from "next/image";
import Studio from "@/components/Studio";
import { EVENT } from "@/lib/brand";

export default function Home() {
  return (
    <main className="hh-grid flex-1">
      <header className="max-w-5xl mx-auto px-4 pt-10 sm:pt-16 pb-8 text-center">
        <Image
          src="/brand/logo-wordmark.png"
          alt="Hacker House"
          width={1148}
          height={237}
          priority
          className="mx-auto w-[min(420px,80vw)] h-auto"
        />

        <p className="mt-3 text-hh-yellow font-bold tracking-[0.42em] text-lg sm:text-2xl pl-[0.42em]">
          {EVENT.place}
        </p>
        <p className="mt-1 text-hh-cream/70 text-[11px] sm:text-xs tracking-[0.24em]">
          {EVENT.dates} · {EVENT.tagline}
        </p>

        <h1 className="hh-display mt-8 text-[clamp(3.2rem,15vw,7.5rem)] text-hh-cream">
          FRAME IN GOA
        </h1>

        <p className="mt-4 mx-auto max-w-lg text-sm sm:text-base text-hh-cream/80 leading-relaxed">
          Drop a photo. Get a Hacker House Goa 2026 profile frame or builder ID card
          back in seconds — no login, no signup, no watermark paywall.
        </p>

        <p className="mt-3 inline-block rounded-full bg-hh-pink px-4 py-1.5 text-xs font-bold tracking-wide">
          {EVENT.hashtag}
        </p>
      </header>

      <Studio />

      <footer className="relative mt-10">
        <Image
          src="/brand/trees.png"
          alt=""
          width={1440}
          height={887}
          className="w-full h-[180px] sm:h-[260px] object-cover object-top"
        />
        <div className="bg-hh-green-deep px-4 py-6 text-center text-[11px] tracking-[0.18em] text-hh-cream/60 uppercase">
          Built for {EVENT.name} {EVENT.place} {EVENT.year} ·{" "}
          <a
            href="https://hhgoa.com"
            target="_blank"
            rel="noreferrer"
            className="text-hh-yellow hover:underline"
          >
            {EVENT.site}
          </a>
        </div>
      </footer>
    </main>
  );
}
