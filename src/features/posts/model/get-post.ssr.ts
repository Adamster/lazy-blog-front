export const getPostSSR = async (slug: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/posts/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      ...data,
    };
  } catch {
    return null;
  }
};
