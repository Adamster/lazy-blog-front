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
      next: { revalidate: 300 },
    });

    if (!response.ok) return [];

    return (await response.json()) as DisplayPostResponse[];
  } catch {
    return [];
  }
};
