import {
  HeartIcon,
  EyeIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/solid";

/** Locale number formatting shared by every mono metric/count. */
export const fmt = (n?: number) => (n ?? 0).toLocaleString("ru-RU");

const ICONS = {
  likes: HeartIcon,
  views: EyeIcon,
  posts: DocumentTextIcon,
  comments: ChatBubbleLeftIcon,
} as const;

interface MetricProps {
  kind: keyof typeof ICONS;
  value: number;
  /** Tint the metric with the accent color (e.g. an up-voted post's likes). */
  accent?: boolean;
}

/**
 * Icon + number metric (likes / views / posts / comments) used in feed cards,
 * list rows, the hero byline and profile stats. Consolidates the two
 * previously-duplicated `Metric` definitions in rewrite-home-page and
 * rewrite-user-page.
 */
export function Metric({ kind, value, accent = false }: MetricProps) {
  const Icon = ICONS[kind];
  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums${
        accent ? "text-[var(--m-accent)]" : ""
      }`}
    >
      <Icon className="size-3.5 shrink-0" />
      {fmt(value)}
    </span>
  );
}
