"use client";

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
    let accessToken = "";

    const storedAuth = localStorage.getItem("auth");

    if (storedAuth) {
      const auth = JSON.parse(storedAuth);
      accessToken = auth.accessToken || "";
    }

    const response = await fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
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
