import { cache } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API ?? "https://blog-api-prod.notlazy.org";

export const getPostSSR = cache(async (slug: string) => {
  try {
    const response = await fetch(`${API_URL}/api/posts/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
});
