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
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        {errors?.title && (
          <small className="color-danger">Очень сильно необходимо</small>
        )}
        <input
          placeholder="Тайтл"
          className={classNames("input", errors.title && "input--error")}
          {...register("title", { required: true })}
        />
      </div>

      {edit && (
        <div className="mb-4">
          <input className="input" {...register("slug")} placeholder="Slug" />
        </div>
      )}

      <div className="mb-4">
        <input
          className="input"
          {...register("summary")}
          placeholder="Короткое описание"
        />
      </div>

      <div className="mb-4">
        <input
          className="input"
          {...register("coverUrl")}
          placeholder="Картиночка (url)"
        />
      </div>

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
    </form>
  );
};
