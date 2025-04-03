import { MarkdownWrapper } from "./markdown-wrapper";
import {
  Button,
  ButtonGroup,
  cn,
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
import { useCallback, useState } from "react";
import { debounce } from "lodash";
import { PostImageUploader } from "./post-image-uploader";
import { useTags } from "@/features/tag/model/use-tags";
import { useUser } from "@/shared/providers/user-provider";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

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

  const [fullView, setFullView] = useState(false);

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
    <form noValidate className={cn("layout-page", fullView ? "full" : "")}>
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
              key={form.getValues("slug")}
              placeholder="Too lazy to write a post? Just start typing..."
              markdown={field.value || ""}
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

        <div className="layout-page-aside-wrapper">
          <aside className="layout-page-aside-sticky">
            <Button
              className="layout-page-view-toggle bg-background border-1 min-w-6 w-6 h-6"
              size="sm"
              isIconOnly
              variant="bordered"
              radius="full"
              onPress={() => setFullView((view) => !view)}
            >
              {fullView ? (
                <ChevronLeftIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </Button>

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
                      size="sm"
                      target="_blank"
                      variant="flat"
                      href={`/${user?.userName}/${form.getValues("slug")}`}
                      as={Link}
                      isIconOnly
                      style={{ marginBottom: "0.125rem" }}
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
                  <div className="flex flex-col gap-4 w-full items-end">
                    <div
                      className="w-full flex flex-row items-center gap-4 min-h-10 h-14 px-3 py-2 rounded-medium cursor-pointer shadow-sm bg-default-100 hover:bg-default-200"
                      onClick={() => field.onChange(!field.value)}
                    >
                      <Switch
                        color="success"
                        isSelected={field.value}
                        onChange={field.onChange}
                        size="sm"
                        classNames={{ wrapper: "bg-default-300" }}
                      />
                      <span>{field.value ? "Published" : "Draft"}</span>
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="flex w-full items-center justify-end">
              <ButtonGroup>
                <Button
                  variant="flat"
                  color="primary"
                  onPress={onSubmit}
                  disabled={isPending}
                  isLoading={isPending}
                >
                  {!isPending && <RocketLaunchIcon className="w-4 h-4" />}
                  Go
                </Button>

                {!isCreate && (
                  <Button
                    isIconOnly
                    color="danger"
                    variant="flat"
                    onPress={onDelete}
                  >
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
