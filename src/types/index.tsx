export interface IRequest {
  code?: string;
  message?: string;
}

export interface IUser extends IRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  avatarUrl: string;
  createdOnUtc: string;
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
  rating: number;
  voteDirection: string;
  comments: number;
}

export interface IPosts extends Array<IPost>, IRequest {}

export interface IСreatePost extends IRequest {
  userId: string;
  title: string;
  summary: string;
  body: string;
}

export interface IComment {
  id: string;
  user: IUser;
  body: string;
  createdAtUtc: string;
}

export type SessionUser = Omit<IUser, "code" | "message"> & {
  accessToken: string;
  username: string;
};
