import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";
import { Button, Divider } from "@heroui/react";
import {
  NullableOfVoteDirection,
  VotePostDirectionEnum,
} from "@/shared/api/openapi";
import { useVotePost } from "../model/use-vote-post";
import { randomMessageFromList } from "@/shared/lib/utils";
import { useMemo } from "react";

interface IProps {
  postId: string;
  postSlug: string;
  voteDirection: NullableOfVoteDirection | null;
}

const POST_VOTE_MESSAGE = [
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

export const PostVote = ({ postId, postSlug, voteDirection }: IProps) => {
  const randomMessage = useMemo(
    () => randomMessageFromList(POST_VOTE_MESSAGE),
    []
  );
  const handleVote = useVotePost(postId, postSlug);

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
            color={
              voteDirection === VotePostDirectionEnum.Down
                ? "primary"
                : "default"
            }
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
            color={
              voteDirection === VotePostDirectionEnum.Up ? "primary" : "default"
            }
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
