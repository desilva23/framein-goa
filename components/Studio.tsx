"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { THEMES, ThemeName } from "@/lib/brand";
import { canvasToBlob, clampTransform, ensureFonts, Transform } from "@/lib/canvas";
import { preloadBrand } from "@/lib/assets";
import { decodePhoto, type DecodedPhoto } from "@/lib/photo";
import { PFP_SIZE, renderPfp } from "@/lib/render-pfp";
import { CARD_H, CARD_W, renderCard } from "@/lib/render-card";
import { builderTitle } from "@/lib/titles";
import { renderOg } from "@/lib/render-og";
import { linkedInShareUrl, SHARE_TEXT } from "@/lib/site";

type Mode = "pfp" | "card";

const ACCEPT = "image/*,.heic,.heif";

export default function Studio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Latest exported PNG, kept ready so share() can run inside the click gesture. */
  const blobRef = useRef<Blob | null>(null);

  const [photo, setPhoto] = useState<DecodedPhoto | null>(null);
  const [mode, setMode] = useState<Mode>("pfp");
  const [transform, setTransform] = useState<Transform>({ zoom: 1, x: 0, y: 0 });
  const [theme, setTheme] = useState<ThemeName>("sunrise");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [handle, setHandle] = useState("");
  const [github, setGithub] = useState("");
  const [shipping, setShipping] = useState("");
  /** Blank means "use the generated title"; typing overrides it. */
  const [titleOverride, setTitleOverride] = useState("");
  const [salt, setSalt] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preparing, setPreparing] = useState(false);
  /** Set once the graphic is uploaded and an X compose link exists. */
  const [share, setShare] = useState<{ pageUrl: string; intentUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const title = useMemo(
    () => builderTitle(name || "Your Name", role || "Builder", salt),
    [name, role, salt],
  );

  useEffect(() => {
    preloadBrand();
    ensureFonts();
    // Feature-detect once; iOS/Android get the native sheet, desktop gets the link flow.
    try {
      const probe = new File([new Blob(["x"])], "probe.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const openFile = useCallback(async (file: File) => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const decoded = await decodePhoto(file);
      setPhoto(decoded);
      setTransform({ zoom: 1, x: 0, y: 0 });
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Try a JPG or PNG.`
          : "That file didn't decode. Try a JPG or PNG.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Render loop --------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;

    // Any edit invalidates an existing share link — it points at the old PNG.
    setShare((prev) => (prev ? null : prev));

    let stale = false;
    (async () => {
      await ensureFonts();
      if (stale) return;

      if (mode === "pfp") {
        renderPfp(canvas, { photo: photo.canvas, transform, theme, handle });
      } else {
        await renderCard(canvas, {
          photo: photo.canvas,
          transform,
          name,
          role,
          handle,
          github,
          shipping,
          title: titleOverride,
          salt,
        });
      }
      if (stale) return;

      // Stage the PNG in the background so Share is instant later.
      canvasToBlob(canvas)
        .then((b) => {
          if (!stale) blobRef.current = b;
        })
        .catch(() => {});
    })();

    return () => {
      stale = true;
    };
  }, [photo, mode, transform, theme, handle, github, name, role, shipping, titleOverride, salt]);

  // --- Pan / zoom ---------------------------------------------------------
  const dragState = useRef<{ id: number; x: number; y: number } | null>(null);

  const canvasScale = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return 1;
    return canvas.width / stage.getBoundingClientRect().width;
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!photo) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragState.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.id !== e.pointerId || !photo) return;
    const k = canvasScale();
    const dx = (e.clientX - drag.x) * k;
    const dy = (e.clientY - drag.y) * k;
    dragState.current = { id: e.pointerId, x: e.clientX, y: e.clientY };

    const box = mode === "pfp" ? PFP_SIZE : 600;
    setTransform((t) =>
      clampTransform(photo.canvas, box, box, { ...t, x: t.x + dx, y: t.y + dy }),
    );
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const setZoom = (zoom: number) => {
    if (!photo) return;
    const box = mode === "pfp" ? PFP_SIZE : 600;
    setTransform((t) => clampTransform(photo.canvas, box, box, { ...t, zoom }));
  };

  // --- Output -------------------------------------------------------------
  const filename = () => {
    const who = (name || handle || "builder").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `hh-goa-2026-${mode === "pfp" ? "frame" : "id"}-${who || "builder"}.png`;
  };

  const currentBlob = async (): Promise<Blob> => {
    if (blobRef.current) return blobRef.current;
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Nothing to export yet.");
    const blob = await canvasToBlob(canvas);
    blobRef.current = blob;
    return blob;
  };

  const download = async () => {
    try {
      setStatus(null);
      const blob = await currentBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus("Saved to your downloads.");
    } catch {
      setError("Download failed — try again.");
    }
  };

  /** Native sheet with the PNG attached. Best path on phones. */
  const shareImage = async () => {
    const blob = blobRef.current;
    if (!blob) {
      setError("Still rendering — give it a second.");
      return;
    }
    const file = new File([blob], filename(), { type: "image/png" });
    try {
      await navigator.share({ files: [file], text: `${SHARE_TEXT} ${location.origin} #FrameInGoa` });
    } catch (err) {
      // A user cancelling the sheet is not an error worth surfacing.
      if ((err as Error)?.name !== "AbortError") {
        setError("Sharing failed — download it and attach it manually.");
      }
    }
  };

  /**
   * Upload the PNG, then hand back an X compose link whose OG image *is* that PNG.
   *
   * This deliberately does NOT pre-open a popup and point it at the intent once
   * the upload resolves. Safari treats the user gesture as spent the moment we
   * await, so the popup it allowed gets torn down before it can navigate and the
   * button appears to do nothing. Instead the link is rendered as a real anchor
   * for the user to tap — a fresh gesture that can never be blocked — and we
   * only *attempt* to open it automatically as a convenience.
   */
  const shareToX = async () => {
    setError(null);
    setCopied(false);
    setPreparing(true);
    setStatus("Preparing your link…");

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Nothing to share yet.");

      // Build the 1.91:1 plate X actually shows in the timeline.
      const ogCanvas = document.createElement("canvas");
      await renderOg(canvas, ogCanvas);

      const [blob, ogBlob] = await Promise.all([currentBlob(), canvasToBlob(ogCanvas)]);

      const form = new FormData();
      form.append("image", blob, "graphic.png");
      form.append("og", ogBlob, "og.png");

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const { pageUrl } = (await res.json()) as { pageUrl: string };

      const intent = new URL("https://x.com/intent/post");
      intent.searchParams.set("text", SHARE_TEXT);
      intent.searchParams.set("url", pageUrl);
      intent.searchParams.set("hashtags", "FrameInGoa");
      const intentUrl = intent.toString();

      setShare({ pageUrl, intentUrl });
      setStatus("Ready — tap Open X to post it.");

      // Try a new tab first, but fall back to navigating this one.
      //
      // Two subtleties. `noopener` in the feature string forces window.open to
      // return null by spec, which would make a blocked popup indistinguishable
      // from a successful one — so it is set manually on the handle instead.
      // And because the upload above spent the user's gesture, mobile browsers
      // routinely refuse the popup; a same-tab navigation is never blocked, so
      // that is the fallback rather than leaving the user on an unchanged page.
      const opened = window.open(intentUrl, "_blank");
      if (opened) {
        try {
          opened.opener = null;
        } catch {
          // Cross-origin handle; nothing to harden.
        }
      } else {
        window.location.href = intentUrl;
      }
    } catch {
      setError("Couldn't upload. Download the image and attach it to your post instead.");
      setStatus(null);
    } finally {
      setPreparing(false);
    }
  };

  const copyLink = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Couldn't copy — long-press the link to copy it manually.");
    }
  };

  const reset = () => {
    setPhoto(null);
    blobRef.current = null;
    setStatus(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // --- View ---------------------------------------------------------------
  const aspect = mode === "pfp" ? 1 : CARD_W / CARD_H;

  return (
    <section id="studio" className="w-full max-w-5xl mx-auto px-4 pb-28 sm:pb-16">
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          // Clear the value so picking the *same* file again still fires a change
          // event — otherwise a retry after a failed decode does nothing.
          e.target.value = "";
          if (f) openFile(f);
        }}
      />

      {!photo ? (
        <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) openFile(f);
          }}
          className={`w-full rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center transition-colors ${
            dragOver
              ? "border-hh-yellow bg-hh-yellow/10"
              : "border-hh-cream/35 bg-black/10 hover:border-hh-yellow/70"
          }`}
        >
          <div className="text-6xl sm:text-7xl" aria-hidden>
            🌴
          </div>
          <p className="hh-display mt-4 text-4xl sm:text-6xl text-hh-yellow">
            DROP YOUR PHOTO
          </p>
          <p className="mt-3 text-sm sm:text-base text-hh-cream/80">
            {loading ? "Decoding…" : "JPG, PNG, or HEIC straight off your iPhone."}
          </p>
          <p className="mt-1 text-xs text-hh-cream/55">
            Everything renders in your browser. Nothing is uploaded until you tap Share.
          </p>
        </button>

        {/* A first upload that fails leaves no canvas to hang a message on, so
            the dropzone reports it here. */}
        {error && (
          <p
            role="alert"
            className="mt-3 text-xs text-hh-yellow bg-black/30 rounded-lg p-3 text-center"
          >
            {error}
          </p>
        )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          {/* Preview */}
          <div>
            <div
              role="tablist"
              aria-label="Output format"
              className="inline-flex rounded-full bg-black/25 p-1 mb-4"
            >
              {(
                [
                  ["pfp", "Profile frame"],
                  ["card", "Builder ID"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-colors ${
                    mode === value
                      ? "bg-hh-yellow text-hh-green-deep"
                      : "text-hh-cream/75 hover:text-hh-cream"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="relative w-full rounded-2xl overflow-hidden bg-black/25 touch-none cursor-grab active:cursor-grabbing select-none"
              style={{ aspectRatio: String(aspect) }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                aria-label="Your generated Hacker House Goa graphic"
              />
            </div>

            <p className="mt-2 text-xs text-hh-cream/60 text-center">
              Drag the image to reposition · use the slider to zoom
            </p>

            <label className="mt-3 block">
              <span className="sr-only">Zoom</span>
              <input
                className="hh-range"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={transform.zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            {mode === "pfp" ? (
              <>
                <Field label="Ring colour">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(THEMES) as ThemeName[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`rounded-xl px-2 py-3 text-[11px] font-bold border-2 transition-colors ${
                          theme === key
                            ? "border-hh-yellow text-hh-yellow"
                            : "border-hh-cream/25 text-hh-cream/70 hover:border-hh-cream/50"
                        }`}
                      >
                        {/* Two-tone chip mirrors the ring: band colour + accent. */}
                        <span
                          className="flex h-6 w-full rounded-md mb-2 items-center justify-center ring-1 ring-hh-cream/40"
                          style={{ background: THEMES[key].band }}
                        >
                          <span
                            className="block h-1.5 w-2/3 rounded-full"
                            style={{ background: THEMES[key].accent }}
                          />
                        </span>
                        {THEMES[key].label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="X handle (optional)">
                  <Input
                    value={handle}
                    onChange={setHandle}
                    placeholder="@yourhandle"
                    maxLength={20}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Name">
                  <Input
                    value={name}
                    onChange={setName}
                    placeholder="Your name"
                    maxLength={26}
                  />
                </Field>
                <Field label="Stack / role">
                  <Input
                    value={role}
                    onChange={setRole}
                    placeholder="Full-stack · Solidity · Design"
                    maxLength={38}
                  />
                </Field>
                <Field label="GitHub username">
                  <Input
                    value={github}
                    onChange={setGithub}
                    placeholder="your-username"
                    maxLength={39}
                  />
                  <p className="mt-1.5 text-[11px] text-hh-cream/45">
                    Sets the card&apos;s QR code — scanning it opens your repos.
                  </p>
                </Field>

                <Field label="X handle">
                  <Input
                    value={handle}
                    onChange={setHandle}
                    placeholder="@yourhandle"
                    maxLength={20}
                  />
                </Field>

                <Field label="Currently shipping">
                  <Input
                    value={shipping}
                    onChange={setShipping}
                    placeholder="What you're building"
                    maxLength={34}
                  />
                </Field>

                <Field label="Builder title">
                  <div className="flex items-center gap-2">
                    <input
                      value={titleOverride || title}
                      onChange={(e) => setTitleOverride(e.target.value)}
                      maxLength={30}
                      className="flex-1 min-w-0 rounded-xl bg-hh-pink/90 border-2 border-transparent px-3 py-2.5 text-xs font-bold text-hh-cream placeholder:text-hh-cream/60 focus:border-hh-yellow focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => {
                        // Drop the override so the freshly rolled title shows.
                        setTitleOverride("");
                        setSalt((s) => s + 1);
                      }}
                      className="shrink-0 rounded-xl border-2 border-hh-cream/30 px-3 py-2.5 text-xs font-bold hover:border-hh-yellow hover:text-hh-yellow transition-colors"
                      title="Generate a different title"
                    >
                      Reroll
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-hh-cream/45">
                    Type your own, or reroll for a generated one.
                  </p>
                </Field>
              </>
            )}

            <div className="hidden lg:block space-y-2 pt-1">
              <Actions
                onDownload={download}
                onShareX={shareToX}
                onShareImage={canShareFiles ? shareImage : undefined}
                onReset={reset}
                onCopy={copyLink}
                share={share}
                preparing={preparing}
                copied={copied}
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-hh-yellow bg-black/30 rounded-lg p-3">
                {error}
              </p>
            )}
            {status && !error && (
              <p className="text-xs text-hh-cream/75 bg-black/20 rounded-lg p-3">{status}</p>
            )}
          </div>

          {/* Sticky action bar on phones */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-20 border-t border-hh-cream/15 bg-hh-green-deep/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Actions
              onDownload={download}
              onShareX={shareToX}
              onShareImage={canShareFiles ? shareImage : undefined}
              onReset={reset}
              onCopy={copyLink}
              share={share}
              preparing={preparing}
              copied={copied}
              compact
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Actions({
  onDownload,
  onShareX,
  onShareImage,
  onReset,
  onCopy,
  share,
  preparing,
  copied,
  compact,
}: {
  onDownload: () => void;
  onShareX: () => void;
  onShareImage?: () => void;
  onReset: () => void;
  onCopy: () => void;
  share: { pageUrl: string; intentUrl: string } | null;
  preparing: boolean;
  copied: boolean;
  compact?: boolean;
}) {
  // Once the upload is done the primary control becomes a plain anchor. Tapping
  // it is a fresh user gesture, so no browser can block the hand-off to X.
  if (share) {
    return (
      <div className={compact ? "flex gap-2" : "space-y-2"}>
        <a
          href={share.intentUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 w-full text-center rounded-xl bg-hh-yellow text-hh-green-deep font-extrabold py-3 px-4 text-sm hover:brightness-95 active:brightness-90 transition"
        >
          Open X →
        </a>
        <a
          href={linkedInShareUrl(share.pageUrl)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 w-full text-center rounded-xl border-2 border-hh-cream/35 font-bold py-3 px-4 text-sm hover:border-hh-yellow hover:text-hh-yellow transition"
        >
          LinkedIn
        </a>
        <button
          onClick={onCopy}
          className="flex-1 w-full rounded-xl border-2 border-hh-cream/35 font-bold py-3 px-4 text-sm hover:border-hh-yellow hover:text-hh-yellow transition"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        {!compact && (
          <button
            onClick={onDownload}
            className="w-full rounded-xl border-2 border-hh-cream/35 font-bold py-3 px-4 text-sm hover:border-hh-yellow hover:text-hh-yellow transition"
          >
            Download
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "flex gap-2" : "space-y-2"}>
      <button
        onClick={onShareImage ?? onShareX}
        disabled={preparing}
        className="flex-1 w-full rounded-xl bg-hh-yellow text-hh-green-deep font-extrabold py-3 px-4 text-sm hover:brightness-95 active:brightness-90 transition disabled:opacity-60"
      >
        {onShareImage ? "Share" : preparing ? "Preparing…" : "Share on X"}
      </button>
      {/* No secondary "Post to X" here. Where the native sheet is available it
          attaches the PNG itself, which beats a link card outright; offering the
          link path alongside it only invited people into the weaker flow. On
          desktop there is no file-sharing sheet, so the button above *is* the
          link path and remains the only way to reach X. */}
      <button
        onClick={onDownload}
        className="flex-1 w-full rounded-xl border-2 border-hh-cream/35 font-bold py-3 px-4 text-sm hover:border-hh-yellow hover:text-hh-yellow transition"
      >
        Download
      </button>
      {!compact && (
        <button
          onClick={onReset}
          className="w-full rounded-xl text-hh-cream/60 py-2 text-xs hover:text-hh-cream transition"
        >
          Use a different photo
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.18em] text-hh-cream/60 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-xl bg-black/25 border-2 border-hh-cream/20 px-3 py-2.5 text-sm text-hh-cream placeholder:text-hh-cream/40 focus:border-hh-yellow focus:outline-none transition-colors"
    />
  );
}
