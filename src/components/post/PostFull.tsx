import { IPostFull } from "types";

import s from "./post.module.scss";

interface IProps {
  post: IPostFull;
}

export const PostFull = ({ post }: IProps) => {
  return (
    <>
      <div className={s.post}>
        <div className={s.image}></div>
        <div className={s.info}>
          <div className="mb-4">
            <h2 className={s.title}>{post.title}</h2>
          </div>

          {/* <span className={s.category}>Категория</span> */}
          {/* <span className={s.date}>{formatDate(post.createAtUtc)}</span> */}

          <p className={s.summary}>{post.body}</p>

          {/* <div className={s.footer}>
            <div className={s.author}>
              {post.author.firstName} {post.author.lastName}
            </div>
            <div className={s.stats}>
              <ChatBubbleLeftEllipsisIcon className={s.icon} />
              <span>0</span>
            </div>
          </div> */}
        </div>
      </div>
    </>
  );
};
