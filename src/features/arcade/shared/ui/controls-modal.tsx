"use client";

import { useEffect, useState } from "react";
import { Button, Modal, ModalHeader } from "@/shared/ui";
import { bindingLabel, rebind, type BindingMap } from "../model/key-bindings";

/**
 * Key/button-remapping modal for an arcade game: one row per action, two chips each
 * (keyboard, gamepad). Click a chip to arm capture ("PRESS KEY…" / "PRESS BUTTON…");
 * for a keyboard chip the next `keydown` binds it (stealing it from any other
 * action); for a gamepad chip the next polled button press binds it the same way.
 * Escape cancels either capture. The keyboard-capture listener runs in the WINDOW
 * capture phase with stopPropagation, so neither the game's key handler nor the
 * Modal's own document-level Escape-close sees the press. The host must suspend its
 * game keys while the modal is open (Tetris: `setKeysSuspended`).
 */
export function ControlsModal<A extends string>({
  isOpen,
  onOpenChange,
  actions,
  value,
  defaults,
  onChange,
  padValue,
  padDefaults,
  onPadChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  actions: readonly { id: A; label: string }[];
  value: BindingMap<A>;
  defaults: BindingMap<A>;
  onChange: (next: BindingMap<A>) => void;
  /** Gamepad counterpart of `value`/`defaults`/`onChange` — independent binding map. */
  padValue: BindingMap<A>;
  padDefaults: BindingMap<A>;
  onPadChange: (next: BindingMap<A>) => void;
}) {
  const [capturing, setCapturing] = useState<{
    action: A;
    kind: "key" | "pad";
  } | null>(null);

  // Keyboard capture — also the ONLY way to cancel a "pad" capture (Escape).
  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      if (capturing.kind === "pad" && e.code !== "Escape") return; // irrelevant to a pad capture
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        setCapturing(null);
        return;
      }
      onChange(rebind<A>(value, capturing.action, e.code));
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, value, onChange]);

  // Gamepad capture — poll for the first NEW button press (edge), assign it.
  useEffect(() => {
    if (!capturing || capturing.kind !== "pad") return;
    let raf = 0;
    let prevPressed: boolean[] = [];
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
        const pressedIndex = nowPressed.findIndex(
          (p, i) => p && !prevPressed[i]
        );
        if (pressedIndex !== -1) {
          onPadChange(
            rebind<A>(padValue, capturing.action, `Pad${pressedIndex}`)
          );
          setCapturing(null);
          return;
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
            subtitle="Click a slot, then press its new key or button. Esc cancels."
            onClose={closeModal}
          />
          <div className="flex flex-col gap-4">
            {actions.map(({ id, label }) => {
              const keyActive =
                capturing?.action === id && capturing.kind === "key";
              const padActive =
                capturing?.action === id && capturing.kind === "pad";
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
                    {label}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      aria-label={`${label} — keyboard`}
                      onClick={() =>
                        setCapturing(
                          keyActive ? null : { action: id, kind: "key" }
                        )
                      }
                      className={`mono-focus flex h-9 flex-1 items-center justify-center border-2 px-4 ${
                        keyActive
                          ? "border-[var(--m-accent)]"
                          : "border-[var(--m-dim)]"
                      }`}
                    >
                      <span
                        className={`text-[11px] leading-none tracking-[0.12em] uppercase ${
                          keyActive
                            ? "text-[var(--m-accent)]"
                            : "text-[var(--m-fg)]"
                        }`}
                      >
                        {keyActive ? "PRESS KEY…" : bindingLabel(value[id])}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${label} — gamepad`}
                      onClick={() =>
                        setCapturing(
                          padActive ? null : { action: id, kind: "pad" }
                        )
                      }
                      className={`mono-focus flex h-9 flex-1 items-center justify-center border-2 px-4 ${
                        padActive
                          ? "border-[var(--m-accent)]"
                          : "border-[var(--m-dim)]"
                      }`}
                    >
                      <span
                        className={`text-[11px] leading-none tracking-[0.12em] uppercase ${
                          padActive
                            ? "text-[var(--m-accent)]"
                            : "text-[var(--m-fg)]"
                        }`}
                      >
                        {padActive
                          ? "PRESS BUTTON…"
                          : bindingLabel(padValue[id])}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCapturing(null);
                onChange(defaults);
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
