import { describe, expect, it } from "vitest";
import { commentKeys } from "./comment-keys";

describe("commentKeys", () => {
  it("byPost keys a post's comment thread", () => {
    expect(commentKeys.byPost("p1")).toEqual(["getCommentsByPostId", "p1"]);
  });
});
