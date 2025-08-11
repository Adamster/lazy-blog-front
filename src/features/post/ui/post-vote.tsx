import {
  FaceFrownIcon as FaceFrownSolid,
  FaceSmileIcon as FaceSmileSolid,
} from "@heroicons/react/24/solid";
import { Button, Divider } from "@heroui/react";
import {
  NullableOfVoteDirection,
  VotePostDirectionEnum,
} from "@/shared/api/openapi";
import { useVotePost } from "../model/use-vote-post";
import { FaceFrownIcon, FaceSmileIcon } from "@heroicons/react/24/outline";

interface IProps {
  postId: string;
  postSlug: string;
  voteDirection: NullableOfVoteDirection | null;
  rating: number;
}

export const PostVote = ({ postId, postSlug, voteDirection }: IProps) => {
  const handleVote = useVotePost(postId, postSlug);

  return (
    <>
      <Divider className="layout-page-divider" />

      <p className="text-sm">Did you like this post?</p>

      <div className="flex items-center ms-auto gap-1 flex-1 ">
        <Button
          size="sm"
          isIconOnly
          variant="light"
          onPress={() => {
            if (voteDirection === VotePostDirectionEnum.Down) {
              handleVote.mutate({ direction: VotePostDirectionEnum.Up });
            } else {
              handleVote.mutate({ direction: VotePostDirectionEnum.Down });
            }
          }}
        >
          {voteDirection === VotePostDirectionEnum.Down ? (
            <FaceFrownSolid className="text-gray" width={"1.5rem"} />
          ) : (
            <FaceFrownIcon className="text-gray" width={"1rem"} />
          )}
        </Button>

        <Button
          size="sm"
          isIconOnly
          variant="light"
          onPress={() => {
            if (voteDirection === VotePostDirectionEnum.Up) {
              handleVote.mutate({ direction: VotePostDirectionEnum.Down });
            } else {
              handleVote.mutate({ direction: VotePostDirectionEnum.Up });
            }
          }}
        >
          {voteDirection === VotePostDirectionEnum.Up ? (
            <FaceSmileSolid className="text-primary" width={"1.5rem"} />
          ) : (
            <FaceSmileIcon className="text-gray" width={"1rem"} />
          )}
        </Button>
      </div>
    </>
  );
};
