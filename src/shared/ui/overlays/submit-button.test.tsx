import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubmitButton } from "./modal";

describe("SubmitButton", () => {
  it("renders its children as a submit button", () => {
    render(<SubmitButton>Sign in</SubmitButton>);
    const btn = screen.getByRole("button", { name: "Sign in" });
    expect(btn).toHaveAttribute("type", "submit");
    expect(btn).not.toBeDisabled();
  });

  it("is disabled and shows the pending label while pending", () => {
    render(
      <SubmitButton pending pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    );
    const btn = screen.getByRole("button", { name: "Signing in…" });
    expect(btn).toBeDisabled();
  });

  it("falls back to children when pending without a pendingLabel", () => {
    render(<SubmitButton pending>Sign in</SubmitButton>);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });
});
