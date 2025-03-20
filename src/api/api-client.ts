"use client";

import { getAuthState } from "@/features/auth/utlis/auth-storage";
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

const configuration = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API,
  middleware: [
    {
      async pre(context) {
        const auth = getAuthState();

        if (auth?.accessToken) {
          context.init.headers = {
            ...context.init.headers,
            Authorization: `Bearer ${auth.accessToken}`,
          };
        }
      },
    },
  ],
});

export const apiClient = {
  users: new UsersApi(configuration),
  posts: new PostsApi(configuration),
  comments: new CommentsApi(configuration),
  tags: new TagsApi(configuration),
  media: new MediaApi(configuration),
  changePassword: new ChangePasswordApi(configuration),
  forgotPassword: new ForgotPasswordApi(configuration),
  resetPassword: new ResetPasswordApi(configuration),
};
