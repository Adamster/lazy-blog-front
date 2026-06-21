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
  /** Publish toggle state + setter (RHF-controlled by the parent). */
  published: boolean;
  onPublishedChange: (value: boolean) => void;
  /** Edit-only: opens the delete-confirmation modal (does NOT delete). */
  onDelete?: () => void;
  isPending: boolean;
}

/**
 * The composer command bar — one full-bleed `--m-card` band. LEFT: the two
 * numbered step boxes (1/2). RIGHT: the visibility eye (open = published/
 * visible, slashed = draft/hidden; toggles `isPublished`) · delete (icon-only,
 * edit) · Publish (icon-only rocket submit). Cancel lives in the step footer.
 * Purely presentational; the parent owns the form, validation, delete modal.
 */
export function ComposerTopBar({
  step,
  onBack,
  onForward,
  published,
  onPublishedChange,
  onDelete,
  isPending,
}: ComposerTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-6 py-5 md:px-10">
        {/* LEFT — stepper (Cancel moved to the step footer) */}
        <Stepper
          steps={["Setup", "Write"]}
          current={step}
          onSelect={(s) => (s === 1 ? onBack() : onForward())}
        />

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
