import { describe, it, expect } from "vitest";
import {
  canEditComment,
  editWindowRemainingMs,
  COMMENT_EDIT_WINDOW_MS,
} from "./comment-edit-window";

const now = Date.UTC(2026, 5, 26, 12, 0, 0);
const ago = (ms: number) => new Date(now - ms);

describe("canEditComment — 1-hour edit window", () => {
  it("allows a just-created comment", () => {
    expect(canEditComment(ago(0), now)).toBe(true);
  });

  it("allows a comment created within the hour", () => {
    expect(canEditComment(ago(59 * 60 * 1000), now)).toBe(true);
  });

  it("locks a comment exactly at the window edge", () => {
    expect(canEditComment(ago(COMMENT_EDIT_WINDOW_MS), now)).toBe(false);
  });

  it("locks a comment past the hour", () => {
    expect(canEditComment(ago(61 * 60 * 1000), now)).toBe(false);
  });

  it("accepts an ISO string as well as a Date", () => {
    expect(canEditComment(ago(10 * 60 * 1000).toISOString(), now)).toBe(true);
  });

  it("fails closed on an unparseable timestamp", () => {
    expect(canEditComment("not-a-date", now)).toBe(false);
  });
});

describe("editWindowRemainingMs", () => {
  it("reports the remaining time inside the window", () => {
    expect(editWindowRemainingMs(ago(20 * 60 * 1000), now)).toBe(
      40 * 60 * 1000
    );
  });

  it("clamps to 0 once closed", () => {
    expect(editWindowRemainingMs(ago(2 * 60 * 60 * 1000), now)).toBe(0);
  });

  it("returns 0 on an unparseable timestamp", () => {
    expect(editWindowRemainingMs("nope", now)).toBe(0);
  });
});
