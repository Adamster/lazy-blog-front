/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/api/api-client";
import { VotePostDirectionEnum } from "@/api/apis";
import { addToastError } from "@/utils/toasts";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";

interface IProps {
  postId: string;
  postRefetch: () => void;
  rating: number;
}

export const PostVote = ({ postId, rating, postRefetch }: IProps) => {
  const handleVote = useMutation({
    mutationFn: ({ direction }: { direction: VotePostDirectionEnum }) => {
      return apiClient.posts.votePost({
        id: postId,
        direction,
      });
    },
    onError: (error: any) => {
      postRefetch();

      if (error?.response.status === 400) {
        addToastError("Error", error);
      }
    },
  });

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col gap-0">
        <button
          className="btn btn--default btn--link"
          // style={{ padding: ".1rem" }}
          onClick={() => {
            handleVote.mutate({ direction: VotePostDirectionEnum.Up });
          }}
        >
          <ChevronUpIcon width={".9rem"}></ChevronUpIcon>
        </button>
        <button
          className="btn btn--default btn--link"
          // style={{ padding: ".1rem" }}
          onClick={() => {
            handleVote.mutate({ direction: VotePostDirectionEnum.Down });
          }}
        >
          <ChevronDownIcon width={".9rem"}></ChevronDownIcon>
        </button>
      </div>

      <div className="mx-2">{rating}</div>
    </div>
  );
};
