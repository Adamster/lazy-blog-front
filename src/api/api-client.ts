"use client";

import {
  ChangePasswordApi,
  CommentsApi,
  ForgotPasswordApi,
  MediaApi,
  PostsApi,
  ResetPasswordApi,
  TagsApi,
  UsersApi,
} from "./apis/apis";
import { Configuration } from "./apis/runtime";
import { authorizedFetch } from "./authorized-fetch";

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API,
  fetchApi: authorizedFetch,
});

export const apiClient = {
  users: new UsersApi(apiConfig),
  posts: new PostsApi(apiConfig),
  comments: new CommentsApi(apiConfig),
  tags: new TagsApi(apiConfig),
  media: new MediaApi(apiConfig),
  changePassword: new ChangePasswordApi(apiConfig),
  forgotPassword: new ForgotPasswordApi(apiConfig),
  resetPassword: new ResetPasswordApi(apiConfig),
};
