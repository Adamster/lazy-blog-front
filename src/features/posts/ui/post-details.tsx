import { TagPostResponse } from "@/shared/api/openapi";
import { formatDate2, titleToSnake } from "@/shared/lib/utils";
import {
  ChatBubbleLeftIcon as ChatBubbleLeftIconOutline,
  EyeIcon as EyeIconOutline,
  HeartIcon as HeartIconOutline,
  StarIcon as StarIconOutline,
} from "@heroicons/react/24/outline";

import {
  CalendarIcon,
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
  EyeIcon as EyeIconSolid,
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
  TagIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@heroui/react";

export const PostDetailsData = ({ date }: { date: Date }) => {
  return (
    <div className="flex items-center gap-1">
      <CalendarIcon className="w-4 h-4" />
      <span className="ml-1 text-sm">{formatDate2(date)}</span>
    </div>
  );
};

export const PostDetailsViews = ({ views }: { views: number }) => {
  return (
    <div className="flex items-center gap-1">
      {views > 0 ? (
        <EyeIconSolid className="w-4 h-4" />
      ) : (
        <EyeIconOutline className="w-4 h-4" />
      )}
      <span className="ml-1 text-sm">{views}</span>
    </div>
  );
};

export const PostDetailsComments = ({ comments }: { comments: number }) => {
  return (
    <div className="flex items-center gap-1">
      {comments > 0 ? (
        <ChatBubbleLeftIconSolid className="w-4 h-4" />
      ) : (
        <ChatBubbleLeftIconOutline className="w-4 h-4" />
      )}
      <span className="ml-1 text-sm">{comments}</span>
    </div>
  );
};

export const PostDetailsRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {rating > 0 ? (
        <StarIconSolid className="w-4 h-4" />
      ) : (
        <StarIconOutline className="w-4 h-4" />
      )}
      <span className="ml-1 text-sm">{rating}</span>
    </div>
  );
};

export const PostDetailsTags = ({ tags }: { tags: TagPostResponse[] }) => {
  return tags?.length ? (
    <div className="flex flex-wrap items-center gap-1 text-foreground">
      <TagIcon className={"w-4 h-4"} />
      {tags.map((tag, id) => (
        <span key={tag.tagId}>
          <Link
            href={`/tag/${titleToSnake(tag.tag)}`}
            className="text-foreground ml-1 text-sm hover:underline"
          >
            {tag.tag}
          </Link>
          {++id < tags.length && ","}
        </span>
      ))}
    </div>
  ) : null;
};
