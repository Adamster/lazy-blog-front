"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import {
  NullableOfVoteDirection,
  VotePostDirectionEnum,
} from "@/shared/api/openapi";
import { useVotePost } from "../model/use-vote-post";

interface IProps {
  postId: string;
  postSlug: string;
  voteDirection: NullableOfVoteDirection | null;
  /** REAL net rating from the API (upvotes − downvotes). */
  rating: number;
  /** Whether the current viewer is allowed to vote (auth'd & not the author). */
  canVote: boolean;
}

// TODO(api): backend doesn't expose separate up/down counts or a rating
// time-series yet. Stubbed for the new design — swap these for real fields
// when the API lands. Net `rating` + `voteDirection` below are REAL.
const STUB = {
  likes: 412,
  dislikes: 18,
  // Seeded curve (like the design's mock) so the sparkline looks alive; the
  // tail trends toward the real net rating. Replace with the real series.
  ratingSeries: [-4, 5, 2, -3, 9, 15, 24],
} as const;

const fmt = (n: number) => n.toLocaleString("ru-RU");

// Broken-heart (dislike) glyph — matches the design's stroke svg.
const BrokenHeartIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.572a5 5 0 1 1 7.5 6.572" />
    <path d="M12 6l-2 4l3 3l-2 4" />
  </svg>
);

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
  canVote,
}: IProps) => {
  const handleVote = useVotePost(postId, postSlug);

  const liked = voteDirection === VotePostDirectionEnum.Up;
  const disliked = voteDirection === VotePostDirectionEnum.Down;

  // Toggle semantics: clicking the active direction sends the opposite so the
  // backend clears it; clicking the inactive direction switches the vote.
  const onVote = (direction: VotePostDirectionEnum, isActive: boolean) => {
    if (!canVote || handleVote.isPending) return;
    handleVote.mutate({
      direction: isActive
        ? direction === VotePostDirectionEnum.Up
          ? VotePostDirectionEnum.Down
          : VotePostDirectionEnum.Up
        : direction,
    });
  };

  const net = rating ?? 0;
  const { d, dotLeft, dotTop } = buildRatingPath(STUB.ratingSeries);

  const labelCls =
    "text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase";
  const subRowCls =
    "mt-2 flex items-center gap-1.5 text-[11px] tracking-[0.12em] whitespace-nowrap text-[var(--m-muted2)]";

  return (
    <section className="mx-[calc(50%-50vw)] mt-12 w-screen bg-[var(--m-card)]">
      <div className="mx-auto grid max-w-[780px] grid-cols-3 items-start gap-10 px-10 py-10">
        {/* // LIKE IT — upvote toggle (REAL vote, STUB count) */}
        <div className="min-w-0">
          <div className={labelCls}>{"// like it"}</div>
          <button
            type="button"
            onClick={() => onVote(VotePostDirectionEnum.Up, liked)}
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
            {fmt(STUB.likes)}
            <HeartIcon className="size-5 flex-none" />
          </button>
          <div className={subRowCls}>
            <HeartIcon className="size-3.5 flex-none" />
            readers liked
          </div>
        </div>

        {/* // DISLIKE IT — downvote toggle (REAL vote, STUB count) */}
        <div className="min-w-0">
          <div className={labelCls}>{"// dislike it"}</div>
          <button
            type="button"
            onClick={() => onVote(VotePostDirectionEnum.Down, disliked)}
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
            {fmt(STUB.dislikes)}
            <BrokenHeartIcon className="size-5 flex-none" />
          </button>
          <div className={subRowCls}>
            <BrokenHeartIcon className="size-3.5 flex-none" />
            readers disliked
          </div>
        </div>

        {/* // RATING — STUB sparkline + REAL net rating */}
        <div className="min-w-0">
          <div className={labelCls}>{"// rating"}</div>
          <div className="relative mt-3 h-[60px] w-full overflow-visible">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[var(--m-dim)]" />
            <svg
              viewBox="0 0 100 52"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <path
                d={d}
                fill="none"
                stroke="var(--m-accent)"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span
              aria-hidden
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--m-accent)]"
              style={{ left: dotLeft, top: dotTop }}
            />
          </div>
          <div className={subRowCls}>
            <span className="font-semibold text-[var(--m-accent)]">
              {net >= 0 ? `▲ +${fmt(net)}` : `▼ ${fmt(net)}`}
            </span>
            net rating
          </div>
        </div>
      </div>
    </section>
  );
};
