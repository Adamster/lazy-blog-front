/* eslint-disable react-hooks/rules-of-hooks */
import { MarkEditor } from "../libs/Editor";
import { Button, Divider, Input } from "@heroui/react";
import { TrashIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { UpdatePostRequest } from "@/api/apis";
import { Controller, UseFormReturn } from "react-hook-form";
import { useCallback } from "react";
import { debounce } from "lodash";

interface IProps {
  form: UseFormReturn<UpdatePostRequest>;
  onSubmit: () => void;
  onDelete?: () => void;
  create: boolean;
}

export const PostForm = ({ form, onSubmit, onDelete, create }: IProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const handleChange = useCallback(
    debounce((value: string, onChange: (v: string) => void) => {
      onChange(value);
    }, 300),
    []
  );

  return (
    <form className="layout-page" noValidate>
      <div className="layout-page-content">
        <Controller
          name="body"
          control={control}
          rules={{ required: "Field is required" }}
          render={({ field }) =>
            (!create && field.value) || create ? (
              <MarkEditor
                placeholder="Too lazy to write a post? Just start typing..."
                markdown={field.value || ""}
                onChange={(value) => handleChange(value, field.onChange)}
              />
            ) : (
              <> </>
            )
          }
        />
        {errors.body && (
          <p className="text-danger text-tiny ps-3">{errors.body.message}</p>
        )}
      </div>

      <div className="layout-page-aside">
        <Divider className="layout-page-divider" orientation="vertical" />

        <div className="layout-page-aside-content">
          <aside className="layout-page-aside-content-sticky">
            {!create && (
              <>
                {/* {form.getValues("coverUrl")?.length && (
                  <div className="flex mb-2">
                    <Image
                      className="max-h-72"
                      removeWrapper
                      src={form.getValues("coverUrl") || undefined}
                      alt="Cover image"
                    />
                  </div>
                )} */}

                <div className="w-full">
                  <Input
                    label="Slug"
                    isRequired
                    isInvalid={Boolean(errors.slug)}
                    {...register("slug", {
                      required: "Slug is required",
                      minLength: {
                        value: 3,
                        message: "At least 3 characters",
                      },
                    })}
                    errorMessage={errors.slug?.message}
                  />
                </div>
              </>
            )}

            <div className="w-full">
              <Input
                isRequired
                isInvalid={Boolean(errors.title)}
                label="Title"
                {...register("title", {
                  required: "Title is required",
                  minLength: {
                    value: 2,
                    message: "At least 2 characters",
                  },
                })}
                errorMessage={errors.title?.message}
              />
            </div>

            <div className="w-full">
              <Input
                isRequired
                isInvalid={Boolean(errors.summary)}
                label="Summary"
                {...register("summary", {
                  required: "Summary is required",
                })}
                errorMessage={errors.summary?.message}
              />
            </div>

            <div className="w-full">
              <Input
                description={"Temporary solution"}
                isRequired
                label="CoverUrl"
                {...register("coverUrl")}
              />
            </div>

            <div className="flex w-full justify-end gap-4">
              {!create && (
                <Button
                  isIconOnly
                  variant="solid"
                  color="danger"
                  onPress={onDelete}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}

              <Button
                isIconOnly
                variant="solid"
                color="primary"
                onPress={onSubmit}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </Button>
            </div>
          </aside>
        </div>

        <Divider className="layout-page-divider md:hidden mt-6" />
      </div>
    </form>
  );
};
