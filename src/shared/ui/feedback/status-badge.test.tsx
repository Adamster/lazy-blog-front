import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders the LATEST DROP status text", () => {
    render(<StatusBadge status="LATEST DROP" />);
    expect(screen.getByText("LATEST DROP")).toBeInTheDocument();
  });

  it("renders the FEATURED status text", () => {
    render(<StatusBadge status="FEATURED" />);
    expect(screen.getByText("FEATURED")).toBeInTheDocument();
  });

  it("merges extra className utilities onto the badge", () => {
    const { container } = render(
      <StatusBadge status="FEATURED" className="absolute" />
    );
    expect(container.firstElementChild).toHaveClass("absolute");
  });
});
