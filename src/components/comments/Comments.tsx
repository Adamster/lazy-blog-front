import { apiClient } from "@/api/api-client";
import { CommentResponse } from "@/api/apis";
import { API_URL } from "@/utils/fetcher";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import classNames from "classnames";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import IsAuth from "../guards/IsAuth";
import Loading from "../loading";
import AddEditComment from "./AddEditComment";
import Comment from "./Comment";
import s from "./comments.module.scss";

interface IProps {
  postId: string;
}

export function Comments({ postId }: IProps) {
  const { data: auth } = useSession();
  const [requesting, setRequesting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["apiPostsIdCommentsGet", postId],
    queryFn: () => apiClient.posts.apiPostsIdCommentsGet({ id: postId }),
    enabled: !!postId,
  });

  const handleDelete = async (id: string) => {
    if (confirm("Ты точно хочешь удолить этот коммент?")) {
      setRequesting(true);

      await axios
        .delete(`${API_URL}/api/comments/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth?.user?.accessToken}`,
          },
        })
        .then(() => {
          refetch();
        })
        .catch(({ error }) => {
          console.log(error);
          toast.error("Чё-то ошибка");
        })
        .finally(() => {
          setRequesting(false);
        });
    }
  };

  return (
    <div className={s.comments}>
      {(isLoading || requesting) && <Loading />}

      <div className="wrapper-md p-8">
        <div className="text-center mb-8">
          <h5 className="text-2xl font-bold">Комментарии</h5>
          {data?.length === 0 && <p>Даже намёка нет на наличие комментариев</p>}
        </div>

        <IsAuth>
          <div className={classNames(s.mainContainer, "mb-8")}>
            <AddEditComment
              auth={auth}
              postId={postId}
              mutate={refetch}
              setRequesting={setRequesting}
            />
          </div>
        </IsAuth>

        <div className="p-0 sm:px-16">
          <div id="comments" className={s.commentsContainer}>
            <div className={s.commentsList}>
              {data?.map((comment: CommentResponse) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  auth={auth}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
