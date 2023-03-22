import { IPost } from "@/types";

export const API_URL = process.env.NEXT_PUBLIC_API;

export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `An error occurred while fetching the data: ${response.statusText}`
    );
  }

  return response.json();
};

// Posts

export const getPosts = (): Promise<IPost[]> =>
  fetcher<IPost[]>(`${API_URL}/posts`);
