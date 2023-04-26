import ErrorMessage from "@/components/errorMessages/ErrorMessage";
import Loading from "@/components/loading";
import { CreateEdit } from "@/components/post/CreateEdit";
import { IPost } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import useSWR from "swr";

const PostEdit = () => {
  const { data: auth }: any = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [requesting, setRequesting] = useState(false);

  const form = useForm({ shouldFocusError: false });

  const {
    data: initialData,
    error,
    isLoading,
  } = useSWR<IPost>(id ? `${API_URL}/posts/${id}` : null, fetcher);

  // TODO: CHECK IF YOU ARE AUTHOR

  const onSubmit = async (data: any) => {
    setRequesting(true);

    await axios
      .put(
        `${API_URL}/posts/${initialData?.id}`,
        { ...data, isPublished: true },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.user.token}`,
          },
        }
      )
      .then((response) => {
        toast.success("Это успех!");
      })
      .catch(({ response }) => {
        toast.error("Чё-то ошибка");
        console.log(error);
      })
      .finally(() => {
        setRequesting(false);
      });
  };

  const onDelete = async () => {
    setRequesting(true);

    await axios
      .delete(`${API_URL}/posts/${initialData?.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user.token}`,
        },
      })
      .then((response) => {
        toast.success("Это успех!");
        router.back();
      })
      .catch(({ response }) => {
        toast.error("Чё-то ошибка");
      })
      .finally(() => {
        setRequesting(false);
      });
  };

  if (error || initialData?.code)
    return <ErrorMessage code={error?.response?.data?.code} />;

  return (
    <>
      <Head>
        <title>Редактор | Not Lazy Blog</title>
      </Head>

      {(isLoading || requesting) && <Loading />}

      <div className="page-bg">
        <h1 className="page-title">Редактор</h1>

        {initialData && (
          <CreateEdit
            form={form}
            initialData={initialData}
            onSubmit={onSubmit}
            onDelete={onDelete}
          />
        )}
      </div>
    </>
  );
};

export default PostEdit;
