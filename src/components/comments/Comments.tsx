import { IComment } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import useSWR from "swr";
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

  const { data, mutate, error, isLoading } = useSWR<IComment[]>(
    postId ? `${API_URL}/posts/${postId}/comments` : null,
    fetcher
  );

  const handleDelete = async (id: string) => {
    if (confirm("Ты точно хочешь удолить этот коммент?")) {
      setRequesting(true);

      await axios
        .delete(`${API_URL}/comments/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth?.user?.token}`,
          },
        })
        .then(() => {
          mutate();
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
    <>
      {(isLoading || requesting) && <Loading />}

      <div className="text-center">
        <h3 className="text-2xl font-bold">Комментарии</h3>
      </div>

      <div className={s.mainContainer}>
        <IsAuth>
          <AddEditComment
            auth={auth}
            postId={postId}
            mutate={mutate}
            setRequesting={setRequesting}
          />
        </IsAuth>
      </div>

      <div id="comments" className={s.mainContainer}>
        <div className={s.commentsList}>
          {data?.map((comment: IComment) => (
            <Comment
              key={comment.id}
              comment={comment}
              auth={auth}
              handleDelete={handleDelete}
            />
          ))}

          {data?.length === 0 && <p>Даже намёка нет на наличие комментариев</p>}
        </div>
      </div>
    </>
  );
}
