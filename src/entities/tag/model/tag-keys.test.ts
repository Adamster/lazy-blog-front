import { describe, expect, it } from "vitest";
import { tagKeys } from "./tag-keys";

describe("tagKeys", () => {
  it("all keys the tag list", () => {
    expect(tagKeys.all()).toEqual(["getTags"]);
  });
});
