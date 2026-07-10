// The Lazy Cam mark — viewfinder corner brackets around a lens dot. Mono-only
// (currentColor), same rule as the sloth mark: accent lives in the lockup
// brackets, never in the mark itself.
export function CamGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M3 8.5V3h5.5M15.5 3H21v5.5M21 15.5V21h-5.5M8.5 21H3v-5.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}
