/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMeta } from "@/components/meta/meta-data";
import TagPageClient from "./page-client";
import { snakeToTitle } from "@/utils/utils";

export async function generateMetadata({ params }: any) {
  const { id: tag } = await params;
  const tagName = snakeToTitle(tag);

  return generateMeta({
    title: `${tagName} Tag`,
    description: `Discover a wide range of posts related to ${tagName}`,
  });
}

export default function TagPage() {
  return <TagPageClient />;
}
