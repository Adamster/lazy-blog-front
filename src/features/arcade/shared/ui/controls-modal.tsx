"use client";

import { useEffect, useState } from "react";
import { Button, Modal, ModalHeader } from "@/shared/ui";
import { bindingLabel, rebind, type BindingMap } from "../model/key-bindings";

/**
 * Key-remapping modal for an arcade game: one row per action; click a row to arm
 * capture ("PRESS KEY…"), the next keydown binds that key (stealing it from any
 * other action); Escape cancels the capture. The capture listener runs in the
 * WINDOW capture phase with stopPropagation, so neither the game's key handler
 * nor the Modal's own document-level Escape-close sees the press. The host must
 * suspend its game keys while the modal is open (Tetris: `setKeysSuspended`).
 */
export function ControlsModal<A extends string>({
  isOpen,
  onOpenChange,
  actions,
  value,
  defaults,
  onChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  actions: readonly { id: A; label: string }[];
  value: BindingMap<A>;
  defaults: BindingMap<A>;
  onChange: (next: BindingMap<A>) => void;
}) {
  const [capturing, setCapturing] = useState<A | null>(null);

  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== "Escape") onChange(rebind<A>(value, capturing, e.code));
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, value, onChange]);

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
            subtitle="Click an action, then press its new key. Esc cancels."
            onClose={closeModal}
          />
          <div className="flex flex-col gap-4">
            {actions.map(({ id, label }) => {
              const active = capturing === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCapturing(active ? null : id)}
                  className={`mono-focus flex h-9 w-full items-center justify-between border-2 px-4 ${
                    active
                      ? "border-[var(--m-accent)]"
                      : "border-[var(--m-dim)]"
                  }`}
                >
                  <span className="text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
                    {label}
                  </span>
                  <span
                    className={`text-[11px] leading-none tracking-[0.12em] uppercase ${
                      active ? "text-[var(--m-accent)]" : "text-[var(--m-fg)]"
                    }`}
                  >
                    {active ? "PRESS KEY…" : bindingLabel(value[id])}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCapturing(null);
                onChange(defaults);
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
