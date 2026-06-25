import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders the LATEST DROP status text", () => {
    render(<StatusBadge status="LATEST DROP" />);
    expect(screen.getByText("LATEST DROP")).toBeInTheDocument();
  });

  it("renders the PINNED status text", () => {
    render(<StatusBadge status="PINNED" />);
    expect(screen.getByText("PINNED")).toBeInTheDocument();
  });

  it("merges extra className utilities onto the badge", () => {
    render(<StatusBadge status="PINNED" className="absolute" />);
    expect(screen.getByText("PINNED")).toHaveClass("absolute");
  });
});
