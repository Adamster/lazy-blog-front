export const getPostBySlugSSR = async (slug: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/posts/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return { slug };
    }

    const data = await response.json();

    return {
      ...data,
    };
  } catch {
    return { slug };
  }
};
