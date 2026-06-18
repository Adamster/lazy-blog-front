interface SparklinePoint {
  label: string;
  count: number;
}

/**
 * Build a CONTINUOUS run of `months` consecutive monthly buckets (oldest →
 * newest), counting `dates` per month (0 for empty months) so the axis reads
 * e.g. "Jan Feb Mar Apr May Jun" with no gaps. The window is anchored at the
 * most recent date's month, falling back to the current month when empty.
 */
export function buildMonthlySeries(
  dates: (string | Date)[],
  months = 6
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

  const end = anchor ?? new Date();
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

// The line + area SVG uses a 0..100 x viewBox with preserveAspectRatio="none"
// so the curve+area STRETCH to the full container width edge-to-edge. The
// stroke stays crisp via vector-effect="non-scaling-stroke". Dots can't live
// inside a stretched SVG (circles become ovals), so they render as an HTML
// overlay of perfectly round elements positioned in %.
const VB_W = 100;
const VB_H = 52;
const PAD_TOP = 4; // top breathing room inside the viewBox
const PAD_BOTTOM = 8; // extra bottom room so low points + curve undershoot
// (Catmull-Rom can dip slightly below the lowest data point) never touch the
// baseline / get clipped by the box edge.
const PLOT_H = 46; // rendered pixel height of the plot area (footprint stays ~46px)

const px = (i: number, len: number) =>
  len > 1 ? (i / (len - 1)) * VB_W : VB_W / 2;
const py = (count: number, max: number) =>
  PAD_TOP + (1 - count / max) * (VB_H - PAD_TOP - PAD_BOTTOM);

// Catmull-Rom -> cubic bézier: a smooth curve through every data point.
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

/**
 * Mono sparkline: smooth curve through monthly counts, soft accent gradient
 * fill stretched full-width, and round accent dots (HTML overlay) at each data
 * point. Owns its own month-label row so labels sit EXACTLY under their dots
 * (same `i/(n-1)*100%` x-coordinate system). Identical look on every page.
 */
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
  /** Render the month labels row under the plot (centered under each dot). */
  showLabels?: boolean;
  /** Color/tracking of the month labels — pass the same as the panel's other
   *  columns' bottom rows so the whole row reads consistently. */
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
            className="absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--m-accent)]"
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
