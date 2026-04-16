import { generateMeta } from "@/shared/lib/head/meta-data";
import TagPage from "./tag-page";
import { snakeToTitle } from "@/shared/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id: tag } = await params;
  const tagName = snakeToTitle(tag);

  return generateMeta({
    title: `${tagName} Tag`,
    description: `A collection of posts related to the '${tagName}' topic.`,
    url: `/tag/${tag}`,
  });
}

export default async function Page({ params }: PageProps) {
  const { id: tag } = await params;
  return <TagPage tag={tag} />;
}
