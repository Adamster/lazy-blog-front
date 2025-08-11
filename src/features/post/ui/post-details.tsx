import { TagPostResponse } from "@/shared/api/openapi";
import { formatDate2, titleToSnake } from "@/shared/lib/utils";
import {
  ChatBubbleLeftIcon as ChatBubbleLeftIconOutline,
  EyeIcon as EyeIconOutline,
  StarIcon as StarIconOutline,
} from "@heroicons/react/24/outline";

import {
  CalendarIcon,
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
  EyeIcon as EyeIconSolid,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/solid";
import { Chip, Link } from "@heroui/react";

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

export const PostDetailsTags = ({
  tags,
  className,
}: {
  tags: TagPostResponse[];
  className?: string;
}) => {
  return tags?.length ? (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {tags.map((tag) => (
        <Link
          key={tag.tagId}
          href={`/tag/${titleToSnake(tag.tag)}`}
          className="text-foreground text-sm hover:opacity-70"
        >
          <Chip variant="flat" radius="sm" className="bg-primary bg-opacity-20">
            {tag.tag}
          </Chip>
        </Link>
      ))}
    </div>
  ) : null;
};
