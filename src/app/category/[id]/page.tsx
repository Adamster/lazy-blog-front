/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMeta } from "@/components/meta/meta-data";
import CategoryPageClient from "./page-client";

export async function generateMetadata({ params }: any) {
  const { id: category } = await params;
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  return generateMeta({
    title: `${categoryName} Category`,
    description: `Discover a wide range of posts related to ${categoryName}`,
  });
}

export default function CategoryPage() {
  return <CategoryPageClient />;
}
