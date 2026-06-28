import type { PostsPerMonth } from "@/shared/api/openapi";

interface SparklinePoint {
  label: string;
  count: number;
}

export function seriesFromMonths(
  months: PostsPerMonth[],
  count = 6
): SparklinePoint[] {
  const counts = new Map<string, number>();
  for (const m of months) {
    // month is 1-based on the wire; key on the 0-based JS month.
    counts.set(`${m.year}-${m.month - 1}`, m.count);
  }

  const end = new Date();
  const series: SparklinePoint[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const d = new Date(end.getFullYear(), end.getMonth() - offset, 1);
    series.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      count: counts.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0,
    });
  }
  return series;
}

export function buildMonthlySeries(
  dates: (string | Date)[],
  months = 6,
  // Anchor at current month (rolling window) so an old last-post doesn't show a stale window.
  anchorNow = false
): SparklinePoint[] {
  const counts = new Map<string, number>();
  let anchor: Date | null = null;
  for (const raw of dates) {
    const d = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!anchor || d.getTime() > anchor.getTime()) anchor = d;
  }

  const end = anchorNow ? new Date() : (anchor ?? new Date());
  const series: SparklinePoint[] = [];
  for (let offset = months - 1; offset >= 0; offset--) {
    const m = new Date(end.getFullYear(), end.getMonth() - offset, 1);
    const key = `${m.getFullYear()}-${m.getMonth()}`;
    series.push({
      label: m.toLocaleDateString("en-US", { month: "short" }),
      count: counts.get(key) ?? 0,
    });
  }
  return series;
}

// preserveAspectRatio="none" stretches the curve full-width; dots can't live
// inside a stretched SVG (circles become ovals) so they render as an HTML % overlay.
const VB_W = 100;
const VB_H = 52;
const PAD_TOP = 4;
const PAD_BOTTOM = 8; // Catmull-Rom can dip below the lowest point — extra room to avoid clipping.
const PLOT_H = 46;

const px = (i: number, len: number) =>
  len > 1 ? (i / (len - 1)) * VB_W : VB_W / 2;
const py = (count: number, max: number) =>
  PAD_TOP + (1 - count / max) * (VB_H - PAD_TOP - PAD_BOTTOM);

// Catmull-Rom → cubic bézier smoothing.
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function Sparkline({
  series,
  gradientId,
  ariaLabel,
  showLabels = true,
  labelClassName = "text-[var(--m-muted2)]",
}: {
  series: SparklinePoint[];
  /** Unique per instance — two gradients with the same id collide in the DOM. */
  gradientId: string;
  ariaLabel: string;
  showLabels?: boolean;
  labelClassName?: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const pts = series.map((s, i) => ({
    x: px(i, series.length),
    y: py(s.count, max),
  }));
  const line = smoothPath(pts);
  const area =
    pts.length > 0
      ? `${line} L ${pts[pts.length - 1].x} ${VB_H} L ${pts[0].x} ${VB_H} Z`
      : "";

  return (
    <div className="w-full" role="img" aria-label={ariaLabel}>
      <div
        className="relative w-full overflow-visible"
        style={{ height: PLOT_H }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--m-accent)"
                stopOpacity="0.18"
              />
              <stop offset="100%" stopColor="var(--m-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--m-accent)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {pts.map((p, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute size-[5px] -translate-x-1/2 -translate-y-1/2 bg-[var(--m-accent)]"
            style={{ left: `${p.x}%`, top: `${(p.y / VB_H) * 100}%` }}
          />
        ))}
      </div>
      {showLabels && (
        <div className="relative mt-2 h-[14px] w-full">
          {series.map((s, i) => (
            <span
              key={`${s.label}-${i}`}
              className={`absolute -translate-x-1/2 text-[11px] ${labelClassName}`}
              style={{ left: `${px(i, series.length)}%` }}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
