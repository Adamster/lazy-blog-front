import { describe, expect, it } from "vitest";
import { postKeys } from "./post-keys";

// These keys are the SSR↔client hydration contract: the server seed and the
// client hook must produce byte-identical arrays. Asserting exact shapes guards
// against silent hydration misses and broken invalidation hierarchies.
describe("postKeys", () => {
  it("all/list share the home-feed root key", () => {
    expect(postKeys.all()).toEqual(["getAllPosts"]);
    expect(postKeys.list()).toEqual(["getAllPosts"]);
  });

  it("byUser nests userName under the feed root", () => {
    expect(postKeys.byUser("alice")).toEqual(["getPostsByUserName", "alice"]);
  });

  it("byUser without a name is the broad-invalidation prefix", () => {
    expect(postKeys.byUser()).toEqual(["getPostsByUserName"]);
  });

  it("byTag nests the tag under the feed root", () => {
    expect(postKeys.byTag("react")).toEqual(["getPostsByTag", "react"]);
  });

  it("byTag without a tag is the broad-invalidation prefix", () => {
    expect(postKeys.byTag()).toEqual(["getPostsByTag"]);
  });

  it("detail keys a single post by slug", () => {
    expect(postKeys.detail("hello-world")).toEqual([
      "getPostBySlug",
      "hello-world",
    ]);
  });

  it("byUser prefix is a structural prefix of its scoped key (precise invalidation)", () => {
    const prefix = postKeys.byUser();
    const scoped = postKeys.byUser("bob");
    expect(scoped.slice(0, prefix.length)).toEqual([...prefix]);
  });
});
