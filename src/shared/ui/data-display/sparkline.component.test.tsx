import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Sparkline } from "./sparkline";

const flat = ["Jan", "Feb", "Mar"].map((label) => ({ label, count: 0 }));
const active = [
  { label: "Jan", count: 0 },
  { label: "Feb", count: 2 },
  { label: "Mar", count: 1 },
];

describe("Sparkline tone", () => {
  it("renders a muted line and dots, and no gradient area, for an all-zero series", () => {
    const { container } = render(
      <Sparkline series={flat} gradientId="t-empty" ariaLabel="empty" />
    );
    const line = container.querySelector('path[fill="none"]')!;
    expect(line.getAttribute("stroke")).toBe("var(--m-muted2)");
    expect(container.querySelector('path[fill^="url("]')).toBeNull();
    const dot = container.querySelector("span[aria-hidden]") as HTMLElement;
    expect(dot.style.backgroundColor).toBe("var(--m-muted2)");
  });

  it("renders the accent line, dots and gradient area when the series has data", () => {
    const { container } = render(
      <Sparkline series={active} gradientId="t-data" ariaLabel="data" />
    );
    const line = container.querySelector('path[fill="none"]')!;
    expect(line.getAttribute("stroke")).toBe("var(--m-accent)");
    expect(container.querySelector('path[fill^="url("]')).not.toBeNull();
    const dot = container.querySelector("span[aria-hidden]") as HTMLElement;
    expect(dot.style.backgroundColor).toBe("var(--m-accent)");
  });
});
