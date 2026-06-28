"use client";

import { useMemo, useRef, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { PencilIcon } from "@heroicons/react/24/outline";
import type { UpdatePostRequest } from "@/shared/api/openapi";
import {
  Field,
  FieldError,
  ConfirmModal,
  type SelectOption,
} from "@/shared/ui";
import { useTags } from "@/entities/tag";
import { ComposerTopBar } from "./composer-top-bar";
import { CoverCropModal } from "./cover-crop-modal";
import { CrepeEditor } from "./crepe-wrapper";
import {
  completeStepsFrom,
  errorStepsFrom,
  firstErrorStep,
  type ComposerStep,
} from "./composer-step";
import { PostCoverDropzone } from "./post-cover-dropzone";
import { PostTagPicker } from "./post-tag-picker";

interface PostFormProps {
  form: UseFormReturn<UpdatePostRequest>;
  onSubmit: () => void;
  onDelete?: () => void;
  viewHref?: string;
  /** Edit only — create auto-generates the slug server-side, so it's hidden there. */
  isEdit?: boolean;
  isPending: boolean;
}

interface CropTarget {
  src: string;
}

// Crepe emits a non-empty string for an empty doc — reject whitespace-only +
// zero-width content as "empty".
const ZERO_WIDTH = /[\u200b-\u200d\ufeff]/g;
const hasContent = (value: string | null | undefined): boolean =>
  Boolean(value?.replace(ZERO_WIDTH, "").trim());

// BOTH step panels stay mounted (only visibility toggles) so the Crepe editor
// never unmounts and no field value is lost between steps.
export const PostForm = ({
  form,
  onSubmit,
  onDelete,
  viewHref,
  isEdit = false,
  isPending,
}: PostFormProps) => {
  const { data: tags } = useTags();
  const [step, setStep] = useState<ComposerStep>(1);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  // Slug locked by default — it's auto-generated and changing it breaks links.
  const [slugEditable, setSlugEditable] = useState(false);
  // null = no pending submit; the boolean is the about-to-save `isPublished`.
  const [pendingSubmit, setPendingSubmit] = useState<boolean | null>(null);

  const {
    register,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = form;

  // Original published state, captured ONCE before RHF mutates the live value —
  // drives whether a save is a visibility transition needing a confirm.
  const wasPublished = useRef(
    Boolean(form.formState.defaultValues?.isPublished)
  ).current;

  const tagOptions = useMemo<SelectOption[]>(
    () => tags?.map((tag) => ({ value: tag.tagId, label: tag.tag })) ?? [],
    [tags]
  );

  const published = Boolean(watch("isPublished"));

  // Step "completeness" = required DATA present, NOT full validation.
  const completeSteps = completeStepsFrom({
    setup: hasContent(watch("title")) && hasContent(watch("summary")),
    write: hasContent(watch("body")),
  });

  // Validate FIRST and jump to the failing step before checking the visibility
  // transition, so the mutation never fires on the fail path.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = await trigger();
    if (!valid) {
      const target = firstErrorStep(form.formState.errors);
      if (target) setStep(target);
      return;
    }
    const willPublish = published;
    const isTransition =
      (willPublish && !wasPublished) || (!willPublish && wasPublished);
    if (isTransition) {
      setPendingSubmit(willPublish);
      return;
    }
    onSubmit();
  };

  const confirmSubmit = () => {
    setPendingSubmit(null);
    onSubmit();
  };

  const onPickCover = (file: File) =>
    setCropTarget({ src: URL.createObjectURL(file) });

  const onCoverUploaded = (url: string) => {
    setValue("coverUrl", url, { shouldDirty: true });
    if (cropTarget) URL.revokeObjectURL(cropTarget.src);
    setCropTarget(null);
  };

  const closeCrop = () => {
    if (cropTarget) URL.revokeObjectURL(cropTarget.src);
    setCropTarget(null);
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <ComposerTopBar
        step={step}
        onSelectStep={setStep}
        errorSteps={errorStepsFrom(errors)}
        completeSteps={completeSteps}
        published={published}
        // The eye only flips the pending flag; the visibility change is confirmed
        // on Publish, not the instant you toggle.
        onPublishedChange={(v) =>
          setValue("isPublished", v, { shouldDirty: true })
        }
        onDelete={onDelete}
        viewHref={viewHref}
        isPending={isPending}
      />

      <section
        className={`mx-auto max-w-[1240px] px-6 pt-10 pb-10 md:px-10 ${
          step === 1 ? "" : "hidden"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <Controller
            name="coverUrl"
            control={control}
            render={({ field }) => (
              <PostCoverDropzone
                coverUrl={field.value ?? ""}
                onPick={onPickCover}
                onRemove={() => field.onChange(null)}
              />
            )}
          />

          <div className="flex flex-col justify-center border-2 border-t-0 border-[var(--m-dim)] bg-[var(--m-card)] p-10 md:border-t-2 md:border-l-0">
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <PostTagPicker
                  options={tagOptions}
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              )}
            />

            {isEdit && (
              <div className="mt-4">
                <label htmlFor="post-slug" className="mono-field-label">
                  Slug
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="post-slug"
                    disabled={!slugEditable}
                    aria-invalid={Boolean(errors.slug)}
                    className={`block w-full border-0 border-b-2 bg-transparent px-0 pb-2 text-[14px] leading-[1.6] text-[var(--m-fg)] caret-[var(--m-accent)] outline-none disabled:cursor-not-allowed disabled:text-[var(--m-muted2)] ${
                      errors.slug
                        ? "border-[var(--m-error)]"
                        : "border-[var(--m-dim)] focus:border-[var(--m-accent)]"
                    }`}
                    style={{ fontFamily: "var(--font-mono)" }}
                    {...register("slug", {
                      required: "Slug is required",
                      pattern: {
                        value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                        message: "Lowercase letters, numbers and hyphens only",
                      },
                    })}
                  />
                  <button
                    type="button"
                    aria-label={slugEditable ? "Lock slug" : "Edit slug"}
                    aria-pressed={slugEditable}
                    onClick={() => setSlugEditable((v) => !v)}
                    className="mono-icon-btn mono-focus size-9 shrink-0"
                    style={
                      slugEditable
                        ? {
                            borderColor: "var(--m-accent)",
                            color: "var(--m-accent)",
                          }
                        : undefined
                    }
                  >
                    <PencilIcon className="size-4" />
                  </button>
                </div>
                {errors.slug ? (
                  <FieldError error={errors.slug.message ?? ""} />
                ) : null}
              </div>
            )}

            <div className="mt-4">
              <Field
                id="post-title"
                label="Title"
                required
                error={errors.title?.message}
                {...register("title", {
                  required: "Title is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                  validate: (v) => (v?.trim() ? true : "Title is required"),
                })}
              />
            </div>

            {/* Static label (not floating) avoids the label/text overlap. */}
            <div className="mt-4">
              <label htmlFor="post-summary" className="mono-field-label">
                Summary
                <span className="ml-1 text-[var(--m-accent)]">*</span>
              </label>
              <textarea
                id="post-summary"
                rows={1}
                maxLength={180}
                placeholder="Brief summary…"
                aria-invalid={Boolean(errors.summary)}
                className={`block max-h-[4.75rem] w-full resize-none scrollbar-none overflow-y-auto border-0 border-b-2 bg-transparent px-0 pb-2 text-[14px] leading-[1.6] text-[var(--m-fg)] caret-[var(--m-accent)] outline-none placeholder:text-[var(--m-muted2)] ${
                  errors.summary
                    ? "border-[var(--m-error)]"
                    : "border-[var(--m-dim)] focus:border-[var(--m-accent)]"
                }`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fieldSizing: "content",
                }}
                {...register("summary", {
                  required: "Summary is required",
                  maxLength: { value: 180, message: "Max 180 characters" },
                  validate: (v) => (v?.trim() ? true : "Summary is required"),
                })}
              />
              {errors.summary ? (
                <FieldError error={errors.summary.message ?? ""} />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* The editable text carries its OWN fixed 700 measure (in
          `crepe-overrides.scss`), staying 1:1 with the read view's 700. */}
      <section
        className={`mx-auto max-w-[1240px] px-6 py-10 md:px-10 ${
          step === 2 ? "" : "hidden"
        }`}
      >
        <Controller
          name="body"
          control={control}
          rules={{
            required: "Body is required",
            // `required` alone passes on "empty" — Crepe emits a non-empty string
            // for an empty doc; hasContent strips whitespace + zero-width chars.
            validate: (v) => (hasContent(v) ? true : "Body is required"),
          }}
          render={({ field }) => (
            <CrepeEditor
              placeholder="Start writing … use the toolbar to format"
              markdown={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
        {errors.body ? (
          <p role="alert" className="mono-error mx-auto max-w-[700px]">
            {`! ${errors.body.message}`}
          </p>
        ) : null}
      </section>

      <CoverCropModal
        src={cropTarget?.src ?? ""}
        isOpen={cropTarget !== null}
        onOpenChange={closeCrop}
        onUploaded={onCoverUploaded}
      />

      <ConfirmModal
        isOpen={pendingSubmit !== null}
        onOpenChange={() => setPendingSubmit(null)}
        onConfirm={confirmSubmit}
        tone="default"
        eyebrow="// Visibility"
        title={pendingSubmit ? "Publish post?" : "Unpublish post?"}
        description={
          pendingSubmit
            ? "It'll go live and show up in feeds for everyone. You can unpublish it anytime."
            : "It'll be hidden from everyone but you and pulled from feeds. You can republish it anytime."
        }
        confirmLabel={pendingSubmit ? "Publish" : "Unpublish"}
      />
    </form>
  );
};
