import { getSession } from "next-auth/react";

export const customFetcher = async (config: any) => {
  const session = await getSession(); // NextAuth

  const response = await fetch(config.url, {
    ...config,
    headers: {
      ...config.headers,
      Authorization: session?.user?.accessToken
        ? `Bearer ${session.user.accessToken}`
        : "",
    },
  });

  if (!response.ok) throw new Error("Ошибка API");
  return response.json();
};
