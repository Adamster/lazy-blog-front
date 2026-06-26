"use client";

import {
  AdjustmentsHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import { IconSubmitButton, Stepper } from "@/shared/ui";
import type { ComposerStep } from "./composer-step";

interface ComposerTopBarProps {
  step: ComposerStep;
  /** Jump to a step (unconditional — switching is free, no validation gate). */
  onSelectStep: (step: ComposerStep) => void;
  /** 1-based steps that currently hold validation errors (Stepper error layer). */
  errorSteps: number[];
  /** 1-based steps whose required data is filled (Stepper accent-outline layer). */
  completeSteps: number[];
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
 * numbered step boxes (1/2). RIGHT: view-live-post (edit) · the visibility eye
 * (open = published/visible, slashed = draft/hidden; toggles `isPublished`) ·
 * delete (icon-only, edit) · a 2px divider · Publish (icon-only rocket submit).
 * Purely presentational; the parent owns the form, validation, modal.
 */
export function ComposerTopBar({
  step,
  onSelectStep,
  errorSteps,
  completeSteps,
  published,
  onPublishedChange,
  onDelete,
  viewHref,
  isPending,
}: ComposerTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-10 py-5">
        {/* LEFT — the stepper nav (Setup / Write) */}
        <Stepper
          steps={["Setup", "Write"]}
          icons={[AdjustmentsHorizontalIcon, PencilIcon]}
          current={step}
          errorSteps={errorSteps}
          completeSteps={completeSteps}
          onSelect={(s) => onSelectStep(s as ComposerStep)}
        />

        {/* RIGHT — view live post (edit) · visibility (eye) · delete · Publish */}
        <div className="ml-auto flex items-center gap-3">
          {viewHref ? (
            <a
              href={viewHref}
              aria-label="View post"
              title="View the live post"
              className={`mono-icon-btn mono-focus size-9`}
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
            } mono-focus`}
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
              className={`mono-icon-btn mono-focus size-9 text-[var(--m-error)] hover:border-[var(--m-error)] hover:text-[var(--m-error)]`}
            >
              <TrashIcon className="size-3.5" />
            </button>
          ) : null}

          {/* Vertical divider isolating the Publish rocket (primary commit) from
              the tool actions (view / eye / delete) — the SAME divider as the
              LEFT Cancel│stepper split — so the destructive delete never sits
              flush against the primary. */}
          <span aria-hidden="true" className="h-5 w-0.5 bg-[var(--m-dim)]" />

          {/* Rocket = publish (eye visible); the check = save a DRAFT (eye
              hidden) — the glyph matches the intent the eye toggle set, so a
              draft-save doesn't read as "launching". Same submit either way;
              only the icon + label change. */}
          <IconSubmitButton
            icon={published ? RocketLaunchIcon : CheckIcon}
            label={published ? "Publish" : "Save draft"}
            pending={isPending}
          />
        </div>
      </div>
    </div>
  );
}
