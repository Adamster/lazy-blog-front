import {
  HeartIcon,
  EyeIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  StarIcon,
} from "@heroicons/react/24/solid";

export const fmt = (n?: number) => (n ?? 0).toLocaleString("en-US");

const ICONS = {
  likes: HeartIcon,
  views: EyeIcon,
  posts: DocumentTextIcon,
  comments: ChatBubbleLeftIcon,
} as const;

type MetricKind = keyof typeof ICONS | "rating";

interface MetricProps {
  kind: MetricKind;
  value: number;
  accent?: boolean;
}

// `rating` = neutral star + net value as-is; the NUMBER carries the sign (e.g. `★ -2`), the icon never changes.
export function Metric({ kind, value, accent = false }: MetricProps) {
  const Icon = kind === "rating" ? StarIcon : ICONS[kind];

  return (
    <span
      className={[
        "inline-flex items-center gap-1 tabular-nums",
        accent && "text-[var(--m-accent)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon
        aria-label={kind === "rating" ? "Rating" : undefined}
        role={kind === "rating" ? "img" : undefined}
        className="size-3.5 shrink-0"
      />
      {fmt(value)}
    </span>
  );
}
