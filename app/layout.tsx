import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Frame in Goa — Hacker House Goa 2026",
  description:
    "Drop a photo, get a Hacker House Goa 2026 profile frame or builder ID card. Download it, post it, #FrameInGoa.",
  icons: { icon: "/brand/favicon.webp" },
  openGraph: {
    title: "Frame in Goa — Hacker House Goa 2026",
    description:
      "Drop a photo, get a Hacker House Goa 2026 profile frame or builder ID card.",
    url: siteUrl(),
    siteName: "Frame in Goa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frame in Goa — Hacker House Goa 2026",
    description:
      "Drop a photo, get a Hacker House Goa 2026 profile frame or builder ID card.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6839",
  width: "device-width",
  initialScale: 1,
  // The editor pans photos by drag; letting the page zoom underneath fights it.
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Loaded by literal family name so the canvas renderers can request
            "Imbue" / "Victor Mono" directly in ctx.font. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Imbue:opsz,wght@10..100,400..900&family=Victor+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
