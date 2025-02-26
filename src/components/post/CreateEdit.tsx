/* eslint-disable @next/next/no-img-element */
import classNames from "classnames";
import { Controller, FieldValues, UseFormReturn } from "react-hook-form";

import "@uiw/react-markdown-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import { API_URL } from "@/utils/fetcher";
import axios from "axios";
import { useCallback, useEffect } from "react";
import { MarkEditor } from "../libs/Editor";
import { useAuth } from "@/providers/auth-provider";

// const MarkdownEditor = dynamic(
//   () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
//   { ssr: false }
// );

interface IProps {
  form: any;
  onSubmit: (data: any) => void;
  onDelete?: () => void;
  edit?: boolean;
}

export const CreateEdit = ({ form, onSubmit, edit = false }: IProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = form;

  const { auth, user } = useAuth();

  const handlePaste = useCallback(async (event: any) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") === -1) continue;

      const file = item.getAsFile();
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          `${API_URL}/api/media/${user?.id}/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${auth.accessToken}`,
            },
          }
        );
        const imageUrl = response.data; // Adjust based on returned data structure
        console.log("File uploaded on url:");
        console.log(imageUrl);
        console.log(response.data);
        if (imageUrl) {
          const activeElement = document.activeElement;
          console.log(activeElement);
          const contentToAppend = `![image](${imageUrl})`;
          activeElement?.append(contentToAppend);
        }
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className="mx-auto" style={{ maxWidth: "var(--max-width-lg)" }}>
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
              required
              style={{
                textAlign: "center",
                paddingTop: 0,
                paddingBottom: 0,
                background: "transparent",
              }}
              className="input"
              {...register("summary")}
              placeholder="Короткое описание"
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
            <div className="post-image-preview full">
              <img src={watch("coverUrl")} alt="" />
            </div>
          ) : (
            <>
              <hr />
            </>
          )}
        </div>

        <div className="px-0">
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
                  <MarkEditor
                    markdown={field.value ?? ""}
                    onChange={field.onChange}
                  />
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
                    // onDelete && onDelete();
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
