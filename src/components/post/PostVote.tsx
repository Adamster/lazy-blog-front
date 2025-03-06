/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/api/api-client";
import { VotePostDirectionEnum } from "@/api/apis";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface IProps {
  postId: string;
  mutate: () => void;
  rating: number;
}

export const PostVote = ({ postId, rating, mutate }: IProps) => {
  // const { data: auth } = useSession();

  const handleVote = useMutation({
    mutationFn: ({ direction }: { direction: VotePostDirectionEnum }) => {
      return apiClient.posts.votePost({
        id: postId,
        direction,
      });
    },

    onError: (error: any) => {
      mutate();

      if (error?.response?.status == 400) {
        toast.error("Пожалуй хватит");
      }
    },
  });

  // const handleVote = async (direction: string) => {
  //   await axios
  //     .put(
  //       `${API_URL}/posts/${postId}/vote?direction=${direction}`,
  //       {},
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${auth?.user?.accessToken}`,
  //         },
  //       }
  //     )
  //     .then(async (response) => {
  //       mutate();
  //     })
  //     .catch((error) => {
  //       toast.error(
  //         error.response.data.detail ?? "Возможно ошибка авторизации"
  //       );
  //     });
  // };

  return (
    <div className="flex items-center justify-center">
      <button
        className="btn btn--default btn--link"
        style={{ padding: ".1rem" }}
        onClick={() => {
          handleVote.mutate({ direction: VotePostDirectionEnum.Down });
        }}
      >
        <ChevronDownIcon width={".9rem"}></ChevronDownIcon>
      </button>

      <div className="mx-2">{rating}</div>

      <button
        className="btn btn--default btn--link"
        style={{ padding: ".1rem" }}
        onClick={() => {
          handleVote.mutate({ direction: VotePostDirectionEnum.Up });
        }}
      >
        <ChevronUpIcon width={".9rem"}></ChevronUpIcon>
      </button>
    </div>
  );
};
