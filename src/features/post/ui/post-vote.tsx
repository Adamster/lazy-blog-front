"use client";

import { HeartIcon, StarIcon } from "@heroicons/react/24/solid";
import { VoteDirection } from "@/shared/api/openapi";
import { BrokenHeartIcon } from "@/shared/ui";
import { useVotePost } from "../model/use-vote-post";

interface IProps {
  postId: string;
  postSlug: string;
  voteDirection: VoteDirection | null;
  /** REAL net rating from the API (upvotes − downvotes). */
  rating: number;
  /** Total upvotes (likes) the post has received. */
  likes: number;
  /** Total downvotes (dislikes) the post has received. */
  dislikes: number;
  /** Cumulative-rating series over time (drives the sparkline). */
  ratingSeries: readonly number[];
  /** Whether the current viewer is allowed to vote (auth'd & not the author). */
  canVote: boolean;
}

const fmt = (n: number) => n.toLocaleString("ru-RU");

// Smooth Catmull-Rom curve through the rating series, baseline at 0. Mirrors the
// design's inline math (viewBox 0..100 × 0..52, baseline at y=26) so negatives
// dip below the mid-line. preserveAspectRatio="none" stretches it edge-to-edge.
function buildRatingPath(series: readonly number[]) {
  const maxA = Math.max(1, ...series.map((v) => Math.abs(v)));
  const n = series.length;
  const X = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50);
  const Y = (v: number) => 26 - (v / maxA) * 22;
  const pts = series.map((v, i) => ({ x: X(i), y: Y(v) }));

  let d = pts.length ? `M ${pts[0].x} ${pts[0].y}` : "";
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
  const last = pts[pts.length - 1] ?? { x: 50, y: 26 };
  return { d, dotLeft: `${last.x}%`, dotTop: `${(last.y / 52) * 100}%` };
}

export const PostVote = ({
  postId,
  postSlug,
  voteDirection,
  rating,
  likes,
  dislikes,
  ratingSeries,
  canVote,
}: IProps) => {
  const handleVote = useVotePost(postId, postSlug);

  const liked = voteDirection === VoteDirection.Up;
  const disliked = voteDirection === VoteDirection.Down;

  // Send the clicked direction as-is; the backend toggles: no vote → set it,
  // same direction again → clear it (reset to 0), other direction → switch.
  // The optimistic `applyVote` mirrors that exact behaviour.
  const onVote = (direction: VoteDirection) => {
    if (!canVote || handleVote.isPending) return;
    handleVote.mutate({ direction });
  };

  const net = rating ?? 0;
  // Pin the curve's endpoint to the LIVE net rating so the sparkline follows a
  // vote without fabricating history: the server `ratingSeries` stays truthful;
  // only its last point tracks the current (optimistic) net.
  const chartSeries = ratingSeries.length
    ? [...ratingSeries.slice(0, -1), net]
    : [net];
  const { d, dotLeft, dotTop } = buildRatingPath(chartSeries);

  // Colour by sign: accent (positive) / error (negative) / muted (zero) — matches
  // the Metric. The end dot sits on the net point, so it shares the net's colour.
  const signColor = (v: number) =>
    v > 0 ? "var(--m-accent)" : v < 0 ? "var(--m-error)" : "var(--m-muted)";
  const netColor = signColor(net);
  const dotColor = netColor;

  const labelCls =
    "text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase";
  const subRowCls =
    "mt-2 flex items-center gap-1.5 text-[11px] leading-none tracking-[0.12em] whitespace-nowrap text-[var(--m-muted2)]";

  return (
    <section className="mx-[calc(50%-50vw)] mt-12 w-screen bg-[var(--m-card)]">
      <div className="mx-auto grid max-w-[780px] items-start gap-10 px-10 py-10 sm:grid-cols-3">
        {/* // LOVE IT — upvote toggle + total likes (left) */}
        <div className="min-w-0">
          <div className={labelCls}>{"// love it"}</div>
          <button
            type="button"
            onClick={() => onVote(VoteDirection.Up)}
            aria-pressed={liked}
            aria-label="Like this post"
            disabled={!canVote || handleVote.isPending}
            className={
              "font-display mt-2 inline-flex items-center gap-2.5 bg-transparent p-0 text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--m-card)] disabled:opacity-100 " +
              (liked
                ? "text-[var(--m-accent)]"
                : "text-[var(--m-muted2)] " +
                  (canVote ? "hover:text-[var(--m-accent)]" : "cursor-default"))
            }
          >
            {fmt(likes)}
            <HeartIcon className="size-5 flex-none" />
          </button>
          <div className={subRowCls}>
            <HeartIcon className="size-3.5 flex-none" />
            readers liked
          </div>
        </div>

        {/* // HATE IT — downvote toggle + total dislikes (middle) */}
        <div className="min-w-0">
          <div className={labelCls}>{"// hate it"}</div>
          <button
            type="button"
            onClick={() => onVote(VoteDirection.Down)}
            aria-pressed={disliked}
            aria-label="Dislike this post"
            disabled={!canVote || handleVote.isPending}
            className={
              "font-display mt-2 inline-flex items-center gap-2.5 bg-transparent p-0 text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--m-card)] disabled:opacity-100 " +
              (disliked
                ? "text-[var(--m-error)]"
                : "text-[var(--m-muted2)] " +
                  (canVote ? "hover:text-[var(--m-error)]" : "cursor-default"))
            }
          >
            {fmt(dislikes)}
            <BrokenHeartIcon className="size-5 flex-none" />
          </button>
          <div className={subRowCls}>
            <BrokenHeartIcon className="size-3.5 flex-none" />
            readers disliked
          </div>
        </div>

        {/* // RATING — cumulative-rating sparkline (green ≥0 / red <0) + net (right) */}
        <div className="min-w-0">
          <div className={labelCls}>{"// rating"}</div>
          <div className="relative mt-2 h-[46px] w-full overflow-visible">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[var(--m-dim)]" />
            <svg
              viewBox="0 0 100 52"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id="ratingSignGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="52"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stopColor="var(--m-accent)" />
                  <stop offset="0.5" stopColor="var(--m-accent)" />
                  <stop offset="0.5" stopColor="var(--m-error)" />
                  <stop offset="1" stopColor="var(--m-error)" />
                </linearGradient>
              </defs>
              <path
                d={d}
                fill="none"
                stroke="url(#ratingSignGrad)"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span
              aria-hidden
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: dotLeft, top: dotTop, backgroundColor: dotColor }}
            />
          </div>
          <div className={subRowCls}>
            <StarIcon
              aria-hidden
              className="size-3.5 shrink-0"
              style={{ color: netColor }}
            />
            net rating
            <span
              className="font-semibold tabular-nums"
              style={{ color: netColor }}
            >
              {net >= 0 ? `+${fmt(net)}` : fmt(net)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
