import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Button, Cue } from "@/shared/ui";
import { GlitchText } from "@/shared/ui/effects";
import { CamBand, CamShell } from "./ui/cam-chrome";
import { PresetCompare } from "./ui/preset-compare";
import { AsciiDivider } from "@/shared/ui/prose";
import { B, QaItem, QaLink, QaList } from "./ui/qa";

export const metadata: Metadata = {
  title: "Lazy Cam — One frame, your film look",
  description:
    "Lazy Cam is an iPhone camera that captures a single frame and gives you a real film look — tone, color, and grain you control. No multi-frame blending.",
  openGraph: {
    title: "Lazy Cam — One frame, your film look",
    description:
      "An iPhone camera that shoots a single frame and lets you shape a real film look.",
    type: "website",
  },
};

const APP_STORE_URL =
  "https://apps.apple.com/us/app/lazy-cam-film-camera/id6761757290";

function Em({ children }: { children: ReactNode }) {
  return <em className="text-[var(--m-accent)] not-italic">{children}</em>;
}

function ViewfinderHero() {
  return (
    <section aria-label="Lazy Cam" className="min-h-app relative flex flex-col">
      {/* rule-of-thirds grid — viewport edge to edge, quiet muted lines */}
      <div className="cam-thirds" aria-hidden="true" />
      <CamShell className="flex flex-1">
        {/* stacked layouts (photo under text, < lg) breathe py-20 top/bottom;
            the lg side-by-side keeps the tighter py-10 */}
        <div className="cam-viewfinder relative flex flex-1 flex-col justify-center py-20 lg:py-10">
          <span className="cam-corner cam-corner-tl" aria-hidden="true" />
          <span className="cam-corner cam-corner-tr" aria-hidden="true" />
          <span className="cam-corner cam-corner-bl" aria-hidden="true" />
          <span className="cam-corner cam-corner-br" aria-hidden="true" />

          {/* inner px — air between the bracket edges and the content */}
          {/* below lg: one centered 480 column (pitch + frame share the axis),
              px-10 clears the corner brackets; lg+: the 3-col spread, px-20 */}
          <div className="relative mx-auto grid w-full max-w-[560px] items-center gap-10 px-10 lg:max-w-none lg:grid-cols-3 lg:px-20">
            {/* pitch block — the left third of the grid */}
            <div className="lg:col-span-1">
              <p className="mono-label cam-rise [animation-delay:.35s]">
                <Cue className="mr-2" />
                iOS · NO HDR · FILM-LOOK PRESETS
              </p>
              <h1 className="cam-rise font-display mt-6 text-[32px] leading-[1.04] font-bold tracking-[-0.02em] [animation-delay:.45s] md:text-[40px]">
                <GlitchText>
                  Pick&nbsp;a&nbsp;look.
                  <span className="mt-[0.05em] block">
                    Shoot. <Em>Done.</Em>
                  </span>
                </GlitchText>
              </h1>
              <p className="cam-rise mt-4 max-w-[42ch] text-[14px] leading-[1.6] text-[var(--m-muted)] [animation-delay:.6s]">
                One frame. A real film look — tone, color, and grain you
                control.
              </p>
              <div className="cam-rise mt-6 flex flex-col items-start [animation-delay:.72s]">
                <Button
                  href={APP_STORE_URL}
                  className="gap-2 whitespace-nowrap"
                  aria-label="Download on the App Store"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-4 shrink-0"
                  >
                    <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.47 7.81 1.3 10.37.86 1.25 1.89 2.66 3.24 2.61 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.28 3.15-2.54.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.73-1.05-2.76-4.16zM14.54 4.33c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.32-.59 3.03-1.46z" />
                  </svg>
                  Download on the App Store
                </Button>
              </div>
            </div>

            <PresetCompare />
          </div>
        </div>
      </CamShell>
    </section>
  );
}

