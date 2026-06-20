import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("exposes role=switch with the correct aria-checked state", () => {
    render(<Switch label="Notify" checked={false} onChange={() => {}} />);
    const sw = screen.getByRole("switch", { name: "Notify" });
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("reflects the checked prop", () => {
    render(<Switch label="Notify" checked onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the toggled value on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Notify" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles via keyboard (Space)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Notify" checked onChange={onChange} />);
    screen.getByRole("switch").focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not fire onChange when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Switch label="Notify" checked={false} disabled onChange={onChange} />
    );
    await user.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
