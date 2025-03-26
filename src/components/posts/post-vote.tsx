/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/shared/api/api-client";
import { addToastError } from "@/components/toasts/toasts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";
import { Button, Divider } from "@heroui/react";
import { useMemo } from "react";
import { VotePostDirectionEnum } from "@/shared/api/openapi";

interface IProps {
  postId: string;
  postSlug: string;
  rating: number;
}

const voteMessages = [
  "Liking this post burns 0 calories — no excuses!",
  "Liking this post grants +1 to your charisma!",
  "Liking this post makes you 37% cooler. It's science.",
  "Tap like and receive +1 internet karma instantly.",
  "Like now, or forever hold your regrets.",
  "One like = one virtual cookie.",
  "Every time you like a post, a pixel smiles.",
  "Liking this is easier than deciding what to watch on Netflix.",
  "The like button is lonely. Be a friend.",
  "Just one like can change the world. Well, maybe this post.",
];

export const PostVote = ({ postId, postSlug }: IProps) => {
  const queryClient = useQueryClient();

  const randomMessage = useMemo(
    () => voteMessages[Math.floor(Math.random() * voteMessages.length)],
    []
  );

  const handleVote = useMutation({
    mutationFn: ({ direction }: { direction: VotePostDirectionEnum }) => {
      return apiClient.posts.votePost({
        id: postId,
        direction,
      });
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({
        queryKey: ["getPostBySlug", postSlug],
      });

      if (error?.response.status === 400) {
        addToastError("Error", error);
      }
    },
  });

  return (
    <div className="flex w-full flex-col gap-6 mt-6">
      <Divider className="layout-page-divider" />
      <div className="flex  justify-between items-center gap-4 text-gray">
        <p>{randomMessage}</p>
        <div className="flex items-center ms-auto gap-4 justify-end flex-1 ">
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            onPress={() => {
              handleVote.mutate({ direction: VotePostDirectionEnum.Down });
            }}
          >
            <HandThumbDownIcon width={"1rem"}></HandThumbDownIcon>
          </Button>
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            onPress={() => {
              handleVote.mutate({ direction: VotePostDirectionEnum.Up });
            }}
          >
            <HandThumbUpIcon width={"1rem"}></HandThumbUpIcon>
          </Button>
        </div>
      </div>
    </div>
  );
};
