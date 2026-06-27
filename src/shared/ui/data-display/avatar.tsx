"use client";

import { useState } from "react";

interface AvatarProps {
  /** Avatar image URL; falls back to the initial when absent or broken. */
  src?: string | null;
  /** Full name — drives the alt text and the single-letter fallback. */
  name: string;
  /** 40px byline/comment avatar (16px letter) or 128px profile-header avatar. */
  size?: "sm" | "lg";
}

const SIZES = {
  sm: { box: 40, letter: "text-[16px]" },
  lg: { box: 128, letter: "text-[44px]" },
} as const;

/**
 * Brutalist-Mono avatar — a square 2px-border tile with the user's photo, or
 * their first initial on the panel surface when no image is set. `sm` (40px) is
 * the byline/comment size; `lg` (128px) is the profile header.
 *
 * The initial sits BEHIND the image as a zero-cost placeholder: it shows while
 * the photo loads (the fixed box already reserves space, so there's no layout
 * shift) and stays if the photo is missing or fails to load (`onError`). Plain
 * `<img>`, not next/image — shared/ui is framework-agnostic and the avatar ran
 * `unoptimized` anyway (arbitrary Azure-blob UGC URLs).
 */
export function Avatar({ src, name, size = "sm" }: AvatarProps) {
  const { box, letter } = SIZES[size];
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const [broken, setBroken] = useState(false);

  return (
    <span
      className="relative flex shrink-0 overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)] select-none"
      style={{ width: box, height: box }}
    >
      <span
        aria-hidden="true"
        className={`font-display absolute inset-0 flex items-center justify-center font-bold text-[var(--m-muted2)] ${letter}`}
      >
        {initial}
      </span>
      {src && !broken && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={box}
          height={box}
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  );
}
