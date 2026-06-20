import { DisplayPostResponse } from "@/shared/api/openapi";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

export const getAllPostsSSR = async (
  offset = 0
): Promise<DisplayPostResponse[]> => {
  try {
    const url = new URL(`${API_URL}/api/posts`);
    if (offset > 0) url.searchParams.set("offset", String(offset));

    const response = await fetch(url.toString(), {
      // Tagged so publish/unpublish/delete can bust the home feed on demand
      // (otherwise an unpublished post lingers up to the 5-min ISR window).
      next: { revalidate: 300, tags: ["posts:all"] },
    });

    if (!response.ok) return [];

    return (await response.json()) as DisplayPostResponse[];
  } catch {
    return [];
  }
};
