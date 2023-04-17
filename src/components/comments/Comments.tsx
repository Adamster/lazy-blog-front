import { IComment } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import { useSession } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import Loading from "../loading";
import AddEditComment from "./AddEditComment";
import Comment from "./Comment";
import s from "./comments.module.scss";

interface IProps {
  postId: string;
}

export function Comments({ postId }: IProps) {
  const { data: auth }: any = useSession();
  const [requesting, setRequesting] = useState(false);

  const { data, error, isLoading } = useSWR<IComment[]>(
    postId ? `${API_URL}/posts/${postId}/comments` : null,
    fetcher
  );

  return (
    <>
      {(isLoading || requesting) && <Loading />}

      <div className={s.mainContainer}>
        <h3 className="text-xl font-bold mb-4">Комменты</h3>

        {auth && (
          <AddEditComment
            auth={auth}
            postId={postId}
            setRequesting={setRequesting}
          />
        )}

        <div className={s.commentsList}>
          {data?.map((comment: IComment) => (
            <Comment
              key={comment.id}
              comment={comment}
              auth={auth}
              setRequesting={setRequesting}
            />
          ))}

          {data?.length === 0 && (
            <p>Даже намёка нет на наличие комментариев :(</p>
          )}
        </div>
      </div>
    </>
  );
}
