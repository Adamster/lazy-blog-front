import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Label } from "./label";

describe("Label", () => {
  it("defaults to the accent section-eyebrow class only", () => {
    const { container } = render(<Label>POSTS</Label>);
    const el = container.firstElementChild!;
    expect(el.className).toContain("mono-label");
    expect(el.className).not.toContain("text-[var(--m-muted2)]");
  });

  it("tone=muted appends the muted2 data-label override", () => {
    const { container } = render(<Label tone="muted">KARMA</Label>);
    const el = container.firstElementChild!;
    expect(el.className).toContain("mono-label");
    expect(el.className).toContain("text-[var(--m-muted2)]");
  });

  it("still renders the // prefix", () => {
    const { container } = render(<Label tone="muted">KARMA</Label>);
    expect(container.textContent).toContain("// KARMA");
  });
});
