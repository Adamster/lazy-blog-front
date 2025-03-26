export const getUserDataSSR = async (userName: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/posts/${userName}/posts`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return { userName };
    }

    const data = await response.json();

    return {
      ...data.user,
    };
  } catch {
    return { userName };
  }
};
