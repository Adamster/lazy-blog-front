/* PostsList.tsx */
"use client";

import { PublishedPostResponse, UserPostItem, UserResponse } from "@/api/apis";
import PostPreview from "@/components/posts/post-preview";

interface PostsListProps {
  posts: PublishedPostResponse[] | UserPostItem[];
  author?: UserResponse | null;
  hideAuthor?: boolean;
}

export function PostsList({ posts, author, hideAuthor }: PostsListProps) {
  return (
    <div className="flex flex-col gap-8">
      {posts.map((post) => (
        <PostPreview
          key={post.id}
          post={post}
          author={author || (post as PublishedPostResponse).author}
          hideAuthor={hideAuthor}
        />
      ))}
    </div>
  );
}
