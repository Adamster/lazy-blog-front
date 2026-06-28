"use client";

import {
  AdjustmentsHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import { IconSubmitButton, Stepper } from "@/shared/ui";
import type { ComposerStep } from "./composer-step";

interface ComposerTopBarProps {
  step: ComposerStep;
  onSelectStep: (step: ComposerStep) => void;
  errorSteps: number[];
  completeSteps: number[];
  published: boolean;
  onPublishedChange: (value: boolean) => void;
  onDelete?: () => void;
  viewHref?: string;
  isPending: boolean;
}

// Purely presentational — the parent owns the form, validation, modal.
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
      <div className="mx-auto flex max-w-[1240px] items-center px-6 py-5 md:px-10">
        <Stepper
          steps={["Setup", "Write"]}
          icons={[AdjustmentsHorizontalIcon, BookOpenIcon]}
          current={step}
          errorSteps={errorSteps}
          completeSteps={completeSteps}
          onSelect={(s) => onSelectStep(s as ComposerStep)}
        />

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

          {/* Divider so the destructive delete never sits flush against Publish. */}
          <span aria-hidden="true" className="h-5 w-0.5 bg-[var(--m-dim)]" />

          {/* Rocket = publish, check = save draft — same submit, only the glyph
              changes so a draft-save doesn't read as "launching". */}
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
