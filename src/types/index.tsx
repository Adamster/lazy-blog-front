export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface IRequest {
  code?: string;
  message?: string;
}

export interface IPost extends IRequest {
  id: string;
  title: string;
  slug: string;
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
