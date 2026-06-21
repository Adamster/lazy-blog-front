"use client";

import { useMemo, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { UpdatePostRequest } from "@/shared/api/openapi";
import { Field, type SelectOption } from "@/shared/ui";
import { useTags } from "@/entities/tag";
import { useUser } from "@/entities/session";
import { ComposerTopBar } from "./composer-top-bar";
import { CoverCropModal } from "./cover-crop-modal";
import { CrepeEditor } from "./crepe-wrapper";
import {
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
 * Two-step post composer (Setup → Write) for create & edit. A single
 * react-hook-form instance (owned by the route wrapper) spans both steps; the
 * step is local UI state and BOTH panels stay mounted — only visibility toggles
 * — so the Crepe editor never unmounts and no field value is lost between
 * steps. One {@link ComposerTopBar} (Cancel · numbered step boxes 1/2 · publish
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
  const { user } = useUser();
  const [step, setStep] = useState<ComposerStep>(1);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  const {
    register,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = form;

  const tagOptions = useMemo<SelectOption[]>(
    () => tags?.map((tag) => ({ value: tag.tagId, label: tag.tag })) ?? [],
    [tags]
  );

  const published = Boolean(watch("isPublished"));

  // Cancel is a CREATE-only abort (exits to the author's profile / home). In
  // edit mode (signalled by `viewHref`) there's nothing to abort — you leave via
  // the header or the View-post button — so we drop it (undefined → no Cancel).
  const cancelHref = viewHref
    ? undefined
    : user?.userName
      ? `/${user.userName}`
      : "/";

  /**
   * Publish: validate the whole form ourselves so we can POINT the user at the
   * problem. On failure we jump to the first step holding an error (so its
   * inline message + highlighted step box are on-screen) and stop — the
   * parent's `onSubmit` (a guarded `handleSubmit`) is never reached, so the
   * mutation can't fire and there's no second validation pass on the fail path.
   * On success we hand off to the parent's `onSubmit` once.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = await trigger();
    if (!valid) {
      const target = firstErrorStep(form.formState.errors);
      if (target) setStep(target);
      return;
    }
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
        cancelHref={cancelHref}
        onSelectStep={setStep}
        errorSteps={errorStepsFrom(errors)}
        published={published}
        onPublishedChange={(value) =>
          setValue("isPublished", value, { shouldDirty: true })
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
          <div className="flex flex-col justify-center border-2 border-t-0 border-[var(--m-dim)] bg-[var(--m-card)] p-7 md:border-t-2 md:border-l-0 md:p-10">
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

            <div className="mt-5">
              <Field
                id="post-title"
                label="Title"
                required
                error={errors.title?.message}
                {...register("title", {
                  required: "Title is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                })}
              />
            </div>

            {/* Summary — STATIC label + an auto-grow box capped at 3 lines
                (`max-h`), scrolling with an INVISIBLE scrollbar past that, so it
                can never stretch the card (newlines allowed). The static label
                (vs the floating one) avoids the label/text overlap. */}
            <div className="mt-5">
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
                })}
              />
              {errors.summary ? (
                <p
                  role="alert"
                  className="mt-1.5 text-[11px] tracking-[0.02em] text-[var(--m-error)]"
                >
                  {`! ${errors.summary.message}`}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── STEP 2: WRITE — 864 column so the editable text measures exactly 700
          (= the post read view). text = col − gutter(px-10 = 80) − sheet
          border-x-2 (4) − sheet p-10 inset (80) = col − 164 ⇒ col = 864. ── */}
      <section
        className={`mx-auto max-w-[864px] px-10 py-10 ${
          step === 2 ? "" : "hidden"
        }`}
      >
        <Controller
          name="body"
          control={control}
          rules={{ required: "Body is required" }}
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
            className="mt-4 text-[11px] tracking-[0.12em] text-[var(--m-error)]"
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
    </form>
  );
};
