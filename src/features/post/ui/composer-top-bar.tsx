"use client";

import { EyeIcon, EyeSlashIcon, TrashIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Stepper } from "@/shared/ui";
import type { ComposerStep } from "./composer-step";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface ComposerTopBarProps {
  step: ComposerStep;
  /** Jump back to step 1 (unconditional). */
  onBack: () => void;
  /** Request the validated forward jump to step 2. */
  onForward: () => void;
  /** Exit the composer (Cancel) — the author profile or home. */
  cancelHref: string;
  /** Publish toggle state + setter (RHF-controlled by the parent). */
  published: boolean;
  onPublishedChange: (value: boolean) => void;
  /** Edit-only: opens the delete-confirmation modal (does NOT delete). */
  onDelete?: () => void;
  isPending: boolean;
}

/**
 * The composer command bar — one full-bleed `--m-card` band. LEFT: `← Cancel`
 * link · a 2px vertical divider · two numbered step boxes (1/2, generous
 * connector). RIGHT: the visibility eye (open = published/visible, slashed =
 * draft/hidden; toggles `isPublished`) · delete (icon-only, edit) · Publish
 * (icon-only rocket submit). Purely presentational; the parent owns the form,
 * validation, and the delete modal.
 */
export function ComposerTopBar({
  step,
  onBack,
  onForward,
  cancelHref,
  published,
  onPublishedChange,
  onDelete,
  isPending,
}: ComposerTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-6 py-5 md:px-10">
        {/* LEFT — cancel · divider · stepper */}
        <div className="flex items-center gap-5">
          <a
            href={cancelHref}
            className={`inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)] ${focusRing}`}
          >
            <span aria-hidden="true">←</span>
            Cancel
          </a>

          <span aria-hidden="true" className="h-5 w-0.5 bg-[var(--m-dim)]" />

          <Stepper
            steps={["Setup", "Write"]}
            current={step}
            onSelect={(s) => (s === 1 ? onBack() : onForward())}
          />
        </div>

        {/* RIGHT — visibility (eye) · delete · Publish */}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPublishedChange(!published)}
            aria-pressed={published}
            aria-label={
              published
                ? "Post is visible — hide it"
                : "Post is hidden — show it"
            }
            title={published ? "Visible (live)" : "Hidden (draft)"}
            className={`mono-icon-btn size-9 ${
              published ? "border-[var(--m-accent)] text-[var(--m-accent)]" : ""
            } ${focusRing}`}
          >
            {published ? (
              <EyeIcon className="size-3.5" />
            ) : (
              <EyeSlashIcon className="size-3.5" />
            )}
          </button>

          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete post"
              className={`mono-icon-btn size-9 text-[var(--m-error)] hover:border-[var(--m-error)] hover:text-[var(--m-error)] ${focusRing}`}
            >
              <TrashIcon className="size-3.5" />
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            aria-label="Publish"
            aria-busy={isPending}
            title="Publish"
            className={`mono-cta inline-flex size-9 shrink-0 items-center justify-center ${focusRing}`}
          >
            <RocketLaunchIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
