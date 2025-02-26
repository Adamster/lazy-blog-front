/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { CreateEdit } from "@/components/post/CreateEdit";
import { apiClient } from "@/api/api-client";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "@/providers/auth-provider";
import { Loading } from "@/components/loading";
import { addToastSuccess } from "@/helpers/toasts";
import { useRouter } from "next/navigation";

const CreatePageClient = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [requesting, setRequesting] = useState(false);

  const form = useForm({ shouldFocusError: false });
  const { reset } = form;

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user]);

  const onSubmit = useMutation({
    mutationFn: (data: any) => {
      return apiClient.posts.createPost({
        createPostRequest: { userId: user?.id, ...data },
      });
    },

    onSuccess: () => {
      addToastSuccess("Post has been added");
      reset();
    },

    onError: (error: any) => {
      addToastSuccess("Error adding post");
      console.log(error);
    },

    onSettled: () => {
      setRequesting(false);
    },
  });

  return (
    <>
      {requesting && <Loading />}
      {user && <CreateEdit form={form} onSubmit={onSubmit.mutate} />}
    </>
  );
};

export default CreatePageClient;
