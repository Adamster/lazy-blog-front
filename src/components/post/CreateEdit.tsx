/* eslint-disable @next/next/no-img-element */
import classNames from "classnames";
import { Controller, FieldValues, UseFormReturn } from "react-hook-form";

import "@uiw/react-markdown-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false }
);

interface IProps {
  form: UseFormReturn<FieldValues, any>;
  onSubmit: (data: any) => void;
  onDelete?: () => void;
  edit?: boolean;
}

export const CreateEdit = ({
  form,
  onSubmit,
  onDelete,
  edit = false,
}: IProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = form;

  return (
    <div className="mx-auto" style={{ maxWidth: "var(--max-width-md)" }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-0 sm:px-8">
          <div className="text-center">
            {errors?.title && (
              <small className="color-danger">
                {errors?.title?.message?.toString()}
              </small>
            )}

            <h1 className="text-2xl font-bold" style={{ marginBottom: "2px" }}>
              <input
                className="input"
                placeholder="Название"
                style={{
                  textAlign: "center",
                  paddingTop: 0,
                  paddingBottom: 0,
                  background: "transparent",
                }}
                {...register("title", {
                  required: {
                    value: true,
                    message: "Введите Название",
                  },
                })}
              />
            </h1>
          </div>

          <div>
            <input
              style={{
                textAlign: "center",
                paddingTop: 0,
                paddingBottom: 0,
                background: "transparent",
              }}
              className="input"
              {...register("summary")}
              placeholder="Короткое описание (опционально)"
            />
          </div>

          <div className="mt-4 mb-8">
            {/* {!edit && (
              <div>
                <span>URL: &nbsp;</span>
                <input
                  style={{
                    paddingTop: 0,
                    paddingBottom: 0,
                    width: "200px",
                    background: "var(--color-gray-light)",
                  }}
                  className="input rounded"
                  {...register("slug")}
                  placeholder="Slug"
                />
              </div>
            )} */}

            <div className="text-center">
              <input
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  width: "100%",
                  maxWidth: "425px",
                  background: "var(--color-gray-light)",
                  textAlign: "center",
                }}
                className="input rounded"
                placeholder="Превьюшка"
                {...register("coverUrl")}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 text-center">
          {watch("coverUrl") ? (
            <div className="post-image-preview">
              <img src={watch("coverUrl")} alt="" />
            </div>
          ) : (
            <>
              <hr />
            </>
          )}
        </div>

        <div className="px-0 sm:px-16">
          <div className="mb-6">
            {errors?.body && (
              <small className="color-danger">Очень сильно необходимо</small>
            )}
            <Controller
              name="body"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <div className={classNames(errors.body && "input--error")}>
                  <div className="wmde-markdown-var"></div>
                  <MarkdownEditor {...field} />
                </div>
              )}
            />
          </div>

          <div className="text-center">
            <button className="btn btn--primary mr-4" type="submit">
              Поехали
            </button>
            {edit && (
              <button
                className="btn btn--danger mr-4"
                onClick={(e) => {
                  e.preventDefault();

                  if (confirm("Ты точно хочешь удолить этот пост?")) {
                    onDelete && onDelete();
                  }
                }}
              >
                Удолить
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
