import ErrorMessage from "@/components/eerrorMessages/ErrorMessage";
import Loading from "@/components/loading";
import { CreateEdit } from "@/components/post/CreateEdit";
import { IPost } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import useSWR from "swr";

const PostEdit = () => {
  const { data: auth } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [requesting, setRequesting] = useState(false);

  const {
    data: values,
    error,
    isLoading,
  } = useSWR<IPost | FieldValues>(
    id ? `${API_URL}/posts/${id}` : null,
    fetcher
  );

  const form = useForm({
    shouldFocusError: false,
    values,
  });

  const onSubmit = async (data: any) => {
    setRequesting(true);

    await axios
      .put(
        `${API_URL}/posts/${values?.id}`,
        { ...data, isPublished: true },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth?.user.accessToken}`,
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
      .delete(`${API_URL}/posts/${values?.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.user.accessToken}`,
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

  if (error || values?.code)
    return <ErrorMessage code={error?.response?.data?.code} />;

  return (
    <>
      <Head>
        <title>Редактор | Not Lazy Blog</title>
      </Head>

      {(isLoading || requesting) && <Loading />}

      {/* <h1 className="page-title">Редактор</h1> */}

      {values && (
        <CreateEdit
          form={form}
          edit={true}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default PostEdit;
