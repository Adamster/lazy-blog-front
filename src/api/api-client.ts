import { getSession } from "next-auth/react";
import {
  CommentsApi,
  MediaApi,
  PostsApi,
  TagsApi,
  UsersApi,
} from "./apis/apis";
import { Configuration } from "./apis/runtime";

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API,
  fetchApi: async (input, init) => {
    const session = await getSession();
    const response = await fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: session?.user?.accessToken
          ? `Bearer ${session.user.accessToken}`
          : "",
      },
    });

    return response;
  },
});

export const apiClient = {
  users: new UsersApi(apiConfig),
  posts: new PostsApi(apiConfig),
  comments: new CommentsApi(apiConfig),
  tags: new TagsApi(apiConfig),
  media: new MediaApi(apiConfig),
};
