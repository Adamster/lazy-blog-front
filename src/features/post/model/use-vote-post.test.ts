import { describe, expect, it } from "vitest";
import type { PostDetailedResponse } from "@/shared/api/openapi";
import { VotePostDirectionEnum } from "@/shared/api/openapi";
import { applyVote } from "./use-vote-post";

// Minimal post fixture — `applyVote` only reads `rating` + `voteDirection`, but
// it must preserve every other field untouched (it spreads `...post`).
function makePost(
  overrides: Partial<PostDetailedResponse> = {}
): PostDetailedResponse {
  return {
    rating: 0,
    voteDirection: null,
    title: "Title",
    slug: "slug",
    ...overrides,
  } as PostDetailedResponse;
}

describe("applyVote", () => {
  it("up-votes an unvoted post (+1, direction Up)", () => {
    const next = applyVote(makePost({ rating: 5 }), VotePostDirectionEnum.Up);
    expect(next.rating).toBe(6);
    expect(next.voteDirection).toBe(VotePostDirectionEnum.Up);
  });

  it("down-votes an unvoted post (-1, direction Down)", () => {
    const next = applyVote(makePost({ rating: 5 }), VotePostDirectionEnum.Down);
    expect(next.rating).toBe(4);
    expect(next.voteDirection).toBe(VotePostDirectionEnum.Down);
  });

  it("toggles an active up-vote off (-1, direction null)", () => {
    const post = makePost({
      rating: 6,
      voteDirection: VotePostDirectionEnum.Up,
    });
    const next = applyVote(post, VotePostDirectionEnum.Up);
    expect(next.rating).toBe(5);
    expect(next.voteDirection).toBeNull();
  });

  it("toggles an active down-vote off (+1, direction null)", () => {
    const post = makePost({
      rating: 4,
      voteDirection: VotePostDirectionEnum.Down,
    });
    const next = applyVote(post, VotePostDirectionEnum.Down);
    expect(next.rating).toBe(5);
    expect(next.voteDirection).toBeNull();
  });

  it("flips down → up as a +2 swing", () => {
    const post = makePost({
      rating: 4,
      voteDirection: VotePostDirectionEnum.Down,
    });
    const next = applyVote(post, VotePostDirectionEnum.Up);
    expect(next.rating).toBe(6);
    expect(next.voteDirection).toBe(VotePostDirectionEnum.Up);
  });

  it("flips up → down as a -2 swing", () => {
    const post = makePost({
      rating: 6,
      voteDirection: VotePostDirectionEnum.Up,
    });
    const next = applyVote(post, VotePostDirectionEnum.Down);
    expect(next.rating).toBe(4);
    expect(next.voteDirection).toBe(VotePostDirectionEnum.Down);
  });

  it("is pure — does not mutate the input post", () => {
    const post = makePost({ rating: 5 });
    const snapshot = { ...post };
    applyVote(post, VotePostDirectionEnum.Up);
    expect(post).toEqual(snapshot);
  });

  it("preserves unrelated fields", () => {
    const post = makePost({ rating: 5, title: "Kept", slug: "kept-slug" });
    const next = applyVote(post, VotePostDirectionEnum.Up);
    expect(next.title).toBe("Kept");
    expect(next.slug).toBe("kept-slug");
  });
});
