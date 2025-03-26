import { titleToSnake } from "@/shared/lib/utils";
import { Chip, Link } from "@heroui/react";
import { useTags } from "../model/use-tags";

export const TagsList = () => {
  const { data } = useTags();

  if (!data?.length) return null;

  return (
    <>
      {data.map(
        (tag) =>
          tag.postCount > 0 && (
            <div key={tag.tagId} className="flex items-start">
              <Link
                className="text-foreground mb-0.5 hover:underline"
                href={`/tag/${titleToSnake(tag.tag)}`}
              >
                {tag.tag}
              </Link>

              <Chip
                variant="light"
                className="ms-1"
                size="sm"
                radius="sm"
                classNames={{ base: "p-0 h-4" }}
              >
                <small className="text-gray font-semibold opacity-50">
                  {tag.postCount}
                </small>
              </Chip>
            </div>
          )
      )}
    </>
  );
};
