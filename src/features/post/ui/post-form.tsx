"use client";

import { useMemo, useRef, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { UpdatePostRequest } from "@/shared/api/openapi";
import { Field, FieldError, type SelectOption } from "@/shared/ui";
import ConfirmModal from "@/shared/ui/overlays/confirmation-modal";
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
  /** Edit-only: link to the live post, surfaced in the top bar. */
  viewHref?: string;
  isPending: boolean;
}

/** Mounted state for the cover-crop modal (object URL of the picked file). */
interface CropTarget {
  src: string;
}

/**
 * True when `value` holds at least one real character of content — used to
 * reject "empty" markdown (Crepe emits a non-empty string for an empty doc) and
 * whitespace-only title/summary. Strips zero-width chars (BOM / ZWSP / ZWNJ /
 * ZWJ) and all whitespace, then checks the remainder is non-empty.
 */
const ZERO_WIDTH = /[\u200b-\u200d\ufeff]/g;
const hasContent = (value: string | null | undefined): boolean =>
  Boolean(value?.replace(ZERO_WIDTH, "").trim());

/**
 * Two-step post composer (Setup → Write) for create & edit. A single
 * react-hook-form instance (owned by the route wrapper) spans both steps; the
 * step is local UI state and BOTH panels stay mounted — only visibility toggles
 * — so the Crepe editor never unmounts and no field value is lost between
 * steps. One {@link ComposerTopBar} (numbered step boxes 1/2 · publish
 * toggle + delete + Publish) sits above both. Step 1 is a 1240-wide two-panel
 * card (cover | form on `--m-card`: tag + title + description); Step 2 is the
 * 780-wide Crepe column. The cover crop happens in {@link CoverCropModal} so
 * this canvas never reflows.
 *
 * The `.mono-scope` / page background / Header live in the route wrapper (app
 * layer) so the header tokens resolve too — this renders only the composer.
 */
export const PostForm = ({
  form,
  onSubmit,
  onDelete,
  viewHref,
  isPending,
}: PostFormProps) => {
  const { data: tags } = useTags();
  const [step, setStep] = useState<ComposerStep>(1);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  // A validated submit awaiting a visibility-transition confirm (the rocket
  // gates the create/update mutation behind this dialog). `null` = no pending
  // submit / dialog closed; the boolean is the about-to-save `isPublished`.
  const [pendingSubmit, setPendingSubmit] = useState<boolean | null>(null);

  const {
    register,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = form;

  // The post's ORIGINAL published state, captured ONCE before RHF mutates the
  // live value: on edit it's the loaded post's `isPublished` (seeded into
  // `defaultValues` by the route wrapper, which RHF never rewrites during
  // editing); on create the post doesn't exist yet → `false`. Drives whether a
  // save is a visibility TRANSITION (publish / unpublish) needing a confirm.
  const wasPublished = useRef(
    Boolean(form.formState.defaultValues?.isPublished)
  ).current;

  const tagOptions = useMemo<SelectOption[]>(
    () => tags?.map((tag) => ({ value: tag.tagId, label: tag.tag })) ?? [],
    [tags]
  );

  const published = Boolean(watch("isPublished"));

  // Step "completeness" = required DATA present (filled), NOT full validation —
  // it drives the Stepper's accent-outline layer so the bar reflects, at a
  // glance, which steps have their content. `hasContent` is the SAME real-content
  // predicate the body validator uses (strips whitespace + zero-width chars).
  // Step 1 (Setup) = title + summary filled; Step 2 (Write) = body has content.
  const completeSteps = completeStepsFrom({
    setup: hasContent(watch("title")) && hasContent(watch("summary")),
    write: hasContent(watch("body")),
  });

  /**
   * Publish (the rocket): validate the whole form ourselves so we can POINT the
   * user at the problem. ORDER: validate FIRST — on failure jump to the first
   * step holding an error (inline message + highlighted step box on-screen) and
   * stop, so the mutation never fires and there's no second validation pass on
   * the fail path. Only once valid do we look at the visibility TRANSITION: a
   * draft going live (`willPublish && !wasPublished`) or a live post being
   * hidden (`!willPublish && wasPublished`) opens a confirm and defers the
   * mutation to {@link confirmSubmit}; a no-op transition (draft→draft /
   * published→published) submits silently. The parent's `onSubmit` (a guarded
   * `handleSubmit`) is the single place the mutation fires.
   */
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
        // The eye silently flips the pending `isPublished` flag; the actual
        // visibility CHANGE is confirmed on Publish (the rocket), gated by the
        // transition confirm in `handleSubmit` — not the instant you toggle.
        onPublishedChange={(v) =>
          setValue("isPublished", v, { shouldDirty: true })
        }
        onDelete={onDelete}
        viewHref={viewHref}
        isPending={isPending}
      />

      {/* ── STEP 1: SETUP — 1240 canvas, cover | form panel ── */}
      <section
        className={`mx-auto max-w-[1240px] px-10 pt-10 pb-10 ${
          step === 1 ? "" : "hidden"
        }`}
      >
        {/* Two adjacent equal-height panels (grid `items-stretch`): the 16:9
            cover sets the row height, the form panel fills it on `--m-card`. */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Cover — left panel */}
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

          {/* Form — right panel, on the card background, content vertically
              centered (matches the cover). Tag on top; no slug field (it's
              auto-generated server-side). */}
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

            {/* Summary — STATIC label + an auto-grow box capped at 3 lines
                (`max-h`), scrolling with an INVISIBLE scrollbar past that, so it
                can never stretch the card (newlines allowed). The static label
                (vs the floating one) avoids the label/text overlap. */}
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

      {/* ── STEP 2: WRITE — full 1240 canvas (matching the Step-1 setup canvas).
          The toolbar spans the column; the editable text is no longer sized by
          the column — it carries its OWN fixed 700 measure (centered) on the
          `.ProseMirror` so it stays 1:1 with the read view's 700 (780 − px-10).
          See `crepe-overrides.scss`. ── */}
      <section
        className={`mx-auto max-w-[1240px] px-10 py-10 ${
          step === 2 ? "" : "hidden"
        }`}
      >
        <Controller
          name="body"
          control={control}
          rules={{
            required: "Body is required",
            // Crepe emits a non-empty markdown string for an EMPTY doc (a lone
            // placeholder paragraph / stray whitespace / zero-width chars), so
            // `required` alone passes on "empty". Strip whitespace + zero-width
            // chars and require at least one real character of content.
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
          <p
            role="alert"
            className="mx-auto mt-4 max-w-[700px] text-[11px] tracking-[0.12em] text-[var(--m-error)]"
          >
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

      {/* Visibility-TRANSITION confirm on save (the rocket). Only opens when the
          save crosses a boundary — a draft going live or a live post being
          hidden; mirrors the post-page kebab's publish/unpublish copy so the two
          surfaces read identically (`// Visibility`, default tone). Confirm →
          fire the mutation; Cancel → abort, stay in the composer. */}
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
