/* eslint-disable react-hooks/rules-of-hooks */
import { MarkEditor } from "../libs/Editor";
import {
  Button,
  ButtonGroup,
  Divider,
  Image,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import {
  PencilSquareIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { UpdatePostRequest } from "@/api/apis";
import { Controller, UseFormReturn } from "react-hook-form";
import { useCallback } from "react";
import { debounce } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";
import { PostImageUploader } from "./post-image-uploader";

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

  const { data: tags } = useQuery({
    queryKey: ["getTags"],
    queryFn: () => apiClient.tags.getTags(),
    retry: 1,
  });

  return (
    <form className="layout-page" noValidate>
      <div className="layout-page-content">
        <Controller
          name="body"
          control={control}
          rules={{ required: "Field is required" }}
          render={({ field }) => (
            <MarkEditor
              placeholder="Too lazy to write a post? Just start typing..."
              markdown={form.watch("body")}
              onChange={(value) => handleChange(value, field.onChange)}
            />
          )}
        />
        {errors.body && (
          <p className="text-danger text-tiny ps-3">{errors.body.message}</p>
        )}
      </div>

      <div className="layout-page-aside">
        <Divider className="layout-page-divider" orientation="vertical" />

        <div className="layout-page-aside-content">
          <aside className="layout-page-aside-content-sticky">
            {
              <>
                {form.watch("coverUrl") && (
                  <Image
                    className="max-h-72 p-1"
                    removeWrapper
                    src={form.getValues("coverUrl") || undefined}
                    alt="Cover image"
                  />
                )}

                <PostImageUploader
                  onUploadSuccess={(value) => form.setValue("coverUrl", value)}
                />
              </>
            }

            <div className="w-full">
              <Input
                classNames={{ input: "text-base" }}
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
                classNames={{ input: "text-base" }}
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
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <Select
                    selectedKeys={field.value}
                    selectionMode="multiple"
                    label="Select Tag(s)"
                    onSelectionChange={(keys) => field.onChange([...keys])}
                  >
                    {tags
                      ? tags.map((tag) => (
                          <SelectItem key={tag.tagId}>{tag.tag}</SelectItem>
                        ))
                      : null}
                  </Select>
                )}
              />
            </div>

            <div className="flex w-full items-center justify-end gap-4">
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <Switch
                    className="me-auto"
                    isSelected={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <ButtonGroup>
                <Button
                  variant="solid"
                  color={form.watch("isPublished") ? "primary" : "default"}
                  onPress={onSubmit}
                >
                  {form.watch("isPublished") ? (
                    <>
                      <RocketLaunchIcon className="w-4 h-4" /> Publish
                    </>
                  ) : (
                    <>
                      <PencilSquareIcon className="w-4 h-4" /> Save
                    </>
                  )}
                </Button>

                {!create && (
                  <Button isIconOnly color="danger" onPress={onDelete}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </ButtonGroup>
            </div>
          </aside>
        </div>

        <Divider className="layout-page-divider-mobile" />
      </div>
    </form>
  );
};