// Eyebrow (24 below) → H1-scale head → lead note (24) → section content.
// A landing section: airy py-20 rhythm, eyebrow → head → note stack. `band`
// puts it on the darker --m-panel fill (2px dim rules top/bottom) so the
// sections alternate bg → panel → bg down the page; `narrow` centers the
// content on the design-file's 900px reading column.
function Statement({
  label,
  head,
  note,
  children,
  id,
  ariaLabel,
  heading = false,
  band = false,
  narrow = false,
  labelEnd,
}: {
  label: string;
  head: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
  id?: string;
  ariaLabel?: string;
  /** true = a real <h2>; default = a plain statement <p>. */
  heading?: boolean;
  band?: boolean;
  narrow?: boolean;
  /** Right-aligned meta on the eyebrow row (e.g. "LAST UPDATED · …"). */
  labelEnd?: ReactNode;
}) {
  const Head = heading ? "h2" : "p";
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`scroll-mt-[var(--m-header-h)] py-20 ${
        band ? "bg-[var(--m-panel)]" : ""
      }`}
    >
      <CamShell>
        <div className={narrow ? "mx-auto w-full max-w-[900px]" : undefined}>
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <p className="mono-label">{`// ${label}`}</p>
            {labelEnd != null && (
              <span className="mono-label text-[var(--m-muted)] uppercase">
                {labelEnd}
              </span>
            )}
          </div>
          <Head className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em]">
            {head}
          </Head>
          {note != null && (
            <p className="mt-6 text-[14px] leading-[1.6] text-[var(--m-muted)]">
              {note}
            </p>
          )}
          {children}
        </div>
      </CamShell>
    </section>
  );
}

// A version-history / roadmap row — the QA rule-row language (2px top rule
// per row, the list closes with a bottom rule): version tag · what changed ·
// right-aligned status meta. Planned rows dim the tag to muted2.
const TIMELINE = [
  {
    tag: "1.0",
    meta: "JUN 2026",
    text: "First release. One frame, real controls, film-look presets.",
  },
  {
    tag: "1.0.1",
    meta: "JUN 2026",
    text: "Custom presets sync over iCloud — they survive reinstalls and follow you to a new iPhone. Also: an optional buy-me-a-coffee button in Settings. Nothing is paywalled.",
  },
  {
    tag: "NEXT",
    planned: true,
    meta: "PLANNED",
    text: "A redesign to match the NOT LAZY brand you're looking at.",
  },
  {
    tag: "NEXT",
    planned: true,
    meta: "PLANNED",
    text: "Deeper color grading — more ways to bend tone and color.",
  },
  {
    tag: "LATER",
    planned: true,
    meta: "PLANNED",
    text: "Preset export and import — share your looks, keep backups.",
  },
];

// A node on the vertical timeline rail: square marker on the 2px rail
// (filled accent = shipped, hollow dim = planned), a short branch tick to
// the row content, the rail segment running down to the next node.
function TimelineRow({
  tag,
  meta,
  text,
  planned = false,
  last = false,
}: {
  tag: string;
  meta: string;
  text: string;
  planned?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative pl-7">
      {!last && (
        <span
          aria-hidden="true"
          className="absolute top-[14px] -bottom-7 left-1 w-0.5 bg-[var(--m-dim)]"
        />
      )}
      <span
        aria-hidden="true"
        className={`absolute top-px left-0 size-2.5 ${
          planned
            ? "border-2 border-[var(--m-dim)] bg-[var(--m-bg)]"
            : "bg-[var(--m-accent)]"
        }`}
      />
      <span
        aria-hidden="true"
        className="absolute top-[5px] left-2.5 h-0.5 w-3 bg-[var(--m-dim)]"
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span
          className={`text-[11px] leading-[1.2] font-medium tracking-[0.12em] uppercase ${
            planned ? "text-[var(--m-muted2)]" : "text-[var(--m-fg)]"
          }`}
        >
          {tag}
        </span>
        <span className="text-[11px] leading-[1.2] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
          {meta}
        </span>
      </div>
      <p className="mt-2 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        {text}
      </p>
    </div>
  );
}

