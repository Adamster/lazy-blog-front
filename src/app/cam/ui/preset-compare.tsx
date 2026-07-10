"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { CompareSlider } from "@/shared/ui";
import presetDefault from "@/assets/presets/preset-default.jpg";
import presetChrome from "@/assets/presets/preset-chrome.jpg";
import presetBw from "@/assets/presets/preset-bw.jpg";

const PRESETS = [
  { value: "chrome", label: "Chrome", src: presetChrome },
  { value: "bw", label: "BW", src: presetBw },
];

function PhotoPane({ src, alt }: { src: StaticImageData; alt: string }) {
  return (
    <div className="relative h-full w-full">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, (max-width: 1200px) 432px, 480px"
        placeholder="blur"
        draggable={false}
        className="object-cover"
      />
    </div>
  );
}

// The `[ X ]` bracket text — brackets show only while active (header-nav
// language); shared by the static DEFAULT tag and the preset toggle.
function BracketText({
  active,
  children,
}: {
  active: boolean;
  children: string;
}) {
  return (
    <>
      <span
        className={`transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
      >
        {"[ "}
      </span>
      {children}
      <span
        className={`transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
      >
        {" ]"}
      </span>
    </>
  );
}

// The hero subject: the Default preset vs the picked look (Chrome / BW),
// split by a draggable seam. The picker is a header-nav-style bracket toggle.
export function PresetCompare() {
  const [preset, setPreset] = useState("chrome");
  const active = PRESETS.find((p) => p.value === preset) ?? PRESETS[0];

  return (
    // below lg it sits on the pitch's left axis (stacked column); on lg it
    // moves toward the right edge, mirroring the pitch flush left
    <div className="cam-rise w-full max-w-[480px] [animation-delay:.6s] lg:col-span-2 lg:ml-auto lg:max-[1199px]:max-w-[432px]">
      {/* label row: static DEFAULT tag (the fixed left half) · preset toggle
          for the right half — both in the header-nav bracket language */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-accent)] uppercase">
          <BracketText active>DEFAULT</BracketText>
        </span>
        <div className="flex gap-4">
          {PRESETS.map((p) => {
            const isActive = p.value === preset;
            return (
              <button
                key={p.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setPreset(p.value)}
                className={`mono-focus text-[11px] leading-none font-medium tracking-[0.12em] uppercase transition-colors ${
                  isActive
                    ? "text-[var(--m-accent)]"
                    : "text-[var(--m-muted)] hover:text-[var(--m-accent)]"
                }`}
              >
                <BracketText active={isActive}>{p.label}</BracketText>
              </button>
            );
          })}
        </div>
      </div>

      {/* the project's one photo-surface border: 2px --m-dim (post cover,
          dropzone, crop modals, Avatar) */}
      <div className="relative border-2 border-[var(--m-dim)]">
        <CompareSlider
          ariaLabel={`Reveal the ${active.label} preset over the Default shot`}
          className="aspect-[4/5] w-full"
          before={
            <PhotoPane src={presetDefault} alt="Lazy Cam Default preset shot" />
          }
          after={
            <PhotoPane
              src={active.src}
              alt={`Lazy Cam ${active.label} preset shot`}
            />
          }
        />
      </div>
    </div>
  );
}
