"use client";

import { Fragment, useEffect, useState } from "react";
import { Button, Modal, ModalHeader } from "@/shared/ui";
import { bindingLabel, rebind, type BindingMap } from "../model/key-bindings";
import { codeGlyph, KbdBadge } from "./board-overlay";

/** One gamepad capture chip inside a `ControlsModal` action row — a fixed 36px
 * (`h-9`) TRANSPARENT outline button (no own fill — the raised fill lives on the
 * inner key-caps, below), its border revealing accent on hover
 * (`hover:border-[var(--m-accent)]`, the shared `.mono-btn-outline` treatment) and
 * pinned accent while armed. Renders the current binding as `filled` icon-glyph
 * key-caps (the {@link KbdBadge} language shared with the menu key-hint rows, here
 * carrying the `--m-card` keycap fill so each key reads as a raised cap against the
 * transparent chip), or the plain "PRESS BUTTON…" placeholder while armed. Each
 * bound code becomes its own COMPACT keycap (`codeGlyph(code, true)` — `size-3`
 * icons a notch down from the menu's `size-3.5`) on the shared 20px square floor,
 * sitting `gap-1` apart (a chip only ever holds ONE action's alternates, so no `·`
 * separator); an unbound action shows the plain "—" mark. `aria-label` keeps the
 * spelled-out binding text for screen readers even though the visible chip is
 * icons. */
function CaptureChip({
  active,
  ariaLabel,
  codes,
  onClick,
}: {
  active: boolean;
  ariaLabel: string;
  codes: readonly string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`mono-focus flex h-9 w-full items-center justify-center border-2 px-4 transition-colors ${
        active
          ? "border-[var(--m-accent)]"
          : "border-[var(--m-dim)] hover:border-[var(--m-accent)]"
      }`}
    >
      {active ? (
        <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-accent)] uppercase">
          PRESS BUTTON…
        </span>
      ) : codes.length === 0 ? (
        <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase">
          —
        </span>
      ) : (
        <span className="flex items-center gap-1">
          {codes.map((code, i) => (
            <KbdBadge key={i} size="h-5 min-w-5 px-0.5" filled>
              {codeGlyph(code, true)}
            </KbdBadge>
          ))}
        </span>
      )}
    </button>
  );
}

/** Static, non-interactive display of the current KEYBOARD binding for one
 *  action — same keycap language as {@link CaptureChip}, but a plain `<div>`:
 *  no hover/active state, no click handler. Keyboard is informational only. */
function KeyInfoChip({
  codes,
  ariaLabel,
}: {
  codes: readonly string[];
  ariaLabel: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="flex h-9 w-full items-center justify-center border-2 border-[var(--m-dim)] px-4"
    >
      {codes.length === 0 ? (
        <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase">
          —
        </span>
      ) : (
        <span className="flex items-center gap-1">
          {codes.map((code, i) => (
            <KbdBadge key={i} size="h-5 min-w-5 px-0.5" filled>
              {codeGlyph(code, true)}
            </KbdBadge>
          ))}
        </span>
      )}
    </div>
  );
}

/**
 * Gamepad-remapping modal for an arcade game: one row per action, an optional
 * informational keyboard column (current PC keys, not clickable) + a rebindable
 * gamepad chip. Click the gamepad chip to arm capture ("PRESS BUTTON…"); the
 * next polled button press binds it (stealing it from any other action).
 * Escape cancels an armed capture. The host must suspend its game keys while
 * the modal is open (all three games: `setKeysSuspended`).
 */
export function ControlsModal<A extends string>({
  isOpen,
  onOpenChange,
  actions,
  keyboardValue,
  padValue,
  padDefaults,
  onPadChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  actions: readonly { id: A; label: string }[];
  /** Informational only — current keyboard binding per action, rendered as
   *  static (non-clickable) chips. Omit to hide the keyboard column entirely. */
  keyboardValue?: BindingMap<A>;
  padValue: BindingMap<A>;
  padDefaults: BindingMap<A>;
  onPadChange: (next: BindingMap<A>) => void;
}) {
  const keyboardShown = keyboardValue !== undefined;
  const [capturing, setCapturing] = useState<A | null>(null);

  // Escape cancels an armed gamepad capture.
  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing]);

  // Gamepad capture — poll for the first NEW button press (edge), assign it.
  useEffect(() => {
    if (!capturing) return;
    let raf = 0;
    let prevPressed: boolean[] | null = null; // null = no baseline captured yet
    const poll = () => {
      const pads =
        typeof navigator !== "undefined" && navigator.getGamepads
          ? navigator.getGamepads()
          : [];
      const gp = Array.from(pads ?? []).find(
        (p): p is Gamepad => !!p && p.connected
      );
      if (gp) {
        const nowPressed = gp.buttons.map((b) => b.pressed);
        if (prevPressed) {
          const pressedIndex = nowPressed.findIndex(
            (p, i) => p && !prevPressed![i]
          );
          if (pressedIndex !== -1) {
            onPadChange(rebind<A>(padValue, capturing, `Pad${pressedIndex}`));
            setCapturing(null);
            return;
          }
        }
        prevPressed = nowPressed;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [capturing, padValue, onPadChange]);

  const close = () => {
    setCapturing(null);
    onOpenChange();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={close}
      width="md"
      labelledBy="arcade-controls-title"
    >
      {(closeModal) => (
        <>
          <ModalHeader
            eyebrow="// ARCADE"
            title="Controls"
            titleId="arcade-controls-title"
            subtitle="Click a slot, then press its new button. Esc cancels."
            onClose={closeModal}
          />
          <div
            className={`grid items-center gap-x-3 gap-y-4 ${
              keyboardShown
                ? "grid-cols-[auto_1fr_1fr]"
                : "grid-cols-[auto_1fr]"
            }`}
          >
            {actions.map(({ id, label }) => {
              const padActive = capturing === id;
              return (
                <Fragment key={id}>
                  <span className="text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
                    {label}
                  </span>
                  {keyboardShown && (
                    <KeyInfoChip
                      codes={keyboardValue![id]}
                      ariaLabel={`${label} — keyboard: ${bindingLabel(keyboardValue![id])}`}
                    />
                  )}
                  <CaptureChip
                    active={padActive}
                    ariaLabel={`${label} — gamepad: ${padActive ? "press button" : bindingLabel(padValue[id])}`}
                    codes={padValue[id]}
                    onClick={() => setCapturing(padActive ? null : id)}
                  />
                </Fragment>
              );
            })}
          </div>
          {/* One-off exception: a 2px `--m-dim` top rule caps this unusually
              dense modal (8 rows × 2 chip columns) so the Reset/Done footer reads
              as separated — every OTHER modal is spacing-only here. Same 2px
              `--m-dim` weight/token as the Tetris-menu rule. The rule sits with
              symmetric 24px air on BOTH sides: `mt-6` (outside the border box)
              separates it from the last action row, `pt-6` (inside) separates it
              from the buttons — so the line never collides with the PAUSE row's
              chip borders. */}
          <div className="mt-6 flex justify-end gap-3 border-t-2 border-[var(--m-dim)] pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setCapturing(null);
                onPadChange(padDefaults);
              }}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={closeModal}>
              Done
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
