import Image from "next/image";

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
 */
export function Avatar({ src, name, size = "sm" }: AvatarProps) {
  const { box, letter } = SIZES[size];
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)] select-none"
      style={{ width: box, height: box }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={box}
          height={box}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`font-display font-bold text-[var(--m-muted2)] ${letter}`}
        >
          {initial}
        </span>
      )}
    </span>
  );
}
