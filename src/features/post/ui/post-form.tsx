import { MarkdownWrapper } from "./markdown-wrapper";
import {
  Button,
  ButtonGroup,
  Divider,
  Input,
  Link,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import {
  ArrowTopRightOnSquareIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { Controller, UseFormReturn } from "react-hook-form";
import { useCallback } from "react";
import { debounce } from "lodash";
import { PostImageUploader } from "./post-image-uploader";
import { useTags } from "@/features/tag/model/use-tags";
import { useUser } from "@/shared/providers/user-provider";

interface IProps {
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
}: IProps) => {
  const { data: tags } = useTags();
  const { user } = useUser();

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
    <form noValidate className="layout-page">
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
            <MarkdownWrapper
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
            {!isCreate && (
              <div className="w-full">
                <Input
                  classNames={{ input: "text-base" }}
                  isRequired
                  isInvalid={Boolean(errors.slug)}
                  label="Slug"
                  {...register("slug", {
                    required: "Slug is required",
                    minLength: {
                      value: 2,
                      message: "At least 2 characters",
                    },
                  })}
                  errorMessage={errors.slug?.message}
                  endContent={
                    <Button
                      target="_blank"
                      variant="flat"
                      href={`/${user?.userName}/${form.getValues("slug")}`}
                      as={Link}
                      isIconOnly
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </Button>
                  }
                />
              </div>
            )}

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
                    classNames={{ value: "text-base" }}
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
                  <>
                    <Switch
                      size="sm"
                      className="me-auto"
                      isSelected={field.value}
                      onChange={field.onChange}
                    />

                    <ButtonGroup>
                      <Button
                        variant={field.value ? "solid" : "flat"}
                        color={field.value ? "primary" : "default"}
                        onPress={onSubmit}
                        disabled={isPending}
                        isLoading={isPending}
                      >
                        {!isPending && <RocketLaunchIcon className="w-4 h-4" />}
                        {field.value ? "Publish" : "in Drafts"}
                      </Button>

                      {!isCreate && (
                        <Button isIconOnly color="danger" onPress={onDelete}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </ButtonGroup>
                  </>
                )}
              />
            </div>
          </aside>
        </div>

        <Divider className="layout-page-divider-mobile" />
      </div>
    </form>
  );
};
