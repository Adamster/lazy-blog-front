import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarIcon } from "@heroicons/react/24/solid";
import { Stat, signColor } from "./stat";

describe("signColor", () => {
  it("maps sign to the design tokens", () => {
    expect(signColor(1240)).toBe("var(--m-accent)");
    expect(signColor(-12)).toBe("var(--m-error)");
    expect(signColor(0)).toBe("var(--m-muted)");
  });
});

describe("Stat", () => {
  it("renders a muted data label, a sign-colored value and the sub row", () => {
    render(
      <Stat
        label="KARMA"
        value="1,240"
        signOf={1240}
        sub="net rating"
        subIcon={StarIcon}
      />
    );
    expect(screen.getByText(/KARMA/).className).toContain(
      "text-[var(--m-muted2)]"
    );
    expect(screen.getByText("1,240")).toHaveStyle({
      color: "var(--m-accent)",
    });
    expect(screen.getByText("net rating")).toBeInTheDocument();
  });

  it("renders a zero value muted", () => {
    render(<Stat label="TOTAL VIEWS" value="0" signOf={0} />);
    expect(screen.getByText("0")).toHaveStyle({ color: "var(--m-muted)" });
  });

  it("swaps the value for a spinner while loading", () => {
    render(<Stat label="BEST" value="512" signOf={512} loading />);
    expect(screen.queryByText("512")).toBeNull();
  });
});
