import {
  HeartIcon,
  EyeIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";

/** Locale number formatting shared by every mono metric/count. */
export const fmt = (n?: number) => (n ?? 0).toLocaleString("ru-RU");

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
  /**
   * Tint the metric with the accent color (e.g. an up-voted post's likes).
   * Ignored by `rating`, whose colour is sign-driven.
   */
  accent?: boolean;
}

/**
 * Icon + number metric (likes / views / posts / comments / rating) used in feed
 * cards, list rows, the hero byline and profile stats. `rating` is the
 * net-rating variant — an up/down arrow whose colour follows the value's sign:
 * accent (positive) / error (negative) / muted (zero), so a zero rating reads
 * neutral and a negative one reads red rather than wearing a misleading heart.
 */
export function Metric({ kind, value, accent = false }: MetricProps) {
  if (kind === "rating") {
    const Icon = value < 0 ? ArrowDownIcon : ArrowUpIcon;
    const color =
      value > 0
        ? "var(--m-accent)"
        : value < 0
          ? "var(--m-error)"
          : "var(--m-muted)";
    return (
      <span
        className="inline-flex items-center gap-1 tabular-nums"
        style={{ color }}
      >
        <Icon className="size-3.5 shrink-0" />
        {fmt(value)}
      </span>
    );
  }

  const Icon = ICONS[kind];
  return (
    <span
      className={[
        "inline-flex items-center gap-1 tabular-nums",
        accent && "text-[var(--m-accent)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className="size-3.5 shrink-0" />
      {fmt(value)}
    </span>
  );
}
