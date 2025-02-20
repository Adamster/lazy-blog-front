"use client";

import { IUserDetails } from "@/types";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { API_URL } from "@/utils/fetcher";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
interface IProps {
  fallback: IUserDetails;
}

//Component
export default function EditProfile() {
  const { data: auth } = useSession();
  // const router = useRouter();

  const [requesting, setRequesting] = useState(false);

  const form = useForm();

  const handleAvatarChange = (e: any) => {
    const file = e.target.files[0];
    form.setValue("avatar", file);
  };

  const handleSubmit = async (data: any) => {
    setRequesting(true);

    const formData = new FormData();

    // formData.append('userId', id); // Предполагается, что запрос содержит идентификатор пользователя
    formData.append("file", data.avatar);

    try {
      await axios.post(
        `${API_URL}/api/users/${auth?.user.id}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${auth?.user.accessToken}`,
          },
        }
      );
      toast.success("Аватар успешно обновлен!");
      // router.back();
    } catch (error) {
      toast.error("Произошла ошибка при обновлении аватара");
      console.error(error);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Редактирование профиля | Not Lazy Blog</title>
      </Head>

      <div className="mx-auto" style={{ maxWidth: "var(--max-width-md)" }}>
        <div className="p-8">
          <h1 className="text-2xl text-center font-medium mb-8">Ну шо ты</h1>

          <div className="flex justify-center">
            <form
              className="flex justify-center flex-col items-center"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <label htmlFor="avatar">Загрузить новый аватар:</label>
              <div className="flex items-center mt-2">
                <label
                  htmlFor="avatar"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-600 cursor-pointer"
                >
                  <CloudArrowUpIcon className="w-5 h-5 mr-2" /> Выбрать файл
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 cursor-pointer"
              >
                Сохранить изменения
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
