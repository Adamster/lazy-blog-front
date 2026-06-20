"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  ArrowTopRightOnSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/solid";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { Field, Select, Switch, type SelectOption } from "@/shared/ui";
import { useTags } from "@/features/tag/model/use-tags";
import { useUser } from "@/shared/providers/user-provider";
import { Crepe } from "./crepe-wrapper";
import { PostImageUploader } from "./post-image-uploader";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface PostFormProps {
  form: UseFormReturn<UpdatePostRequest>;
  onSubmit: () => void;
  onDelete?: () => void;
  isCreate: boolean;
  isPending: boolean;
}

export const PostForm = ({
  form,
  onSubmit,
  onDelete,
  isCreate,
  isPending,
}: PostFormProps) => {
  const { data: tags } = useTags();
  const { user } = useUser();

  const [fullView, setFullView] = useState(false);

  const {
    register,
    control,
    formState: { errors },
  } = form;

  const tagOptions = useMemo<SelectOption[]>(
    () => tags?.map((tag) => ({ value: tag.tagId, label: tag.tag })) ?? [],
    [tags]
  );

  return (
    <form
      noValidate
      className={`layout-page ${fullView ? "full" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="layout-page-content">
        <div className="mb-8">
          <PostImageUploader
            currentImage={form.watch("coverUrl") || undefined}
            onUploadSuccess={(value) => form.setValue("coverUrl", value)}
          />
        </div>

        <Controller
          name="body"
          control={control}
          rules={{ required: "Field is required" }}
          render={({ field }) => (
            <Crepe
              key={form.getValues("slug")}
              placeholder="Start typing, or press / for blocks…"
              markdown={field.value || ""}
              onChange={field.onChange}
            />
          )}
        />
        {errors.body ? (
          <p
            role="alert"
            className="mt-1.5 text-[11px] tracking-[0.02em] text-[var(--m-error)]"
          >
            {`! ${errors.body.message}`}
          </p>
        ) : null}
      </div>

      <div className="layout-page-aside">
        <div className="hidden md:block md:w-0.5 md:self-stretch md:bg-[var(--m-dim)]" />

        <div className="layout-page-aside-wrapper">
          <aside className="layout-page-aside-sticky w-full">
            <button
              type="button"
              aria-label={fullView ? "Show sidebar" : "Hide sidebar"}
              aria-pressed={fullView}
              onClick={() => setFullView((view) => !view)}
              className={`layout-page-view-toggle mono-icon-btn size-9 bg-[var(--m-bg)] ${focusRing}`}
            >
              {fullView ? (
                <ChevronLeftIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )}
            </button>

            {!isCreate ? (
              <div className="flex w-full items-end gap-3">
                <div className="min-w-0 flex-1">
                  <Field
                    id="post-slug"
                    label="Slug"
                    required
                    error={errors.slug?.message}
                    {...register("slug", {
                      required: "Slug is required",
                      minLength: { value: 2, message: "At least 2 characters" },
                    })}
                  />
                </div>
                <Link
                  href={`/${user?.userName}/${form.getValues("slug")}`}
                  target="_blank"
                  aria-label="Open post in a new tab"
                  className={`mono-icon-btn size-9 ${focusRing}`}
                >
                  <ArrowTopRightOnSquareIcon className="size-3.5" />
                </Link>
              </div>
            ) : null}

            <div className="w-full">
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

            <div className="w-full">
              <Field
                id="post-summary"
                label="Summary"
                required
                error={errors.summary?.message}
                {...register("summary", { required: "Summary is required" })}
              />
            </div>

            <div className="w-full">
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <Select
                    id="post-tags"
                    label="Tags"
                    multiple
                    placeholder="Select tag(s)…"
                    options={tagOptions}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="w-full">
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="post-published"
                    label={field.value ? "Published" : "Draft"}
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex w-full items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className={`mono-cta inline-flex h-9 flex-1 items-center justify-center gap-2 px-4 text-[13px] font-bold tracking-[0.06em] ${focusRing}`}
              >
                {!isPending ? <RocketLaunchIcon className="size-3.5" /> : null}
                {isPending ? "Saving…" : "Go"}
              </button>

              {!isCreate ? (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete post"
                  className={`mono-icon-btn size-9 text-[var(--m-error)] hover:border-[var(--m-error)] hover:text-[var(--m-error)] ${focusRing}`}
                >
                  <TrashIcon className="size-3.5" />
                </button>
              ) : null}
            </div>
          </aside>
        </div>

        <div className="mt-6 h-0.5 w-full bg-[var(--m-dim)] md:hidden" />
      </div>
    </form>
  );
};
