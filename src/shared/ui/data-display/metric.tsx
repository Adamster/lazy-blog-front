import {
  HeartIcon,
  EyeIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  StarIcon,
} from "@heroicons/react/24/solid";

/** Locale number formatting shared by every mono metric/count. */
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
  /** Tint the metric with the accent color (e.g. an up-voted post's likes). */
  accent?: boolean;
}

/**
 * Icon + number metric (likes / views / posts / comments / rating) used in feed
 * cards, list rows, the hero byline and profile stats. `rating` is the
 * net-rating variant: a neutral STAR followed by the net value as-is — the icon
 * never changes with sign, the NUMBER carries the +/- (a negative net reads e.g.
 * `★ -2`). The whole row keeps the muted meta colour.
 */
export function Metric({ kind, value, accent = false }: MetricProps) {
  const Icon = kind === "rating" ? StarIcon : ICONS[kind];

  return (
    <span
      className={[
        "inline-flex items-center gap-2.5 tabular-nums",
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
