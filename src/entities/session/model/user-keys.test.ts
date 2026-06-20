import { describe, expect, it } from "vitest";
import { userKeys } from "./user-keys";

describe("userKeys", () => {
  it("byId keys a single user", () => {
    expect(userKeys.byId("u1")).toEqual(["getUserById", "u1"]);
  });

  it("byId without an id is the all-users prefix (logout clear)", () => {
    expect(userKeys.byId()).toEqual(["getUserById"]);
  });

  it("the no-id prefix structurally prefixes a scoped key", () => {
    const prefix = userKeys.byId();
    const scoped = userKeys.byId("u1");
    expect(scoped.slice(0, prefix.length)).toEqual([...prefix]);
  });
});
