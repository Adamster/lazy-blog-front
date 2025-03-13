import { apiClient } from "@/api/api-client";
import { titleToSnake } from "@/utils/utils";
import { Chip, Link } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

export const Categories = () => {
  const { data } = useQuery({
    queryKey: ["getTags"],
    queryFn: () => apiClient.tags.getTags(),
    retry: 1,
  });

  return (
    <>
      {data &&
        data.map(
          (tag) =>
            tag.postCount > 0 && (
              <div key={tag.tagId} className="flex items-start">
                <Link
                  className="text-gray mb-0.5 hover:underline"
                  href={`/category/${titleToSnake(tag.tag)}`}
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
