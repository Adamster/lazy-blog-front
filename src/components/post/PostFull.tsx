import { formatDate } from "@/helpers";
import { IPostFull } from "@/types";
import {
  ChatBubbleBottomCenterIcon,
  HeartIcon,
} from "@heroicons/react/20/solid";
import classNames from "classnames";
import Link from "next/link";

import s from "./post-full.module.scss";
import sPreview from "./post.module.scss";

interface IProps {
  post: IPostFull;
}

export const PostFull = ({ post }: IProps) => {
  return (
    <>
      <div className={classNames(s.header, "mb-4")}>
        <div className={s.headerTop}>
          <div className={sPreview.author}>
            <Link href="/" className={sPreview.authorName}>
              <div className={sPreview.authorAva}></div>
              {post.author.firstName}{" "}
              {post.author.lastName && post.author.lastName}
            </Link>

            <div className={sPreview.date}>
              <span>{formatDate(post.createdAtUtc)}</span>
            </div>
          </div>
        </div>

        <div className={s.postTitleContainer}>
          <h1 className={classNames(s.postTitle, "text-2xl font-bold")}>
            {post.title}
          </h1>
          {post.summary && <p className={s.postSummary}>{post.summary}</p>}
        </div>

        <div className={sPreview.stats}>
          <div className={sPreview.statsStat}>
            <HeartIcon className={sPreview.icon}></HeartIcon>
            <span className={sPreview.statsNum}>34</span>
          </div>

          <div className={sPreview.statsStat}>
            <ChatBubbleBottomCenterIcon
              className={sPreview.icon}
            ></ChatBubbleBottomCenterIcon>
            <span className={sPreview.statsNum}>34</span>
          </div>
        </div>
      </div>

      {/* 
      <div className="block mb-4">
        <h1 className={s.postTitle}>{post.title}</h1>
      </div> */}

      <div className={s.post}>
        <div className={s.info}>
          <div className={s.postBody}>{post.body}</div>
        </div>
      </div>
    </>
  );
};