// A redline-patch row (the :::diff directive language): − = what phones do
// (error mark, muted copy), + = what Lazy Cam does (accent mark, fg copy).
function DiffRow({
  plus = false,
  children,
}: {
  plus?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={`flex gap-3 text-[14px] leading-[1.6] ${
        plus ? "text-[var(--m-fg)]" : "text-[var(--m-muted)]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 font-semibold ${
          plus ? "text-[var(--m-accent)]" : "text-[var(--m-error)]"
        }`}
      >
        {plus ? "+" : "−"}
      </span>
      <span className="flex-1">{children}</span>
    </p>
  );
}

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="size-6 shrink-0 text-[var(--m-muted)]"
    >
      {children}
    </svg>
  );
}

function Step({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <span className="mono-title">{title}</span>
      </div>
      <p className="text-[14px] leading-[1.6] text-[var(--m-muted)]">{desc}</p>
    </div>
  );
}

// The pitch band's three headline facts (single frame / real controls /
// presets sync), each with a meaning-matched stroke icon.
const HIGHLIGHTS = [
  {
    title: "Real controls",
    desc: "Tone curve, per-hue color, grain, focus, exposure, white balance.",
    // mixer sliders — hands-on controls
    icon: (
      <StepIcon>
        <path d="M8 13h24" strokeLinecap="round" />
        <path d="M8 20h24" strokeLinecap="round" />
        <path d="M8 27h24" strokeLinecap="round" />
        <circle cx="15" cy="13" r="3.5" fill="var(--m-card)" />
        <circle cx="26" cy="20" r="3.5" fill="var(--m-card)" />
        <circle cx="12" cy="27" r="3.5" fill="var(--m-card)" />
      </StepIcon>
    ),
  },
  {
    title: "Presets everywhere",
    desc: "Your custom looks back up to iCloud and sync across devices.",
    // iCloud — presets follow you
    icon: (
      <StepIcon>
        <path
          d="M13 29h16a6 6 0 0 0 .5-12A9 9 0 0 0 12 15a6.9 6.9 0 0 0 1 14z"
          strokeLinejoin="round"
        />
      </StepIcon>
    ),
  },
];

// The pitch band — the three facts in the step anatomy, with the film-strip
// sprocket rows on its top/bottom edges.
function StepsBand() {
  return (
    <CamBand
      className="cam-strip relative mt-20"
      pad="py-14"
      aria-label="Highlights"
    >
      <div className="mx-auto grid w-full max-w-[900px] grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-20">
        {HIGHLIGHTS.map((item) => (
          <Step
            key={item.title}
            title={item.title}
            desc={item.desc}
            icon={item.icon}
          />
        ))}
      </div>
    </CamBand>
  );
}

function SupportSection() {
  return (
    <Statement
      id="support"
      label="SUPPORT"
      head="Common questions"
      heading
      band
      narrow
      note={
        <>
          Most of it is meant to be tap-and-shoot — and if you&apos;re stuck or
          have an idea, we&apos;d genuinely love to hear from you.
        </>
      }
    >
      <div className="mt-8">
        <QaList>
          <QaItem q="Where are my photos saved?" defaultOpen>
            Straight to your device&apos;s Photo Library, as HEIF. Nothing is
            uploaded anywhere.
          </QaItem>
          <QaItem q="How do my presets sync across devices?">
            Turn on <B>Sync Presets to iCloud</B> in Settings. Your custom
            presets back up to your own private iCloud and appear on your other
            devices signed into the same Apple Account. Turn it off any time to
            keep presets on this device only.
          </QaItem>
          <QaItem q="My custom presets didn't come back after reinstalling.">
            Make sure you&apos;re signed into iCloud and that{" "}
            <B>Sync Presets to iCloud</B> is on, then give it a moment to sync
            after launching. If something looks off, Settings includes a{" "}
            <B>Reset Custom Presets</B> option to restore the built-in defaults.
          </QaItem>
          <QaItem q="Why doesn't the app shoot RAW or use Night mode?">
            That&apos;s by design. Lazy Cam captures a single frame and shapes
            the look afterward, rather than blending multiple frames the way the
            system camera does. It&apos;s what gives photos their film-like
            feel.
          </QaItem>
          <QaItem q="Does the app work on iPad?">
            Lazy Cam is built for iPhone running iOS 17 or later.
          </QaItem>
        </QaList>
      </div>
      <p className="mt-6 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Still stuck? Email us at{" "}
        <QaLink href="mailto:support@notlazy.org">support@notlazy.org</QaLink>{" "}
        with your device model and iOS version — we read every message.
      </p>
    </Statement>
  );
}

