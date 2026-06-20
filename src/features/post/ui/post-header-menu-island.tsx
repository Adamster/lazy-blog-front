"use client";

import { IsAuthor } from "@/entities/session";
import { PostHeaderMenu } from "./post-header-menu";

interface IProps {
  postId: string;
  postSlug: string;
  authorId: string;
  authorHandle: string;
  isPublished: boolean;
}

/**
 * Client island for the author kebab (edit / publish / delete). Gated on the
 * viewer being the author; slotted into the server-rendered post header so the
 * read view stays a Server Component.
 */
export const PostHeaderMenuIsland = ({
  postId,
  postSlug,
  authorId,
  authorHandle,
  isPublished,
}: IProps) => (
  <IsAuthor userId={authorId}>
    <div className="ml-auto">
      <PostHeaderMenu
        postId={postId}
        postSlug={postSlug}
        authorHandle={authorHandle}
        isPublished={isPublished}
      />
    </div>
  </IsAuthor>
);
