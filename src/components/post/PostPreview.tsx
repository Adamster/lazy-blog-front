import { formatDate } from "@/helpers";
import { IPost } from "@/types";
import classNames from "classnames";
import Link from "next/link";

import s from "./post.module.scss";

interface IProps {
  post: IPost;
}

export const PostPreview = ({ post }: IProps) => {
  return (
    <div key={post.id} className={s.post}>
      <div className={s.postContent}>
        <div className={classNames(s.author, "mb-4")}>
          <Link href="/" className={s.authorName}>
            <div className={s.authorAva}></div>
            {post.author.firstName}{" "}
            {post.author.lastName && post.author.lastName}
          </Link>

          <div className={s.date}>
            <span>{formatDate(post.createdAtUtc)}</span>
          </div>
        </div>

        <Link className="block mb-0" href={`/post/${post.slug}`}>
          <h2 className={"text-lg font-bold"}>{post.title}</h2>
          {post.summary && <p className={s.postSummary}>{post.summary}</p>}
        </Link>

        {/* <div className={s.stats}>
          <div className={s.statsStat}>
            <HeartIcon className={s.icon}></HeartIcon>
            <span className={s.statsNum}>34</span>
          </div>

          <div className={s.statsStat}>
            <ChatBubbleBottomCenterIcon
              className={s.icon}
            ></ChatBubbleBottomCenterIcon>
            <span className={s.statsNum}>34</span>
          </div>
        </div> */}
      </div>

      <Link href={`/post/${post.slug}`} className={s.postImage}></Link>
    </div>
  );
};
