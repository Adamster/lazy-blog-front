import { beforeEach, describe, expect, it } from "vitest";
import {
  bindingLabel,
  keyLabel,
  loadBindings,
  rebind,
  saveBindings,
  type BindingMap,
} from "./key-bindings";

type Act = "left" | "right" | "fire";
const DEFAULTS: BindingMap<Act> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  fire: ["Space"],
};
const KEY = "test.keys.v1";

beforeEach(() => window.localStorage.clear());

describe("rebind", () => {
  it("assigns the code as the action's ONLY key", () => {
    const next = rebind(DEFAULTS, "fire", "KeyF") as BindingMap<Act>;
    expect(next.fire).toEqual(["KeyF"]);
  });

  it("steals the code from any other action holding it", () => {
    const next = rebind(DEFAULTS, "fire", "KeyA") as BindingMap<Act>;
    expect(next.fire).toEqual(["KeyA"]);
    expect(next.left).toEqual(["ArrowLeft"]);
  });
});

describe("load/save", () => {
  it("round-trips through localStorage", () => {
    saveBindings(KEY, rebind(DEFAULTS, "fire", "KeyF"));
    expect(loadBindings(KEY, DEFAULTS).fire).toEqual(["KeyF"]);
  });

  it("falls back to defaults on corrupt storage", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(loadBindings(KEY, DEFAULTS)).toEqual(DEFAULTS);
  });

  it("ignores unknown actions and non-string junk in stored data", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ fire: ["KeyF"], bogus: ["KeyB"], left: [1, 2] })
    );
    const map = loadBindings(KEY, DEFAULTS);
    expect(map.fire).toEqual(["KeyF"]);
    expect(map.left).toEqual(DEFAULTS.left); // junk list rejected
  });
});

describe("labels", () => {
  it("maps arrows/space to glyphs and Key*/Digit* to bare characters", () => {
    expect(keyLabel("ArrowLeft")).toBe("←");
    expect(keyLabel("Space")).toBe("SPACE");
    expect(keyLabel("KeyA")).toBe("A");
    expect(keyLabel("Digit1")).toBe("1");
  });

  it("joins a binding list and renders an empty one as an em-dash", () => {
    expect(bindingLabel(["ArrowUp", "KeyX"])).toBe("↑ / X");
    expect(bindingLabel([])).toBe("—");
  });
});
