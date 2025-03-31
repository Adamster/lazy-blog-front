import { titleToSnake } from "@/shared/lib/utils";
import { Chip, Link } from "@heroui/react";
import { useTags } from "../model/use-tags";
import { motion } from "framer-motion";

export const TagsList = () => {
  const { data } = useTags();

  return data?.map(
    (tag) =>
      tag.postCount > 0 && (
        <motion.div
          key={tag.tagId}
          className="flex items-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
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
        </motion.div>
      )
  );
};
