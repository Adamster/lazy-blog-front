export interface IUser extends IRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
}

export interface IUserPostDetails extends IRequest {
  user: IUser;
  postItems: Array<IPostItem>;
}

export interface IPostItem {
  title: string;
  summary: string;
  slug: string;
  postId: string;
  isPublished: boolean;
  createdAtUtc: Date;
}

export interface IRequest {
  code?: string;
  message?: string;
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
}

export interface IPosts extends Array<IPost>, IRequest {}

export interface IСreatePost extends IRequest {
  userId: string;
  title: string;
  summary: string;
  body: string;
}
