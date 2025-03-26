export const getUserSSR = async (userName: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/posts/${userName}/posts`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      ...data.user,
    };
  } catch {
    return null;
  }
};
