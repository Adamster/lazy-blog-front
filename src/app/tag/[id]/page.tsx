/* eslint-disable @typescript-eslint/no-explicit-any */

import { generateMeta } from "@/shared/lib/head/meta-data";
import TagPage from "./tag-page";
import { snakeToTitle } from "@/shared/lib/utils";

export async function generateMetadata({ params }: any) {
  const { id: tag } = await params;
  const tagName = snakeToTitle(tag);

  return generateMeta({
    title: `${tagName} Tag`,
    description: `A collection of posts related to the '${tagName}' topic.`,
    url: `/tag/${tag}`,
  });
}

export default function Page({ params }: { params: { id: string } }) {
  const { id: tag } = params;
  return <TagPage tag={tag} />;
}