function PrivacySection() {
  return (
    <Statement
      id="privacy"
      label="PRIVACY"
      head="Privacy Policy"
      heading
      narrow
      labelEnd="Last updated · June 8, 2026"
    >
      {/* the design-file privacy stack: display lead → guarantee chip →
          updated line → Q&A rows */}
      <p className="font-display mt-6 max-w-[60ch] text-[18px] leading-[1.6] font-medium">
        Lazy Cam{" "}
        <span className="text-[var(--m-accent)]">
          does not collect, store, or share your personal data
        </span>
        . It&apos;s a camera app that runs entirely on your device — your photos
        and your settings stay yours.
      </p>
      <span className="mt-6 inline-flex border-2 border-[var(--m-dim)] px-4 py-2 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-accent)] uppercase">
        No accounts · No tracking · No analytics
      </span>

      <div className="mt-8">
        <QaList>
          <QaItem q="What happens to my photos?">
            They&apos;re saved straight to your device&apos;s Photo Library and
            never uploaded to us or to any third party.
          </QaItem>
          <QaItem q="What permissions does the app use?">
            Two: camera access so you can take photos, and <B>add-only</B> Photo
            Library access so it can save them — the kind of permission that
            lets an app put photos in, not look at what&apos;s already there.
            Those permissions are used for nothing else.
          </QaItem>
          <QaItem q="Where are my presets and settings stored?">
            On your device. If you keep iCloud sync turned on, they&apos;re also
            stored in <B>your own private iCloud account</B> so they sync across
            your devices. We have no access to this data, and you can turn
            iCloud sync off at any time in the app&apos;s Settings.
          </QaItem>
          <QaItem q="Does the app use analytics or tracking?">
            No. Lazy Cam contains no third-party analytics, advertising, or
            tracking technology of any kind — there is no networking code in the
            app, so there&apos;s nothing to upload with.
          </QaItem>
          <QaItem q="What if this policy changes?">
            We&apos;ll update the date at the top of this section. Because we
            don&apos;t collect personal data, we have nothing to sell or share,
            and there is no account to delete.
          </QaItem>
        </QaList>
      </div>
      <p className="mt-6 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Questions about your privacy? Email{" "}
        <QaLink href="mailto:support@notlazy.org">support@notlazy.org</QaLink>{" "}
        and we&apos;ll be glad to help.
      </p>
    </Statement>
  );
}

export default function CamLandingPage() {
  return (
    <>
      <ViewfinderHero />
      <main>
        <StepsBand />

        <Statement
          label="THE IDEA"
          narrow
          head="Your phone edits your photo before you do."
        >
          {/* the them-vs-us contrast as a redline patch — the :::diff
              directive language: − what phones do, + what Lazy Cam does;
              bare terminal lines, no box */}
          <div className="mt-6 flex flex-col gap-2">
            <DiffRow>
              Every other camera stacks, smooths, and second-guesses the shot.
            </DiffRow>
            <DiffRow plus>
              Lazy Cam takes one frame and leaves it alone.
            </DiffRow>
          </div>
          <p className="mt-6 text-[14px] leading-[1.6] text-[var(--m-muted)]">
            Then it hands the look back to you — tone, color, grain, your call.
            What you see in the viewfinder is what lands in your library.
          </p>

          {/* the ::divider glyph rule separates the statement from the
              changelog (its own 36px margins carry the rhythm) */}
          <AsciiDivider />

          {/* version history + roadmap — the App Store changelog, extended
              with where the app is headed */}
          <div className="flex flex-col gap-7">
            {TIMELINE.map((item, i) => (
              <TimelineRow key={i} {...item} last={i === TIMELINE.length - 1} />
            ))}
          </div>
        </Statement>

        <SupportSection />
        <PrivacySection />
      </main>
    </>
  );
}
