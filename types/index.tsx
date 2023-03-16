export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface IPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  author: IUser;
  createAtUtc: string;
}

export interface IPostFull extends IPost {
  body: string;
}
