export type Status = "LATEST DROP" | "FEATURED";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

// Flat "live" marker — label + a breathing ring around a filled dot (the
// ring's `mono-status-ring` keyframe lives in tailwind.css, with a
// prefers-reduced-motion fallback that freezes it fully opaque). FEATURED
// reads accent (it's the signal); LATEST DROP stays muted (routine, not a
// callout).
const TONE: Record<Status, { text: string; border: string; dot: string }> = {
  FEATURED: {
    text: "text-[var(--m-accent)]",
    border: "border-[var(--m-accent)]",
    dot: "bg-[var(--m-accent)]",
  },
  "LATEST DROP": {
    text: "text-[var(--m-muted)]",
    border: "border-[var(--m-muted)]",
    dot: "bg-[var(--m-muted)]",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const tone = TONE[status];
  return (
    <span
      className={`inline-flex items-center gap-2${
        className ? ` ${className}` : ""
      }`}
    >
      <span
        className={`text-[11px] leading-none font-semibold tracking-[0.06em] uppercase ${tone.text}`}
      >
        {status}
      </span>
      <span className="relative inline-flex size-3.5 shrink-0 items-center justify-center">
        <span
          className={`mono-status-ring absolute inset-0 rounded-full border-2 ${tone.border}`}
        />
        <span className={`size-1.5 rounded-full ${tone.dot}`} />
      </span>
    </span>
  );
}
