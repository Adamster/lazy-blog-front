import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./modal";

function Harness({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      {(close) => (
        <div>
          <h2>Sign in</h2>
          <button type="button" onClick={close}>
            First
          </button>
          <button type="button">Last</button>
        </div>
      )}
    </Modal>
  );
}

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(<Harness isOpen={false} onOpenChange={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders an accessible dialog when open and moves focus inside", () => {
    render(<Harness isOpen onOpenChange={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // Focus moved to the first focusable element in the dialog.
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("requests close on Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness isOpen onOpenChange={onOpenChange} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalled();
  });

  it("requests close when a child invokes the close callback", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness isOpen onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "First" }));
    expect(onOpenChange).toHaveBeenCalled();
  });

  it("traps focus — Tab past the last focusable wraps to the first", async () => {
    const user = userEvent.setup();
    render(<Harness isOpen onOpenChange={() => {}} />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    // The trap filters to visible focusables via `offsetParent`, which jsdom
    // does not lay out (always null). Stub it truthy so the visibility filter
    // mirrors a real browser; the trap logic under test is otherwise untouched.
    const visible = (el: HTMLElement) =>
      Object.defineProperty(el, "offsetParent", {
        configurable: true,
        get: () => document.body,
      });
    visible(first);
    visible(last);

    last.focus();
    await user.tab();
    expect(first).toHaveFocus();
  });

  it("restores focus to the trigger on close", async () => {
    const onOpenChange = vi.fn();
    function ToggleHarness() {
      return (
        <>
          <button type="button" id="trigger" data-testid="trigger">
            Open
          </button>
          <Modal isOpen onOpenChange={onOpenChange}>
            {() => <button type="button">Inside</button>}
          </Modal>
        </>
      );
    }
    const trigger = document.createElement("button");
    trigger.textContent = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const { unmount } = render(<ToggleHarness />);
    // Closing (unmounting) the open modal restores focus to the previously
    // focused trigger.
    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
