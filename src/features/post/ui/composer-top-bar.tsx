"use client";

import {
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Stepper } from "@/shared/ui";
import type { ComposerStep } from "./composer-step";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface ComposerTopBarProps {
  step: ComposerStep;
  /** Where the ✕ Cancel abort link exits to (CREATE only — author profile /
   *  home). Omit in edit mode to hide Cancel entirely (nothing to abort). */
  cancelHref?: string;
  /** Jump to a step (unconditional — switching is free, no validation gate). */
  onSelectStep: (step: ComposerStep) => void;
  /** 1-based steps that currently hold validation errors (Stepper error layer). */
  errorSteps: number[];
  /** Publish toggle state + setter (RHF-controlled by the parent). */
  published: boolean;
  onPublishedChange: (value: boolean) => void;
  /** Edit-only: opens the delete-confirmation modal (does NOT delete). */
  onDelete?: () => void;
  /** Edit-only: link to the live post page, so the author can go check it. */
  viewHref?: string;
  isPending: boolean;
}

/**
 * The composer command bar — one full-bleed `--m-card` band. LEFT: the two
 * numbered step boxes (1/2), preceded by the ✕ Cancel abort link + a 2px
 * divider. RIGHT: the visibility eye (open = published/visible, slashed =
 * draft/hidden; toggles `isPublished`) · delete (icon-only, edit) · Publish
 * (icon-only rocket submit). Cancel is an ABORT, so it carries a close ✕ glyph,
 * never a directional arrow (arrows mark navigation only — that's the step
 * boxes). Purely presentational; the parent owns the form, validation, modal.
 */
export function ComposerTopBar({
  step,
  cancelHref,
  onSelectStep,
  errorSteps,
  published,
  onPublishedChange,
  onDelete,
  viewHref,
  isPending,
}: ComposerTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-10 py-5">
        {/* LEFT — ✕ Cancel (create only) · 2px divider · stepper */}
        <div className="flex items-center gap-5">
          {cancelHref ? (
            <>
              <a
                href={cancelHref}
                aria-label="Cancel"
                className={`inline-flex items-center gap-2.5 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)] ${focusRing}`}
              >
                <XMarkIcon aria-hidden="true" className="size-3.5" />
                <span className="hidden md:inline">Cancel</span>
              </a>
              <span
                aria-hidden="true"
                className="h-5 w-0.5 bg-[var(--m-dim)]"
              />
            </>
          ) : null}
          <Stepper
            steps={["Setup", "Write"]}
            current={step}
            errorSteps={errorSteps}
            onSelect={(s) => onSelectStep(s as ComposerStep)}
          />
        </div>

        {/* RIGHT — view live post (edit) · visibility (eye) · delete · Publish */}
        <div className="ml-auto flex items-center gap-3">
          {viewHref ? (
            <a
              href={viewHref}
              aria-label="View post"
              title="View the live post"
              className={`mono-icon-btn size-9 ${focusRing}`}
            >
              <ArrowTopRightOnSquareIcon className="size-3.5" />
            </a>
          ) : null}
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
