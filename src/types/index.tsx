import { Session } from "next-auth";

export interface IRequest {
  code?: string;
  message?: string;
}

export interface IAuthSession extends Session {
  user?: {
    name: string | null;
    email?: string | null;
    image?: string | null;

    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    token: string;
  };
}

export interface IUser extends IRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
}

export interface IUserDetails extends IRequest {
  user: IUser;
  postItems: Array<IPost>;
}

export interface IPost extends IRequest {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  summary: string;
  author: IUser;
  createdAtUtc: string;
  body: string;
  views: number;
  comments: number;
}

export interface IPosts extends Array<IPost>, IRequest {}

export interface IСreatePost extends IRequest {
  userId: string;
  title: string;
  summary: string;
  body: string;
}
