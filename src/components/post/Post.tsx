import { formatDate } from "@/helpers";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { IPost } from "types";

import s from "./post.module.scss";

interface IProps {
  post: IPost;
}

export const Post = ({ post }: IProps) => {
  return (
    <div key={post.id} className={s.post}>
      <div className={s.image}></div>
      <div className={s.info}>
        {/* <span className={s.category}>Категория</span> */}
        <span className={s.date}>{formatDate(post.createAtUtc)}</span>

        <Link href={`/post/${post.slug}`}>
          <h2 className={s.title}>{post.title}</h2>
        </Link>
        <p className={s.summary}>{post.summary}</p>

        <div className={s.footer}>
          <div className={s.author}>
            {post.author.firstName} {post.author.lastName}
          </div>
          <div className={s.stats}>
            <ChatBubbleLeftEllipsisIcon className={s.icon} />
            <span>0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
